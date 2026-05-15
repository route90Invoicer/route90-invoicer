-- Route90 Invoicer — Dev Seed Data
-- Run AFTER 20260511000001_initial_schema.sql
-- Safe to re-run only on a fresh database (will error on duplicate label/name if run twice)

-- ============================================================
-- BILLING PROFILE
-- ============================================================
INSERT INTO billing_profiles (
  label,
  biller_company_name,
  biller_address,
  biller_gst_number,
  client_company_name,
  client_care_of,
  client_address,
  invoice_prefix,
  default_gst_rate,
  default_payment_terms_days
) VALUES (
  'Route90 → Rig Logistics',
  'Route90 Trucking Inc.',
  '309-1060 Moncton Ave, Winnipeg, MB R2K 1Z1',
  '76450 8164 RT0001',
  '10171686 Manitoba Ltd.',
  'c/o Rig Logistics Inc.',
  '#4, 10 Wrangler Place S.E., Rocky View, AB T1X 0L7',
  'R90',
  0.050,
  30
);

-- ============================================================
-- DRIVERS
-- ============================================================
INSERT INTO drivers (full_name, license_class) VALUES
  ('Navdeep Singh',         'Class 1'),
  ('Dilbag Singh Dhaliwal', 'Class 1'),
  ('Rohit Lakhi',           'Class 1'),
  ('Harpreet Singh',        'Class 1');

-- ============================================================
-- TRUCKS
-- ============================================================
INSERT INTO trucks (unit_number, plate_number, province) VALUES
  ('101', '', 'MB'),
  ('102', '', 'MB');

-- ============================================================
-- RATE RULES
-- CTEs resolve driver + billing profile IDs by name so this
-- stays readable and order-independent.
-- ============================================================
WITH
  bp  AS (SELECT id FROM billing_profiles WHERE label = 'Route90 → Rig Logistics'),
  nav AS (SELECT id FROM drivers WHERE full_name = 'Navdeep Singh'),
  dil AS (SELECT id FROM drivers WHERE full_name = 'Dilbag Singh Dhaliwal'),
  roh AS (SELECT id FROM drivers WHERE full_name = 'Rohit Lakhi'),
  har AS (SELECT id FROM drivers WHERE full_name = 'Harpreet Singh')
INSERT INTO rate_rules
  (billing_profile_id, label, crew_type, driver_ids, driver_names_snapshot, rate_per_mile, is_active)
VALUES
  (
    (SELECT id FROM bp),
    'Solo — Navdeep',
    'solo',
    ARRAY[(SELECT id FROM nav)],
    ARRAY['Navdeep Singh'],
    0.5200,
    true
  ),
  (
    (SELECT id FROM bp),
    'Team — Navdeep + Dilbag',
    'team',
    ARRAY[(SELECT id FROM nav), (SELECT id FROM dil)],
    ARRAY['Navdeep Singh', 'Dilbag Singh Dhaliwal'],
    0.3200,
    true
  ),
  (
    (SELECT id FROM bp),
    'Team — Navdeep + Rohit',
    'team',
    ARRAY[(SELECT id FROM nav), (SELECT id FROM roh)],
    ARRAY['Navdeep Singh', 'Rohit Lakhi'],
    0.3400,
    true
  ),
  (
    (SELECT id FROM bp),
    'Team — Navdeep + Harpreet',
    'team',
    ARRAY[(SELECT id FROM nav), (SELECT id FROM har)],
    ARRAY['Navdeep Singh', 'Harpreet Singh'],
    0.0000,
    false
  );
