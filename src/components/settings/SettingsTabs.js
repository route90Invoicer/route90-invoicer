'use client'

import { useState } from 'react'
import BillingProfilesTab from './BillingProfilesTab'
import DriversTab from './DriversTab'
import TrucksTab from './TrucksTab'
import RateRulesTab from './RateRulesTab'
import PageHeader from '@/components/ui/PageHeader'

const TABS = [
  { key: 'billing',    label: 'Billing Profiles' },
  { key: 'drivers',   label: 'Drivers' },
  { key: 'trucks',    label: 'Trucks' },
  { key: 'rate-rules', label: 'Rate Rules' },
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
      <PageHeader
        title="Settings"
        subtitle="Manage billing profiles, drivers, trucks, and rate rules"
      />

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Settings sections"
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            onClick={() => setActiveTab(tab.key)}
            style={tabButtonStyle(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* All panels kept mounted so local state persists across tab switches */}
      <div role="tabpanel" id="panel-billing" aria-labelledby="tab-billing"
        style={{ display: activeTab === 'billing' ? 'block' : 'none' }}>
        <BillingProfilesTab profiles={billingProfiles} />
      </div>
      <div role="tabpanel" id="panel-drivers" aria-labelledby="tab-drivers"
        style={{ display: activeTab === 'drivers' ? 'block' : 'none' }}>
        <DriversTab drivers={drivers} />
      </div>
      <div role="tabpanel" id="panel-trucks" aria-labelledby="tab-trucks"
        style={{ display: activeTab === 'trucks' ? 'block' : 'none' }}>
        <TrucksTab trucks={trucks} />
      </div>
      <div role="tabpanel" id="panel-rate-rules" aria-labelledby="tab-rate-rules"
        style={{ display: activeTab === 'rate-rules' ? 'block' : 'none' }}>
        <RateRulesTab rateRules={rateRules} drivers={drivers} billingProfiles={billingProfiles} />
      </div>
    </div>
  )
}
