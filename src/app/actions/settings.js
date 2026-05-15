'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Billing Profiles ---

export async function createBillingProfile(data) {
  const supabase = createClient()

  const { error } = await supabase.from('billing_profiles').insert({
    label: data.label,
    biller_company_name: data.biller_company_name,
    biller_address: data.biller_address || null,
    biller_phone: data.biller_phone || null,
    biller_email: data.biller_email || null,
    biller_gst_number: data.biller_gst_number || null,
    client_company_name: data.client_company_name,
    client_care_of: data.client_care_of || null,
    client_address: data.client_address || null,
    client_email: data.client_email || null,
    invoice_prefix: data.invoice_prefix,
    default_gst_rate: parseFloat(data.default_gst_rate) / 100,
    default_payment_terms_days: parseInt(data.default_payment_terms_days),
  })

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

export async function updateBillingProfile(id, data) {
  if (!id) throw new Error('id is required')
  const supabase = createClient()

  const { error } = await supabase
    .from('billing_profiles')
    .update({
      label: data.label,
      biller_company_name: data.biller_company_name,
      biller_address: data.biller_address || null,
      biller_phone: data.biller_phone || null,
      biller_email: data.biller_email || null,
      biller_gst_number: data.biller_gst_number || null,
      client_company_name: data.client_company_name,
      client_care_of: data.client_care_of || null,
      client_address: data.client_address || null,
      client_email: data.client_email || null,
      invoice_prefix: data.invoice_prefix,
      default_gst_rate: parseFloat(data.default_gst_rate) / 100,
      default_payment_terms_days: parseInt(data.default_payment_terms_days),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

// --- Drivers ---

export async function createDriver(data) {
  const supabase = createClient()

  const { error } = await supabase.from('drivers').insert({
    full_name: data.full_name,
    license_class: data.license_class || null,
    phone: data.phone || null,
    email: data.email || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

export async function updateDriver(id, data) {
  if (!id) throw new Error('id is required')
  const supabase = createClient()

  const { error } = await supabase
    .from('drivers')
    .update({
      full_name: data.full_name,
      license_class: data.license_class || null,
      phone: data.phone || null,
      email: data.email || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

export async function toggleDriverActive(id, isActive) {
  if (!id) throw new Error('id is required')
  const supabase = createClient()

  const { error } = await supabase
    .from('drivers')
    .update({ is_active: Boolean(isActive) })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

// --- Trucks ---

export async function createTruck(data) {
  const supabase = createClient()

  const { error } = await supabase.from('trucks').insert({
    unit_number: data.unit_number,
    plate_number: data.plate_number || null,
    province: data.province || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

export async function updateTruck(id, data) {
  if (!id) throw new Error('id is required')
  const supabase = createClient()

  const { error } = await supabase
    .from('trucks')
    .update({
      unit_number: data.unit_number,
      plate_number: data.plate_number || null,
      province: data.province || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

export async function toggleTruckActive(id, isActive) {
  if (!id) throw new Error('id is required')
  const supabase = createClient()

  const { error } = await supabase
    .from('trucks')
    .update({ is_active: Boolean(isActive) })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

// --- Rate Rules ---

export async function createRateRule(data) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('rate_rules').insert({
    billing_profile_id: data.billing_profile_id,
    label: data.label,
    crew_type: data.crew_type,
    driver_ids: data.driver_ids,
    driver_names_snapshot: data.driver_names_snapshot,
    rate_per_mile: parseFloat(data.rate_per_mile),
    created_by: user?.id ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

export async function updateRateRule(id, data) {
  if (!id) throw new Error('id is required')
  const supabase = createClient()

  const { error } = await supabase
    .from('rate_rules')
    .update({
      billing_profile_id: data.billing_profile_id,
      label: data.label,
      crew_type: data.crew_type,
      driver_ids: data.driver_ids,
      driver_names_snapshot: data.driver_names_snapshot,
      rate_per_mile: parseFloat(data.rate_per_mile),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

export async function toggleRateRuleActive(id, isActive) {
  if (!id) throw new Error('id is required')
  const supabase = createClient()

  const { error } = await supabase
    .from('rate_rules')
    .update({ is_active: Boolean(isActive) })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}
