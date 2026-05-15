# Settings Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/settings` with four tabs (Billing Profiles, Drivers, Trucks, Rate Rules) — each with a list view and add/edit modal, backed by Next.js Server Actions.

**Architecture:** `settings/page.js` is a Server Component that fetches all four tables in parallel and passes data as props to `SettingsTabs` (Client Component). All mutations go through Server Actions in `src/app/actions/settings.js` which call `revalidatePath('/settings')`. Client Components call `router.refresh()` after each mutation to pull fresh data from the server.

**Tech Stack:** Next.js 14 App Router, Server Actions, Supabase server client (`@/lib/supabase/server`), `revalidatePath`, `useRouter`, existing UI library (Button, Card, DataTable, Modal, FormField, Badge, EmptyState).

---

## File Map

```
src/
├── app/
│   ├── actions/
│   │   └── settings.js                  CREATE — all CRUD server actions
│   └── (dashboard)/
│       └── settings/
│           └── page.js                  MODIFY — replace stub with data fetch
└── components/
    ├── settings/                         CREATE directory
    │   ├── SettingsTabs.js               tab bar + tab panel routing
    │   ├── BillingProfilesTab.js         list + modal state for billing profiles
    │   ├── BillingProfileModal.js        controlled form, all 13 fields
    │   ├── DriversTab.js                 list with avatar initials + toggle
    │   ├── DriverModal.js                4-field form
    │   ├── TrucksTab.js                  list + toggle
    │   ├── TruckModal.js                 3-field form
    │   ├── RateRulesTab.js               list with badges + toggle
    │   └── RateRuleModal.js              profile dropdown, radio, driver checkboxes
    └── ui/
        └── ToggleSwitch.js               CREATE — iOS-style toggle, used by 3 tabs
```

---

## Task 1: Server Actions + ToggleSwitch component

**Files:**
- Create: `src/app/actions/settings.js`
- Create: `src/components/ui/ToggleSwitch.js`

- [ ] **Step 1: Create `src/app/actions/settings.js`**

```js
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── BILLING PROFILES ─────────────────────────────────────────────

export async function createBillingProfile(data) {
  const supabase = createClient()
  const { error } = await supabase.from('billing_profiles').insert({
    label:                       data.label,
    biller_company_name:         data.biller_company_name,
    biller_address:              data.biller_address  || null,
    biller_phone:                data.biller_phone    || null,
    biller_email:                data.biller_email    || null,
    biller_gst_number:           data.biller_gst_number || null,
    client_company_name:         data.client_company_name,
    client_care_of:              data.client_care_of  || null,
    client_address:              data.client_address  || null,
    client_email:                data.client_email    || null,
    invoice_prefix:              data.invoice_prefix  || 'INV',
    default_gst_rate:            parseFloat(data.default_gst_rate) / 100,
    default_payment_terms_days:  parseInt(data.default_payment_terms_days, 10) || 30,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateBillingProfile(id, data) {
  const supabase = createClient()
  const { error } = await supabase
    .from('billing_profiles')
    .update({
      label:                       data.label,
      biller_company_name:         data.biller_company_name,
      biller_address:              data.biller_address  || null,
      biller_phone:                data.biller_phone    || null,
      biller_email:                data.biller_email    || null,
      biller_gst_number:           data.biller_gst_number || null,
      client_company_name:         data.client_company_name,
      client_care_of:              data.client_care_of  || null,
      client_address:              data.client_address  || null,
      client_email:                data.client_email    || null,
      invoice_prefix:              data.invoice_prefix  || 'INV',
      default_gst_rate:            parseFloat(data.default_gst_rate) / 100,
      default_payment_terms_days:  parseInt(data.default_payment_terms_days, 10) || 30,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

// ── DRIVERS ──────────────────────────────────────────────────────

export async function createDriver(data) {
  const supabase = createClient()
  const { error } = await supabase.from('drivers').insert({
    full_name:     data.full_name,
    license_class: data.license_class || null,
    phone:         data.phone         || null,
    email:         data.email         || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateDriver(id, data) {
  const supabase = createClient()
  const { error } = await supabase
    .from('drivers')
    .update({
      full_name:     data.full_name,
      license_class: data.license_class || null,
      phone:         data.phone         || null,
      email:         data.email         || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function toggleDriverActive(id, isActive) {
  const supabase = createClient()
  const { error } = await supabase
    .from('drivers')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

// ── TRUCKS ───────────────────────────────────────────────────────

export async function createTruck(data) {
  const supabase = createClient()
  const { error } = await supabase.from('trucks').insert({
    unit_number:  data.unit_number,
    plate_number: data.plate_number || null,
    province:     data.province     || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateTruck(id, data) {
  const supabase = createClient()
  const { error } = await supabase
    .from('trucks')
    .update({
      unit_number:  data.unit_number,
      plate_number: data.plate_number || null,
      province:     data.province     || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function toggleTruckActive(id, isActive) {
  const supabase = createClient()
  const { error } = await supabase
    .from('trucks')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

// ── RATE RULES ───────────────────────────────────────────────────

export async function createRateRule(data) {
  const supabase = createClient()
  const { error } = await supabase.from('rate_rules').insert({
    billing_profile_id:    data.billing_profile_id,
    label:                 data.label,
    crew_type:             data.crew_type,
    driver_ids:            data.driver_ids,
    driver_names_snapshot: data.driver_names_snapshot,
    rate_per_mile:         parseFloat(data.rate_per_mile),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateRateRule(id, data) {
  const supabase = createClient()
  const { error } = await supabase
    .from('rate_rules')
    .update({
      billing_profile_id:    data.billing_profile_id,
      label:                 data.label,
      crew_type:             data.crew_type,
      driver_ids:            data.driver_ids,
      driver_names_snapshot: data.driver_names_snapshot,
      rate_per_mile:         parseFloat(data.rate_per_mile),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function toggleRateRuleActive(id, isActive) {
  const supabase = createClient()
  const { error } = await supabase
    .from('rate_rules')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
```

- [ ] **Step 2: Create `src/components/ui/ToggleSwitch.js`**

```js
'use client'

export default function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        border: 'none',
        padding: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: checked ? '#4F46E5' : '#D1D1D6',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transform: checked ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 0.2s ease',
      }} />
    </button>
  )
}
```

- [ ] **Step 3: Verify build**

```powershell
cd C:\Users\navi9\code\Projects\Route90-Invoicer
npx next build 2>&1 | Select-String -Pattern "error|Error|warning" | head -20
```

Expected: No new errors. The settings page still renders its stub.

- [ ] **Step 4: Commit**

```powershell
git add src/app/actions/settings.js src/components/ui/ToggleSwitch.js
git commit -m "feat: server actions for settings CRUD + ToggleSwitch UI component"
```

---

## Task 2: Settings page.js (data fetch) + SettingsTabs (tab shell)

**Files:**
- Modify: `src/app/(dashboard)/settings/page.js`
- Create: `src/components/settings/SettingsTabs.js`

- [ ] **Step 1: Modify `src/app/(dashboard)/settings/page.js`**

```js
import { createClient } from '@/lib/supabase/server'
import SettingsTabs from '@/components/settings/SettingsTabs'
import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Settings — Route90 Invoicer' }

export default async function SettingsPage() {
  const supabase = createClient()

  const [
    { data: billingProfiles },
    { data: drivers },
    { data: trucks },
    { data: rateRules },
  ] = await Promise.all([
    supabase.from('billing_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('drivers').select('*').order('full_name'),
    supabase.from('trucks').select('*').order('unit_number'),
    supabase.from('rate_rules').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <PageHeader title="Settings" />
      <SettingsTabs
        billingProfiles={billingProfiles ?? []}
        drivers={drivers ?? []}
        trucks={trucks ?? []}
        rateRules={rateRules ?? []}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/settings/SettingsTabs.js`**

This renders only stub panels so the page builds. Real tab content is added in Tasks 3-6.

```js
'use client'

import { useState } from 'react'

const TABS = [
  { key: 'billing',     label: 'Billing Profiles' },
  { key: 'drivers',     label: 'Drivers' },
  { key: 'trucks',      label: 'Trucks' },
  { key: 'rate-rules',  label: 'Rate Rules' },
]

const tabButtonStyle = (active) => ({
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: active ? 600 : 400,
  color: active ? '#4F46E5' : '#6E6E73',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #4F46E5' : '2px solid transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginBottom: -1,
  transition: 'color 0.15s ease',
  whiteSpace: 'nowrap',
})

export default function SettingsTabs({ billingProfiles, drivers, trucks, rateRules }) {
  const [activeTab, setActiveTab] = useState('billing')

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        marginBottom: 24,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={tabButtonStyle(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels — swapped in Tasks 3-6 */}
      {activeTab === 'billing'    && <div>Billing Profiles tab (coming)</div>}
      {activeTab === 'drivers'    && <div>Drivers tab (coming)</div>}
      {activeTab === 'trucks'     && <div>Trucks tab (coming)</div>}
      {activeTab === 'rate-rules' && <div>Rate Rules tab (coming)</div>}
    </div>
  )
}
```

- [ ] **Step 3: Start dev server and verify**

```powershell
npx next dev
```

Navigate to `http://localhost:3000/settings`. Expected: Page loads, "Settings" heading visible, 4 tab buttons render, clicking tabs switches the stub text.

- [ ] **Step 4: Commit**

```powershell
git add src/app/(dashboard)/settings/page.js src/components/settings/SettingsTabs.js
git commit -m "feat: settings page data fetch + tab bar shell"
```

---

## Task 3: Billing Profiles tab

**Files:**
- Create: `src/components/settings/BillingProfilesTab.js`
- Create: `src/components/settings/BillingProfileModal.js`
- Modify: `src/components/settings/SettingsTabs.js` (swap stub panel)

- [ ] **Step 1: Create `src/components/settings/BillingProfileModal.js`**

```js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createBillingProfile, updateBillingProfile } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

const SECTION = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: '#AEAEB2',
  marginTop: 4, marginBottom: -4,
}

function blank(profile) {
  return {
    label:                      profile?.label                      ?? '',
    biller_company_name:        profile?.biller_company_name        ?? '',
    biller_address:             profile?.biller_address             ?? '',
    biller_phone:               profile?.biller_phone               ?? '',
    biller_email:               profile?.biller_email               ?? '',
    biller_gst_number:          profile?.biller_gst_number          ?? '',
    client_company_name:        profile?.client_company_name        ?? '',
    client_care_of:             profile?.client_care_of             ?? '',
    client_address:             profile?.client_address             ?? '',
    client_email:               profile?.client_email               ?? '',
    invoice_prefix:             profile?.invoice_prefix             ?? 'INV',
    default_gst_rate:           profile
                                  ? String((parseFloat(profile.default_gst_rate) * 100).toFixed(1))
                                  : '5',
    default_payment_terms_days: String(profile?.default_payment_terms_days ?? '30'),
  }
}

export default function BillingProfileModal({ isOpen, profile, onClose }) {
  const router = useRouter()
  const [form, setForm] = useState(() => blank(profile))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) { setForm(blank(profile)); setError(null) }
  }, [isOpen, profile])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit() {
    if (!form.label.trim())               { setError('Label is required'); return }
    if (!form.biller_company_name.trim()) { setError('Biller company name is required'); return }
    if (!form.client_company_name.trim()) { setError('Client company name is required'); return }
    setLoading(true); setError(null)
    try {
      profile
        ? await updateBillingProfile(profile.id, form)
        : await createBillingProfile(form)
      router.refresh()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? 'Edit Billing Profile' : 'Add Billing Profile'}
      footer={
        <>
          {error && <span style={{ fontSize: 12, color: '#FF3B30', marginRight: 'auto' }}>{error}</span>}
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {profile ? 'Save Changes' : 'Create Profile'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormField label="Label" required>
          <input style={INPUT} value={form.label} onChange={set('label')}
            placeholder="e.g. Route90 → ABC Freight" />
        </FormField>

        <div style={SECTION}>Biller</div>

        <FormField label="Company Name" required>
          <input style={INPUT} value={form.biller_company_name} onChange={set('biller_company_name')} />
        </FormField>
        <FormField label="Address">
          <input style={INPUT} value={form.biller_address} onChange={set('biller_address')} />
        </FormField>
        <FormField label="Phone">
          <input style={INPUT} value={form.biller_phone} onChange={set('biller_phone')} />
        </FormField>
        <FormField label="Email">
          <input style={INPUT} type="email" value={form.biller_email} onChange={set('biller_email')} />
        </FormField>
        <FormField label="GST Number">
          <input style={INPUT} value={form.biller_gst_number} onChange={set('biller_gst_number')}
            placeholder="e.g. 123456789 RT0001" />
        </FormField>

        <div style={SECTION}>Client</div>

        <FormField label="Company Name" required>
          <input style={INPUT} value={form.client_company_name} onChange={set('client_company_name')} />
        </FormField>
        <FormField label="Care Of">
          <input style={INPUT} value={form.client_care_of} onChange={set('client_care_of')}
            placeholder="Optional contact name" />
        </FormField>
        <FormField label="Address">
          <input style={INPUT} value={form.client_address} onChange={set('client_address')} />
        </FormField>
        <FormField label="Email">
          <input style={INPUT} type="email" value={form.client_email} onChange={set('client_email')} />
        </FormField>

        <div style={SECTION}>Invoice Settings</div>

        <FormField label="Invoice Prefix">
          <input style={INPUT} value={form.invoice_prefix} onChange={set('invoice_prefix')}
            placeholder="INV" />
        </FormField>
        <FormField label="Default GST Rate (%)">
          <input style={INPUT} type="number" step="0.1" min="0" max="100"
            value={form.default_gst_rate} onChange={set('default_gst_rate')} />
        </FormField>
        <FormField label="Payment Terms (days)">
          <input style={INPUT} type="number" min="0"
            value={form.default_payment_terms_days} onChange={set('default_payment_terms_days')} />
        </FormField>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Create `src/components/settings/BillingProfilesTab.js`**

```js
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import BillingProfileModal from './BillingProfileModal'

export default function BillingProfilesTab({ profiles }) {
  const [modal, setModal] = useState({ open: false, profile: null })
  const open  = (profile = null) => setModal({ open: true, profile })
  const close = ()               => setModal({ open: false, profile: null })

  const columns = [
    { key: 'label', label: 'Label', width: '22%' },
    {
      key: '_rel',
      label: 'Relationship',
      render: (_, r) => (
        <span style={{ fontSize: 13 }}>
          {r.biller_company_name} <span style={{ color: '#AEAEB2' }}>→</span> {r.client_company_name}
        </span>
      ),
    },
    { key: 'invoice_prefix', label: 'Prefix', width: 80 },
    {
      key: '_edit',
      label: '',
      width: 72,
      render: (_, r) => (
        <Button variant="secondary" size="sm"
          onClick={(e) => { e.stopPropagation(); open(r) }}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" icon={Plus} onClick={() => open()}>Add Profile</Button>
      </div>
      <Card>
        <DataTable
          columns={columns}
          data={profiles}
          emptyMessage="No billing profiles yet — add one to get started."
        />
      </Card>
      <BillingProfileModal
        isOpen={modal.open}
        profile={modal.profile}
        onClose={close}
      />
    </div>
  )
}
```

- [ ] **Step 3: Wire up in SettingsTabs.js — replace billing stub**

In `src/components/settings/SettingsTabs.js`, add the import and swap the panel:

```js
// Add import at top:
import BillingProfilesTab from './BillingProfilesTab'

// Replace:
{activeTab === 'billing' && <div>Billing Profiles tab (coming)</div>}
// With:
{activeTab === 'billing' && <BillingProfilesTab profiles={billingProfiles} />}
```

- [ ] **Step 4: Verify in browser**

Navigate to `http://localhost:3000/settings`. Expected:
- Billing Profiles tab shows the list (or empty state)
- "Add Profile" opens modal with all 13 fields grouped in sections
- Fill in Label + Biller Company + Client Company → Submit → row appears in list without page reload (router.refresh re-fetches)
- Click Edit on a row → modal pre-fills → save updates the row

- [ ] **Step 5: Commit**

```powershell
git add src/components/settings/BillingProfilesTab.js src/components/settings/BillingProfileModal.js src/components/settings/SettingsTabs.js
git commit -m "feat: billing profiles tab with add/edit modal"
```

---

## Task 4: Drivers tab

**Files:**
- Create: `src/components/settings/DriversTab.js`
- Create: `src/components/settings/DriverModal.js`
- Modify: `src/components/settings/SettingsTabs.js` (swap stub)

- [ ] **Step 1: Create `src/components/settings/DriverModal.js`**

```js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createDriver, updateDriver } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

function blank(driver) {
  return {
    full_name:     driver?.full_name     ?? '',
    license_class: driver?.license_class ?? '',
    phone:         driver?.phone         ?? '',
    email:         driver?.email         ?? '',
  }
}

export default function DriverModal({ isOpen, driver, onClose }) {
  const router = useRouter()
  const [form, setForm] = useState(() => blank(driver))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) { setForm(blank(driver)); setError(null) }
  }, [isOpen, driver])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit() {
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    setLoading(true); setError(null)
    try {
      driver
        ? await updateDriver(driver.id, form)
        : await createDriver(form)
      router.refresh()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? 'Edit Driver' : 'Add Driver'}
      footer={
        <>
          {error && <span style={{ fontSize: 12, color: '#FF3B30', marginRight: 'auto' }}>{error}</span>}
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {driver ? 'Save Changes' : 'Add Driver'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormField label="Full Name" required>
          <input style={INPUT} value={form.full_name} onChange={set('full_name')} />
        </FormField>
        <FormField label="License Class">
          <input style={INPUT} value={form.license_class} onChange={set('license_class')}
            placeholder="e.g. Class 1" />
        </FormField>
        <FormField label="Phone">
          <input style={INPUT} value={form.phone} onChange={set('phone')} />
        </FormField>
        <FormField label="Email">
          <input style={INPUT} type="email" value={form.email} onChange={set('email')} />
        </FormField>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Create `src/components/settings/DriversTab.js`**

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import DriverModal from './DriverModal'
import { toggleDriverActive } from '@/app/actions/settings'

function initials(name) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function DriversTab({ drivers }) {
  const router = useRouter()
  const [modal, setModal] = useState({ open: false, driver: null })
  const open  = (driver = null) => setModal({ open: true, driver })
  const close = ()              => setModal({ open: false, driver: null })

  async function handleToggle(driver) {
    await toggleDriverActive(driver.id, !driver.is_active)
    router.refresh()
  }

  const columns = [
    {
      key: '_avatar',
      label: '',
      width: 48,
      render: (_, r) => (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          backgroundColor: '#EEF2FF', color: '#4F46E5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {initials(r.full_name)}
        </div>
      ),
    },
    { key: 'full_name', label: 'Name' },
    { key: 'license_class', label: 'License Class', width: 140 },
    {
      key: 'is_active',
      label: 'Active',
      width: 72,
      render: (val, r) => (
        <ToggleSwitch
          checked={val}
          onChange={() => handleToggle(r)}
        />
      ),
    },
    {
      key: '_edit',
      label: '',
      width: 72,
      render: (_, r) => (
        <Button variant="secondary" size="sm"
          onClick={(e) => { e.stopPropagation(); open(r) }}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" icon={Plus} onClick={() => open()}>Add Driver</Button>
      </div>
      <Card>
        <DataTable
          columns={columns}
          data={drivers}
          emptyMessage="No drivers yet — add one to get started."
        />
      </Card>
      <DriverModal isOpen={modal.open} driver={modal.driver} onClose={close} />
    </div>
  )
}
```

- [ ] **Step 3: Wire up in SettingsTabs.js**

```js
// Add import:
import DriversTab from './DriversTab'

// Replace:
{activeTab === 'drivers' && <div>Drivers tab (coming)</div>}
// With:
{activeTab === 'drivers' && <DriversTab drivers={drivers} />}
```

- [ ] **Step 4: Verify in browser**

Navigate to Settings → Drivers tab. Expected:
- List shows avatar initials (indigo circle), name, license class, toggle, edit button
- Toggle flips is_active in DB immediately and re-renders
- Add Driver modal: full_name required, submit inserts row and it appears in list
- Edit: pre-fills form, saves changes

- [ ] **Step 5: Commit**

```powershell
git add src/components/settings/DriversTab.js src/components/settings/DriverModal.js src/components/settings/SettingsTabs.js
git commit -m "feat: drivers tab with avatar, active toggle, add/edit modal"
```

---

## Task 5: Trucks tab

**Files:**
- Create: `src/components/settings/TrucksTab.js`
- Create: `src/components/settings/TruckModal.js`
- Modify: `src/components/settings/SettingsTabs.js` (swap stub)

- [ ] **Step 1: Create `src/components/settings/TruckModal.js`**

```js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createTruck, updateTruck } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

function blank(truck) {
  return {
    unit_number:  truck?.unit_number  ?? '',
    plate_number: truck?.plate_number ?? '',
    province:     truck?.province     ?? '',
  }
}

export default function TruckModal({ isOpen, truck, onClose }) {
  const router = useRouter()
  const [form, setForm] = useState(() => blank(truck))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) { setForm(blank(truck)); setError(null) }
  }, [isOpen, truck])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit() {
    if (!form.unit_number.trim()) { setError('Unit number is required'); return }
    setLoading(true); setError(null)
    try {
      truck
        ? await updateTruck(truck.id, form)
        : await createTruck(form)
      router.refresh()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={truck ? 'Edit Truck' : 'Add Truck'}
      footer={
        <>
          {error && <span style={{ fontSize: 12, color: '#FF3B30', marginRight: 'auto' }}>{error}</span>}
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {truck ? 'Save Changes' : 'Add Truck'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormField label="Unit Number" required>
          <input style={INPUT} value={form.unit_number} onChange={set('unit_number')}
            placeholder="e.g. 101" />
        </FormField>
        <FormField label="Plate Number">
          <input style={INPUT} value={form.plate_number} onChange={set('plate_number')} />
        </FormField>
        <FormField label="Province">
          <input style={INPUT} value={form.province} onChange={set('province')}
            placeholder="e.g. MB" />
        </FormField>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Create `src/components/settings/TrucksTab.js`**

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import TruckModal from './TruckModal'
import { toggleTruckActive } from '@/app/actions/settings'

export default function TrucksTab({ trucks }) {
  const router = useRouter()
  const [modal, setModal] = useState({ open: false, truck: null })
  const open  = (truck = null) => setModal({ open: true, truck })
  const close = ()             => setModal({ open: false, truck: null })

  async function handleToggle(truck) {
    await toggleTruckActive(truck.id, !truck.is_active)
    router.refresh()
  }

  const columns = [
    { key: 'unit_number',  label: 'Unit #',  width: 100 },
    { key: 'plate_number', label: 'Plate',   width: 140 },
    { key: 'province',     label: 'Province', width: 100 },
    {
      key: 'is_active',
      label: 'Active',
      width: 72,
      render: (val, r) => (
        <ToggleSwitch checked={val} onChange={() => handleToggle(r)} />
      ),
    },
    {
      key: '_edit',
      label: '',
      width: 72,
      render: (_, r) => (
        <Button variant="secondary" size="sm"
          onClick={(e) => { e.stopPropagation(); open(r) }}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" icon={Plus} onClick={() => open()}>Add Truck</Button>
      </div>
      <Card>
        <DataTable
          columns={columns}
          data={trucks}
          emptyMessage="No trucks yet — add one to get started."
        />
      </Card>
      <TruckModal isOpen={modal.open} truck={modal.truck} onClose={close} />
    </div>
  )
}
```

- [ ] **Step 3: Wire up in SettingsTabs.js**

```js
// Add import:
import TrucksTab from './TrucksTab'

// Replace:
{activeTab === 'trucks' && <div>Trucks tab (coming)</div>}
// With:
{activeTab === 'trucks' && <TrucksTab trucks={trucks} />}
```

- [ ] **Step 4: Verify in browser**

Settings → Trucks tab. Expected: unit_number, plate, province columns; toggle works; Add/Edit modal saves.

- [ ] **Step 5: Commit**

```powershell
git add src/components/settings/TrucksTab.js src/components/settings/TruckModal.js src/components/settings/SettingsTabs.js
git commit -m "feat: trucks tab with active toggle, add/edit modal"
```

---

## Task 6: Rate Rules tab

**Files:**
- Create: `src/components/settings/RateRulesTab.js`
- Create: `src/components/settings/RateRuleModal.js`
- Modify: `src/components/settings/SettingsTabs.js` (swap stub + pass props)

- [ ] **Step 1: Create `src/components/settings/RateRuleModal.js`**

```js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createRateRule, updateRateRule } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

const SELECT = { ...INPUT, cursor: 'pointer' }

function blank(rule) {
  return {
    billing_profile_id: rule?.billing_profile_id ?? '',
    label:              rule?.label              ?? '',
    crew_type:          rule?.crew_type          ?? 'solo',
    driver_ids:         rule?.driver_ids         ?? [],
    rate_per_mile:      rule?.rate_per_mile      ?? '',
  }
}

export default function RateRuleModal({ isOpen, rule, onClose, billingProfiles, drivers }) {
  const router = useRouter()
  const [form, setForm] = useState(() => blank(rule))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) { setForm(blank(rule)); setError(null) }
  }, [isOpen, rule])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function toggleDriver(driverId) {
    setForm((f) => {
      const ids = f.driver_ids.includes(driverId)
        ? f.driver_ids.filter(id => id !== driverId)
        : [...f.driver_ids, driverId]
      return { ...f, driver_ids: ids }
    })
  }

  async function handleSubmit() {
    if (!form.billing_profile_id)   { setError('Select a billing profile'); return }
    if (!form.label.trim())         { setError('Label is required'); return }
    if (form.driver_ids.length === 0) { setError('Select at least one driver'); return }
    if (form.crew_type === 'team' && form.driver_ids.length < 2)
      { setError('Team requires at least 2 drivers'); return }
    if (!form.rate_per_mile)        { setError('Rate per mile is required'); return }

    const driver_names_snapshot = drivers
      .filter(d => form.driver_ids.includes(d.id))
      .map(d => d.full_name)

    setLoading(true); setError(null)
    try {
      const payload = { ...form, driver_names_snapshot }
      rule
        ? await updateRateRule(rule.id, payload)
        : await createRateRule(payload)
      router.refresh()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? 'Edit Rate Rule' : 'Add Rate Rule'}
      footer={
        <>
          {error && <span style={{ fontSize: 12, color: '#FF3B30', marginRight: 'auto' }}>{error}</span>}
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {rule ? 'Save Changes' : 'Add Rule'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormField label="Billing Profile" required>
          <select style={SELECT} value={form.billing_profile_id} onChange={set('billing_profile_id')}>
            <option value="">Select a billing profile…</option>
            {billingProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Label" required>
          <input style={INPUT} value={form.label} onChange={set('label')}
            placeholder="e.g. Solo — Route90 to ABC" />
        </FormField>

        <FormField label="Crew Type" required>
          <div style={{ display: 'flex', gap: 24, paddingTop: 4 }}>
            {['solo', 'team'].map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="radio"
                  name="crew_type"
                  value={type}
                  checked={form.crew_type === type}
                  onChange={() => setForm(f => ({ ...f, crew_type: type, driver_ids: [] }))}
                  style={{ accentColor: '#4F46E5', width: 16, height: 16 }}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Drivers" required>
          <div style={{
            border: '1px solid rgba(0,0,0,0.12)', borderRadius: 9,
            overflow: 'hidden', maxHeight: 200, overflowY: 'auto',
          }}>
            {drivers.filter(d => d.is_active).map((d, i, arr) => (
              <label key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', cursor: 'pointer', userSelect: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                backgroundColor: form.driver_ids.includes(d.id) ? '#F5F3FF' : 'white',
              }}>
                <input
                  type="checkbox"
                  checked={form.driver_ids.includes(d.id)}
                  onChange={() => toggleDriver(d.id)}
                  style={{ accentColor: '#4F46E5', width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, color: '#1D1D1F' }}>{d.full_name}</span>
                {d.license_class && (
                  <span style={{ fontSize: 12, color: '#AEAEB2', marginLeft: 'auto' }}>
                    {d.license_class}
                  </span>
                )}
              </label>
            ))}
            {drivers.filter(d => d.is_active).length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: 13, color: '#AEAEB2' }}>
                No active drivers — add drivers first.
              </div>
            )}
          </div>
        </FormField>

        <FormField label="Rate Per Mile ($/mile)" required>
          <input style={INPUT} type="number" step="0.0001" min="0"
            value={form.rate_per_mile} onChange={set('rate_per_mile')}
            placeholder="e.g. 0.8500" />
        </FormField>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Create `src/components/settings/RateRulesTab.js`**

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import RateRuleModal from './RateRuleModal'
import { toggleRateRuleActive } from '@/app/actions/settings'

export default function RateRulesTab({ rateRules, drivers, billingProfiles }) {
  const router = useRouter()
  const [modal, setModal] = useState({ open: false, rule: null })
  const open  = (rule = null) => setModal({ open: true, rule })
  const close = ()            => setModal({ open: false, rule: null })

  async function handleToggle(rule) {
    await toggleRateRuleActive(rule.id, !rule.is_active)
    router.refresh()
  }

  const columns = [
    { key: 'label', label: 'Label' },
    {
      key: 'crew_type',
      label: 'Type',
      width: 80,
      render: (val) => (
        <Badge variant={val === 'team' ? 'info' : 'draft'}>
          {val === 'team' ? 'Team' : 'Solo'}
        </Badge>
      ),
    },
    {
      key: 'driver_names_snapshot',
      label: 'Drivers',
      render: (val) => (
        <span style={{ fontSize: 13, color: '#3C3C43' }}>
          {Array.isArray(val) && val.length > 0 ? val.join(', ') : '—'}
        </span>
      ),
    },
    {
      key: 'rate_per_mile',
      label: '$/mile',
      width: 90,
      render: (val) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          ${parseFloat(val).toFixed(4)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Active',
      width: 72,
      render: (val, r) => (
        <ToggleSwitch checked={val} onChange={() => handleToggle(r)} />
      ),
    },
    {
      key: '_edit',
      label: '',
      width: 72,
      render: (_, r) => (
        <Button variant="secondary" size="sm"
          onClick={(e) => { e.stopPropagation(); open(r) }}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" icon={Plus} onClick={() => open()}>Add Rule</Button>
      </div>
      <Card>
        <DataTable
          columns={columns}
          data={rateRules}
          emptyMessage="No rate rules yet — add one to get started."
        />
      </Card>
      <RateRuleModal
        isOpen={modal.open}
        rule={modal.rule}
        onClose={close}
        billingProfiles={billingProfiles}
        drivers={drivers}
      />
    </div>
  )
}
```

- [ ] **Step 3: Wire up in SettingsTabs.js**

```js
// Add import:
import RateRulesTab from './RateRulesTab'

// Replace:
{activeTab === 'rate-rules' && <div>Rate Rules tab (coming)</div>}
// With:
{activeTab === 'rate-rules' && (
  <RateRulesTab
    rateRules={rateRules}
    drivers={drivers}
    billingProfiles={billingProfiles}
  />
)}
```

- [ ] **Step 4: Verify in browser**

Settings → Rate Rules tab. Expected:
- List columns: label, Solo/Team badge, driver names joined, rate formatted to 4 decimals, toggle, edit
- "Add Rule" modal: billing profile dropdown (populated from billingProfiles prop), label field, Solo/Team radio, checkbox list of active drivers (highlighted when checked), rate field
- Changing crew_type radio clears driver selection
- Submit with no drivers selected → error "Select at least one driver"
- Submit with Team + 1 driver → error "Team requires at least 2 drivers"
- Valid submission creates row, driver_names_snapshot populates correctly in list

- [ ] **Step 5: Commit**

```powershell
git add src/components/settings/RateRulesTab.js src/components/settings/RateRuleModal.js src/components/settings/SettingsTabs.js
git commit -m "feat: rate rules tab with crew type, driver multi-select, add/edit modal"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Billing Profiles: list with label, biller→client, Edit button | Task 3 — BillingProfilesTab columns |
| Billing Profiles: Add/Edit modal, all 13 fields | Task 3 — BillingProfileModal |
| Drivers: avatar initials, name, license class, is_active toggle | Task 4 — DriversTab columns |
| Drivers: Add/Edit modal (full_name, license_class, phone, email) | Task 4 — DriverModal |
| Drivers: deactivate = toggle, not delete | Task 4 — toggleDriverActive, no delete action |
| Trucks: unit_number, plate, province, is_active toggle | Task 5 — TrucksTab |
| Trucks: Add/Edit modal | Task 5 — TruckModal |
| Rate Rules: label, type badge, driver names, rate, toggle, edit | Task 6 — RateRulesTab columns |
| Rate Rules: billing_profile dropdown, label, crew_type radio | Task 6 — RateRuleModal |
| Rate Rules: driver_ids multi-select from drivers list | Task 6 — checkbox list of active drivers |
| Rate Rules: rate_per_mile as $/mile number | Task 6 — rate field, formatted in list |
| Server-side data fetch in page.js | Task 2 — Promise.all in Server Component |
| All mutations via Server Actions | Task 1 — settings.js with revalidatePath |

All requirements covered. No placeholders found.

**Type consistency:**
- `toggleDriverActive(id, isActive)` — defined in settings.js Task 1, called in DriversTab Task 4 with `(driver.id, !driver.is_active)` ✓
- `toggleTruckActive(id, isActive)` — defined Task 1, called Task 5 ✓
- `toggleRateRuleActive(id, isActive)` — defined Task 1, called Task 6 ✓
- `createBillingProfile(data)` / `updateBillingProfile(id, data)` — signatures match usage ✓
- `driver_names_snapshot` built from `drivers.filter(...).map(d => d.full_name)` in RateRuleModal before calling action ✓

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-settings-pages.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using the executing-plans skill

**Which approach?**
