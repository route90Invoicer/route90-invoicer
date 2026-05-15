import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewInvoiceForm from '@/components/forms/NewInvoiceForm'

export const metadata = { title: 'Edit Invoice — Route90 Invoicer' }

function dbTripToFormTrip(t) {
  return {
    rig_invoice_number:     t.rig_invoice_number    ?? '',
    order_numbers:          (t.order_numbers ?? []).join(', '),
    trip_date_start:        t.trip_date_start       ?? '',
    trip_date_end:          t.trip_date_end         ?? '',
    truck_id:               t.truck_id              ?? '',
    truck_number_snapshot:  t.truck_number_snapshot ?? '',
    rate_rule_id:           t.rate_rule_id          ?? '',
    crew_type:              t.crew_type             ?? 'solo',
    driver_names_snapshot:  t.driver_names_snapshot ?? [],
    rate_per_mile_snapshot: t.rate_per_mile_snapshot ?? 0,
    pickup_city:            t.pickup_city           ?? '',
    delivery_city:          t.delivery_city         ?? '',
    route_summary:          t.route_summary         ?? '',
    total_km:               t.total_km    ? String(t.total_km)    : '',
    total_miles:            t.total_miles ? String(t.total_miles) : '',
    amount:                 t.amount ?? 0,
    has_border_fee:         t.border_fee != null && parseFloat(t.border_fee) > 0,
    border_fee:             t.border_fee ? String(t.border_fee) : '',
    border_fee_note:        t.border_fee_note ?? '',
  }
}

export default async function EditInvoicePage({ params }) {
  const supabase = createClient()

  const [
    { data: invoice },
    { data: trips },
    { data: billingProfiles },
    { data: trucks },
    { data: allRateRules },
  ] = await Promise.all([
    supabase.from('invoices').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('trips').select('*').eq('invoice_id', params.id).order('sort_order'),
    supabase.from('billing_profiles').select('*').eq('is_active', true).order('label'),
    supabase.from('trucks').select('*').eq('is_active', true).order('unit_number'),
    supabase.from('rate_rules').select('*').eq('is_active', true).order('label'),
  ])

  if (!invoice) notFound()

  const initialData = {
    billing_profile_id: invoice.billing_profile_id,
    invoice_number:     invoice.invoice_number,
    invoice_date:       invoice.invoice_date ?? '',
    due_date:           invoice.due_date     ?? '',
    period_start:       invoice.period_start ?? '',
    period_end:         invoice.period_end   ?? '',
    status:             invoice.status,
    gst_rate_snapshot:  invoice.gst_rate_snapshot ?? null,
    notes:              invoice.notes        ?? '',
    trips:              (trips ?? []).map(dbTripToFormTrip),
  }

  return (
    <NewInvoiceForm
      billingProfiles={billingProfiles ?? []}
      trucks={trucks ?? []}
      allRateRules={allRateRules ?? []}
      mode="edit"
      initialData={initialData}
      invoiceId={params.id}
    />
  )
}
