-- Route90 Invoicer — Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to run multiple times: uses IF NOT EXISTS throughout

-- ============================================================
-- BILLING PROFILES
-- One row = one "who bills who" relationship
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_profiles (
  id                         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label                      text        NOT NULL,
  biller_company_name        text        NOT NULL,
  biller_address             text,
  biller_phone               text,
  biller_email               text,
  biller_gst_number          text,
  client_company_name        text        NOT NULL,
  client_care_of             text,
  client_address             text,
  client_email               text,
  invoice_prefix             text        NOT NULL DEFAULT 'INV',
  default_gst_rate           numeric(4,3) NOT NULL DEFAULT 0.050,
  default_payment_terms_days integer     NOT NULL DEFAULT 30,
  is_active                  boolean     NOT NULL DEFAULT true,
  created_at                 timestamptz          DEFAULT now()
);

ALTER TABLE billing_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- DRIVERS
-- One row per driver
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text        NOT NULL,
  license_class text,
  phone         text,
  email         text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz          DEFAULT now()
);

ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRUCKS
-- One row per truck/unit
-- ============================================================
CREATE TABLE IF NOT EXISTS trucks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number text        NOT NULL,
  plate_number text,
  province    text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz          DEFAULT now()
);

ALTER TABLE trucks DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- RATE RULES
-- One row per driver configuration + rate
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_rules (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_profile_id      uuid          REFERENCES billing_profiles(id),
  label                   text          NOT NULL,
  crew_type               text          NOT NULL CHECK (crew_type IN ('solo', 'team')),
  driver_ids              uuid[],
  driver_names_snapshot   text[],
  rate_per_mile           numeric(6,4)  NOT NULL,
  is_active               boolean       NOT NULL DEFAULT true,
  created_at              timestamptz             DEFAULT now()
);

ALTER TABLE rate_rules DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rate_rules_billing_profile
  ON rate_rules (billing_profile_id);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_profile_id   uuid          NOT NULL REFERENCES billing_profiles(id),
  invoice_number       text          NOT NULL UNIQUE,
  invoice_date         date          NOT NULL,
  due_date             date,
  period_start         date,
  period_end           date,
  status               text          NOT NULL DEFAULT 'draft'
                                     CHECK (status IN ('draft', 'sent', 'paid')),
  subtotal             numeric(10,2) NOT NULL DEFAULT 0,
  gst_amount           numeric(10,2) NOT NULL DEFAULT 0,
  gst_rate_snapshot    numeric(4,3)  NOT NULL DEFAULT 0.050,
  total                numeric(10,2) NOT NULL DEFAULT 0,
  notes                text,
  created_by           uuid          REFERENCES auth.users(id),
  created_at           timestamptz             DEFAULT now(),
  updated_at           timestamptz             DEFAULT now()
);

ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invoices_billing_profile
  ON invoices (billing_profile_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices (status);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date
  ON invoices (invoice_date);

-- ============================================================
-- TRIPS
-- Line items inside an invoice
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id               uuid          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sort_order               integer       NOT NULL DEFAULT 0,
  rig_invoice_number       text,
  order_numbers            text[],
  truck_id                 uuid          REFERENCES trucks(id),
  truck_number_snapshot    text,
  rate_rule_id             uuid          REFERENCES rate_rules(id),
  crew_type                text          NOT NULL DEFAULT 'solo',
  driver_names_snapshot    text[],
  rate_per_mile_snapshot   numeric(6,4)  NOT NULL,
  trip_date_start          date,
  trip_date_end            date,
  pickup_city              text,
  delivery_city            text,
  route_summary            text,
  total_km                 numeric(10,2),
  total_miles              numeric(10,2) NOT NULL DEFAULT 0,
  amount                   numeric(10,2) NOT NULL DEFAULT 0,
  border_fee               numeric(10,2),
  border_fee_note          text,
  trip_sheet_image_path    text,
  created_at               timestamptz             DEFAULT now()
);

ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_trips_invoice
  ON trips (invoice_id);
