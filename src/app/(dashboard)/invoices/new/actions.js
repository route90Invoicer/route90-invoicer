'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveInvoice(invoiceData, trips) {
  const supabase = createClient()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      billing_profile_id:  invoiceData.billing_profile_id,
      invoice_number:      invoiceData.invoice_number,
      invoice_date:        invoiceData.invoice_date,
      due_date:            invoiceData.due_date || null,
      period_start:        invoiceData.period_start || null,
      period_end:          invoiceData.period_end   || null,
      status:              invoiceData.status ?? 'draft',
      subtotal:            invoiceData.subtotal,
      gst_amount:          invoiceData.gst_amount,
      gst_rate_snapshot:   invoiceData.gst_rate_snapshot,
      total:               invoiceData.total,
      notes:               invoiceData.notes || null,
    })
    .select('id')
    .single()

  if (invoiceError) return { error: invoiceError.message }

  const invoiceId = invoice.id

  const tripRows = trips.map((t, i) => ({
    invoice_id:               invoiceId,
    sort_order:               i,
    rig_invoice_number:       t.rig_invoice_number   || null,
    order_numbers:            t.order_numbers_arr    || [],
    truck_id:                 t.truck_id             || null,
    truck_number_snapshot:    t.truck_number_snapshot || null,
    rate_rule_id:             t.rate_rule_id         || null,
    crew_type:                t.crew_type            || 'solo',
    driver_names_snapshot:    t.driver_names_snapshot || [],
    rate_per_mile_snapshot:   parseFloat(t.rate_per_mile_snapshot) || 0,
    trip_date_start:          t.trip_date_start      || null,
    trip_date_end:            t.trip_date_end        || null,
    pickup_city:              t.pickup_city          || null,
    delivery_city:            t.delivery_city        || null,
    route_summary:            t.route_summary        || null,
    total_km:                 t.total_km ? parseFloat(t.total_km) : null,
    total_miles:              parseFloat(t.total_miles) || 0,
    amount:                   parseFloat(t.amount)   || 0,
    border_fee:               t.has_border_fee ? (parseFloat(t.border_fee) || null) : null,
    border_fee_note:          t.has_border_fee ? (t.border_fee_note || null) : null,
  }))

  const { error: tripsError } = await supabase.from('trips').insert(tripRows)

  if (tripsError) {
    await supabase.from('invoices').delete().eq('id', invoiceId)
    return { error: tripsError.message }
  }

  return { invoiceId }
}
