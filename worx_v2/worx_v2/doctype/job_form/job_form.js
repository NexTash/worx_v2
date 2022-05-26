	// Copyright (c) 2022, Usama Naveed and contributors
// For license information, please see license.txt

frappe.ui.form.on('Job Form', {
	refresh: function(frm){
		if(frm.doc.docstatus === 1){
			frm.add_custom_button(__('Stock Entry'), function() {
				erpnext.job_form.make_se(frm, 'Manufacture');
			}, __("Create"));
		}
	},
	bom_no: function(frm){
		if(frm.doc.bom_no){
			frappe.call({
				"method": "worx_v2.worx_v2.doctype.job_form.job_form.get_bom_items",
				"args": {
					"bom": cur_frm.doc.bom_no
				},
				callback: function(r){
					if(r.message){
						cur_frm.clear_table("required_items"); 
						console.log(r.message);
						for(var i in r.message){ 
							var row = cur_frm.add_child("required_items");
							row.item_code = r.message[i].item_code;
							row.item_name = r.message[i].item_name;
							row.description = r.message[i].description;
							row.source_warehouse = "Worx - WI";
							row.required_qty = r.message[i].qty;
							row.include_item_in_manufacturing = r.message[i].include_item_in_manufacturing;
							row.unit = r.message[i].uom;
							row.rate = r.message[i].rate;
							row.amount = r.message[i].qty * r.message[i].rate;
							cur_frm.refresh_fields("required_items");
						}
					}
				}
			});
		}		
	},
	before_save: function(frm){
		var jb = frm.doc.job_item;
		var s_price = 0;
		var req_it = frm.doc.required_items;
		var m_cost = 0;
		for(var i in jb){
			s_price = s_price + jb[i].qty * jb[i].unit_selling_price;
		}
		for(var i in req_it){
			m_cost = m_cost + req_it[i].amount;
		}
		frm.set_value("manufacturing_cost", m_cost);
		frm.set_value("selling_price", s_price);
		frm.set_value("profit", s_price - m_cost);
	}
});
frappe.ui.form.on("Work Order Item", {
	item_code:function(frm, cdt, cdn){
		let row = locals[cdt][cdn];
		row.required_qty = 1;
		if(row.item_code){
			frappe.db.get_value("Item Price", {"item_code":row.item_code, "buying":1}, "price_list_rate").then((r)=>{
				if(r.message.price_list_rate){
					let price = 0;
					if(r.message.price_list_rate){
						price = r.message.price_list_rate
					}
					row.rate = price;
					row.amount = row.required_qty * price
					frm.refresh();
				}
			})
		}
	},
	required_qty:function(frm, cdt, cdn){
		let row = locals[cdt][cdn];
		row.amount = row.required_qty * row.rate;
		frm.refresh();
	}
})

erpnext.job_form = {
	make_se: function(frm, purpose) {
		this.show_prompt_for_qty_input(frm, purpose)
			.then(data => {
				return frappe.xcall('worx_v2.worx_v2.doctype.job_form.job_form.make_stock_entry', {
					'job_form_id': frm.doc.name,
					'purpose': purpose,
					'mqt': data.mqt,
					'pqt': data.pqt,
					'qty': data.qty
				});
			}).then(stock_entry => {
				frappe.model.sync(stock_entry);
				frappe.set_route('Form', stock_entry.doctype, stock_entry.name);
			});

	},
	get_max_transferable_qty: (frm, purpose) => {
		let max = 0;
		
		var it = frm.doc.job_item;
		var mqt = 0;
		var pqt = 0;	
		for(var i in it ){
			mqt += it[i].qty;
			pqt += it[i].produced_qty;
		}
		max = flt(mqt) - flt(pqt);
		
		return flt(max, precision('qty'));
	},
	show_prompt_for_qty_input: function(frm, purpose) {
		let max = this.get_max_transferable_qty(frm, purpose);
		return new Promise((resolve, reject) => {
			frappe.prompt({
				fieldtype: 'Float',
				label: __('Qty for {0}', [purpose]),
				fieldname: 'qty',
				default: [max]
			}, data => {
				var it = frm.doc.job_item;
				var mqt = 0;
				var pqt = 0;
				for(var i in it ){
					mqt += it[i].qty;
					pqt += it[i].produced_qty;
				}
				max = mqt - pqt;
				if (data.qty > max) {
					frappe.msgprint(__('Quantity must not be more than {0}', [max]));
					reject();
				}
				data.purpose = purpose;
				data.mqt = mqt;
				data.pqt = pqt;
				resolve(data);
			}, __('Select Quantity'), __('Create'));
		});
	},
};
