{% include 'erpnext/selling/sales_common.js' %}

frappe.ui.form.on("Sales Order", {
	setup: function(frm) {
		frm.custom_make_buttons = {
			'Job Form': "Job Form"
		}
	}
});

erpnext.selling.SalesOrderController = erpnext.selling.SellingController.extend({
	refresh: function(doc, dt, dn) {
		var me = this;
		this._super();
		let allow_delivery = false;

		if (doc.docstatus==1) {
			if(doc.status !== 'Closed') {
				if(doc.status !== 'On Hold') {
					// job form
					if(flt(doc.per_delivered, 6) < 100 && (order_is_a_sale || order_is_a_custom_sale) && allow_delivery) {
						this.frm.add_custom_button(__('Job Form'), () => this.make_job_form(), __('Create'));
					}
				}
			}
		}
	},

	make_job_form() {
		var me = this;
		this.frm.call({
			doc: this.frm.doc,
			method: 'worx_v2.custompy.sales_order.get_job_form_items',
			callback: function(r) {
				if(!r.message) {
					frappe.msgprint({
						title: __('Job Form not created'),
						message: __('No Items with Bill of Materials to Manufacture'),
						indicator: 'orange'
					});
					return;
				}
				else if(!r.message) {
					frappe.msgprint({
						title: __('Job Form not created'),
						message: __('Job Form already created for all items with BOM'),
						indicator: 'orange'
					});
					return;
				} 
				else {
							me.frm.call({
								method: 'worx_v2.custompy.sales_order.make_job_form',
								args: {
									name: me.frm.doc.name,
									doc: me.frm.doc,
									items: me.frm.doc.items
								},
								freeze: true,
								callback: function(r) {
									if(r.message) {
										frappe.msgprint({
											message: __('Job Form Created: {0}', [r.message.map(function(d) {
													return repl('<a href="/app/job-form/%(name)s">%(name)s</a>', {name:d})
												}).join(', ')]),
											indicator: 'green'
										})
									}
									d.hide();
								}
							});
					}
			}
		});
	}
});
$.extend(cur_frm.cscript, new erpnext.selling.SalesOrderController({frm: cur_frm}));