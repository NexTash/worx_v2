
from __future__ import unicode_literals
import frappe
import json
import frappe.utils
from frappe.utils import cstr, flt, getdate, cint, nowdate, add_days, get_link_to_form, strip_html
from frappe import _


@frappe.whitelist()
def get_job_form_items(self, for_raw_material_request=0):
		'''Returns items with BOM that already do not have a linked job form'''
		items = []
		item_codes = [i.item_code for i in self.items]
		product_bundle_parents = [pb.new_item_code for pb in frappe.get_all("Product Bundle", {"new_item_code": ["in", item_codes]}, ["new_item_code"])]

		for table in [self.items, self.packed_items]:
			for i in table:
				bom = get_default_bom_item(i.item_code)
				stock_qty = i.qty if i.doctype == 'Packed Item' else i.stock_qty
				if not for_raw_material_request:
					total_work_order_qty = flt(frappe.db.sql('''select sum(qty) from `tabJob Form`
						where production_item=%s and sales_order=%s and sales_order_item = %s and docstatus<2''', (i.item_code, self.name, i.name))[0][0])
					pending_qty = stock_qty - total_work_order_qty
				else:
					pending_qty = stock_qty

				if pending_qty and i.item_code not in product_bundle_parents:
					if bom:
						items.append(dict(
							name= i.name,
							item_code= i.item_code,
							description= i.description,
							bom = bom,
							warehouse = i.warehouse,
							pending_qty = pending_qty,
							required_qty = pending_qty if for_raw_material_request else 0,
							sales_order_item = i.name
						))
					else:
						items.append(dict(
							name= i.name,
							item_code= i.item_code,
							description= i.description,
							bom = '',
							warehouse = i.warehouse,
							pending_qty = pending_qty,
							required_qty = pending_qty if for_raw_material_request else 0,
							sales_order_item = i.name
						))
		return items

@frappe.whitelist()
def make_job_form(name,doc,items):
	'''Make Work Orders against the given Sales Order for the given `items`'''
	if not frappe.db.exists("Job Form", {"sales_order": name}):
		sl = json.loads(doc)
		item = json.loads(items)
		out = []

		job_form = frappe.get_doc({
			'doctype': 'Job Form',
			'company': sl['company'],
			'sales_order': sl['name'],
			'fg_warehouse': 'Worx - WI'
		})
		for i in item:
			job_form.append('job_item',{
				'production_item': i['item_code'],
				'item_name': i['item_name'],
				'description': i['description'],
				'qty': i['qty'],
				'unit_selling_price': i['rate']
			})
		job_form.insert()
		job_form.save()
		out.append(job_form)
	else:
		frappe.throw(_("Job Form already created of this Sales Order"))

	return [p.name for p in out]

def get_default_bom_item(item_code):
	bom = frappe.get_all('BOM', dict(item=item_code, is_active=True),
			order_by='is_default desc')
	bom = bom[0].name if bom else None

	return bom

# @frappe.whitelist()
# def test():
# 	print("OKKKK")