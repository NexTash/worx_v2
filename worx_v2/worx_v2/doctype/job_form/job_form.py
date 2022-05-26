# -*- coding: utf-8 -*-
# Copyright (c) 2022, Usama Naveed and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import flt, get_datetime, getdate, date_diff, cint, nowdate, get_link_to_form, time_diff_in_hours
from frappe import _, msgprint, throw

class JobForm(Document):
	pass

@frappe.whitelist()
def get_bom_items(bom):
	bom_items =frappe.db.sql("""SELECT item_code, item_name, description, include_item_in_manufacturing, uom, rate, qty
    						FROM `tabBOM Item` WHERE parent = %s""", bom, as_dict=1)

	return bom_items	


@frappe.whitelist()
def make_stock_entry(job_form_id, purpose, mqt, pqt, qty=None):
	if not frappe.db.exists("Stock Entry", {"job_form": job_form_id}):
		job_form = frappe.get_doc("Job Form", job_form_id)
		if not frappe.db.get_value("Warehouse", job_form.wip_warehouse, "is_group"):
			wip_warehouse = job_form.wip_warehouse
		else:
			wip_warehouse = None

		stock_entry = frappe.new_doc("Stock Entry")
		stock_entry.purpose = purpose
		stock_entry.job_form = job_form_id
		stock_entry.company = job_form.company
		stock_entry.from_bom = 1
		stock_entry.bom_no = job_form.bom_no
		stock_entry.use_multi_level_bom = job_form.use_multi_level_bom
		stock_entry.fg_completed_qty = qty or (flt(mqt) - flt(pqt))
		if job_form.bom_no:
			stock_entry.inspection_required = frappe.db.get_value('BOM',
				job_form.bom_no, 'inspection_required')

		if purpose=="Material Transfer for Manufacture":
			stock_entry.to_warehouse = wip_warehouse
			stock_entry.project = job_form.project
		else:
			stock_entry.from_warehouse = wip_warehouse
			stock_entry.to_warehouse = job_form.fg_warehouse
			stock_entry.project = job_form.project
	else:
		frappe.throw(_("Stock Entry already created of this Job Form"))

	stock_entry.set_stock_entry_type()
	stock_entry.get_items()
	return stock_entry.as_dict()
