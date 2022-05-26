# -*- coding: utf-8 -*-
from __future__ import unicode_literals

__version__ = '0.0.1'
import frappe

@frappe.whitelist()
def get_items(jf):
	s=[]
	t=[]
	t_qty = 0
	t_amount = 0
	doc = frappe.get_doc("Job Form",jf)
	for i in doc.get("job_item"):
		t_qty += i.qty
		t.append({"item_code":i.production_item,"item_name":i.item_name,"description":i.description,"qty":i.qty})

	for i in doc.get("required_items"):
		t_amount += i.amount
		cf = frappe.db.sql('''select u.conversion_factor as c from `tabItem` as i inner join `tabUOM Conversion Detail` as u on u.parent = i.name where u.uom = %s''',i.unit,as_dict=1)
		s.append({"item_code":i.item_code,"qty":float(i.required_qty),"uom":i.unit,"rate":i.rate,"c_fac":cf[0]['c']})
	
	return s, t, t_qty, t_amount
