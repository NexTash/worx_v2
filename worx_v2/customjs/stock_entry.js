frappe.ui.form.on('Stock Entry', {
    get_items_from_job_form(frm) {
	    if(frm.doc.job_form){
	        frappe.call({
					method: "worx_v2.__init__.get_items",
					args: {
						"jf": frm.doc.job_form
					},
					callback: function(r) {
						if(r.message) {
						    console.log(r.message[0],r.message[1],r.message[2]);
						    let t_qty = r.message[2];
						    let t_amt = r.message[3];
						    let t_rate = t_amt/t_qty;
						    let s = r.message[0];
						    let t = r.message[1];
						    cur_frm.clear_table("items");
						    cur_frm.refresh_fields();
						    for(var i=0;i<s.length;i++){
    				 			var childTable = cur_frm.add_child("items");
    				 			childTable.item_code = s[i]["item_code"],
    				 			childTable.qty = s[i]["qty"],
    				 			childTable.transfer_qty = s[i]["qty"] * s[i]['c_fac'],
    				 			childTable.uom = s[i]['uom'],
    				 			childTable.stock_uom = s[i]['uom'],
    				 			childTable.conversion_factor = s[i]['c_fac'],
    				 			childTable.basic_rate = s[i]['rate'],
    				 			childTable.basic_amount = s[i]['rate'] * s[i]["qty"],
    				 			childTable.s_warehouse = frm.doc.from_warehouse,
    				 			cur_frm.refresh_field("items");
					     	}
					    
					         for(var i=0;i<t.length;i++){
    				 			var childTable = cur_frm.add_child("items");
    				 			childTable.item_code = t[i]["item_code"],
    				 			childTable.item_name = t[i]["item_name"],
    				 			childTable.description = t[i]["description"],
    			     			childTable.t_warehouse = frm.doc.to_warehouse,
    				 			childTable.qty = t[i]["qty"],
    				 			childTable.transfer_qty = t[i]["qty"],
    				 			childTable.uom = s[0]['uom'],
    				 			childTable.stock_uom = s[0]['uom'],
    				 			childTable.conversion_factor = s[0]['c_fac'],
    				 			childTable.basic_rate = t_rate;
    				 			childTable.basic_amount = t_rate * t[i]["qty"],
    				 			cur_frm.refresh_field("items");
    			     		}
						}
					}
				});
	    }
	}
});