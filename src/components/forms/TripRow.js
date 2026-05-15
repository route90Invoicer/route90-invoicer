'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { calculateTripAmount } from '@/utils/invoiceMath'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

// Module-level cache shared across all TripRow instances (keyed by "city1|city2")
const milesCache = new Map()

function TripRow({ trip, tripIndex, onChange, onRemove, trucks, rateRules, rowStyle, autoMatchBadge }) {
  const [stopsOpen, setStopsOpen] = useState(false)
  const [badgeDismissed, setBadgeDismissed] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const debounceRef = useRef(null)

  const set = useCallback((field, value) => {
    const updated = { ...trip, [field]: value }

    // Selecting a rate rule auto-populates rate, crew type, and driver names
    if (field === 'rate_rule_id') {
      const rule = rateRules.find(r => r.id === value)
      if (rule) {
        updated.rate_per_mile_snapshot = rule.rate_per_mile
        updated.crew_type              = rule.crew_type
        updated.driver_names_snapshot  = rule.driver_names_snapshot ?? []
      } else {
        updated.rate_per_mile_snapshot = 0
        updated.crew_type              = 'solo'
        updated.driver_names_snapshot  = []
      }
    }

    // Selecting a truck auto-populates the snapshot
    if (field === 'truck_id') {
      const truck = trucks.find(t => t.id === value)
      updated.truck_number_snapshot = truck ? truck.unit_number : ''
    }

    // Auto-calculate amount when miles or rate changes; allow manual override via 'amount'
    if (field !== 'amount') {
      const miles = parseFloat(field === 'total_miles' ? value : updated.total_miles) || 0
      const rate  = parseFloat(
        field === 'rate_per_mile_snapshot' ? value : updated.rate_per_mile_snapshot
      ) || 0
      updated.amount = calculateTripAmount(miles, rate)
    }

    onChange(tripIndex, updated)
  }, [trip, rateRules, trucks, onChange, tripIndex])

  // Debounced mileage estimator — fires 600ms after pickup_city/delivery_city settle
  useEffect(() => {
    const pickup   = (trip.pickup_city   ?? '').trim()
    const delivery = (trip.delivery_city ?? '').trim()

    // Skip if either field is blank
    if (!pickup || !delivery) return

    const cacheKey = `${pickup.toLowerCase()}|${delivery.toLowerCase()}`

    // Cache hit — apply immediately, no API call
    if (milesCache.has(cacheKey)) {
      const cachedMiles = milesCache.get(cacheKey)
      if (String(cachedMiles) !== String(trip.total_miles)) {
        const updated = { ...trip, total_miles: String(cachedMiles) }
        const miles = parseFloat(cachedMiles) || 0
        const rate  = parseFloat(updated.rate_per_mile_snapshot) || 0
        updated.amount = calculateTripAmount(miles, rate)
        onChange(tripIndex, updated)
      }
      return
    }

    // Debounce: clear any pending timer, set new one
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setEstimating(true)
      try {
        const res = await fetch('/api/estimate-miles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pickupCity: pickup, deliveryCity: delivery }),
        })
        if (!res.ok) return
        const { miles } = await res.json()
        if (miles == null) return
        milesCache.set(cacheKey, miles)
        const updated   = { ...trip, total_miles: String(miles) }
        const milesVal  = parseFloat(miles) || 0
        const rate      = parseFloat(updated.rate_per_mile_snapshot) || 0
        updated.amount  = calculateTripAmount(milesVal, rate)
        onChange(tripIndex, updated)
      } catch {
        // swallow — user can enter manually
      } finally {
        setEstimating(false)
      }
    }, 600)

    // Cleanup: cancel pending timeout on unmount or before next run
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [trip.pickup_city, trip.delivery_city]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedRule = rateRules.find(r => r.id === trip.rate_rule_id)
  const stops        = trip._stops ?? []
  const showStops    = stops.length > 0

  // SA1 uses `highlight` for the amber style; rowStyle is the SA4/SA2 prop.
  // We honour rowStyle if provided, otherwise fall back to the highlight logic.
  const highlight = trip._highlight
  const warnStyle = rowStyle ?? (
    highlight
      ? { borderLeft: '3px solid #F59E0B', backgroundColor: '#FFFBEB' }
      : { borderLeft: '3px solid transparent', backgroundColor: 'white' }
  )

  const inp = 'field-input-sm'
  const sel = 'field-input-sm'

  return (
    <div
      className="rounded-[12px] border border-black/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.04)] mb-3 overflow-hidden"
      style={warnStyle}
    >
      {/* Card header: trip # + remove */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#F9F9FB] border-b border-black/[0.06]">
        <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6E6E73]">
          Trip {tripIndex + 1}
        </span>
        {highlight && (
          <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            Review needed
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(tripIndex)}
          title="Remove trip"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#AEAEB2] hover:text-[#FF3B30] hover:bg-red-50 transition-colors duration-100 cursor-pointer bg-transparent border-none"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">

        {/* Row 1: RIG Inv #, Order #s, Date range */}
        <div className="grid grid-cols-[140px_1fr_auto] gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">RIG Inv #</label>
            <input
              className={inp}
              value={trip.rig_invoice_number}
              onChange={e => set('rig_invoice_number', e.target.value)}
              placeholder="685316"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Order #s</label>
            <input
              className={inp}
              value={trip.order_numbers}
              onChange={e => set('order_numbers', e.target.value)}
              placeholder="123, 456"
              title="Comma-separated order numbers"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Date Range</label>
            <div className="flex items-center gap-1.5">
              <input
                className={inp}
                type="date"
                value={trip.trip_date_start}
                onChange={e => set('trip_date_start', e.target.value)}
                style={{ width: 132 }}
              />
              <span className="text-[11px] text-[#8E8E93]">–</span>
              <input
                className={inp}
                type="date"
                value={trip.trip_date_end}
                onChange={e => set('trip_date_end', e.target.value)}
                style={{ width: 132 }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Truck, Rate Rule, Crew type, Driver names */}
        <div className="grid grid-cols-[100px_1fr_auto] gap-3 items-start">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Truck</label>
            <select
              className={sel}
              value={trip.truck_id}
              onChange={e => set('truck_id', e.target.value)}
            >
              <option value="">—</option>
              {trucks.map(t => (
                <option key={t.id} value={t.id}>{t.unit_number}</option>
              ))}
            </select>
            {/* Free-text snapshot — shown & editable when no DB truck is matched */}
            {!trip.truck_id && (
              <input
                className={inp}
                value={trip.truck_number_snapshot}
                onChange={e => set('truck_number_snapshot', e.target.value)}
                placeholder="Unit # (manual)"
                title="No truck matched in DB — enter unit number manually"
                style={{ fontSize: 11, marginTop: 2 }}
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Driver / Rate Rule</label>
            <select
              className={sel}
              value={trip.rate_rule_id}
              onChange={e => set('rate_rule_id', e.target.value)}
            >
              <option value="">Select rule…</option>
              {rateRules.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {/* Editable crew type */}
            <select
              className={sel}
              value={trip.crew_type}
              onChange={e => set('crew_type', e.target.value)}
              style={{ fontSize: 11, marginTop: 2 }}
            >
              <option value="solo">Solo</option>
              <option value="team">Team</option>
            </select>
            {/* Editable driver names — comma-separated */}
            <div style={{ position: 'relative' }}>
              <input
                className={inp}
                value={Array.isArray(trip.driver_names_snapshot)
                  ? trip.driver_names_snapshot.join(', ')
                  : (trip.driver_names_snapshot ?? '')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  set('driver_names_snapshot', arr)
                }}
                placeholder="Driver names, comma-separated"
                title="Comma-separated driver names"
                style={{ fontSize: 11, marginTop: 2 }}
              />
              {autoMatchBadge && !badgeDismissed && (
                <span
                  onClick={() => setBadgeDismissed(true)}
                  title="Click to dismiss"
                  style={{
                    position: 'absolute',
                    top: -16,
                    left: 0,
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#4F46E5',
                    backgroundColor: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    borderRadius: 4,
                    padding: '1px 6px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Auto-matched ✕
                </span>
              )}
            </div>
            {selectedRule && (
              <div className="text-[11px] text-[#6E6E73] mt-0.5 leading-snug">
                <span className="font-medium text-[#1D1D1F]">
                  {selectedRule.crew_type === 'team' ? 'Team' : 'Solo'}
                </span>
                {(trip.driver_names_snapshot ?? []).length > 0 && (
                  <> &middot; {(trip.driver_names_snapshot ?? []).join(', ')}</>
                )}
              </div>
            )}
          </div>

          {/* Crew badge (read-only display, mirrors current crew_type) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Crew</label>
            <div className="text-[13px] text-[#6E6E73] pt-[7px]">
              {trip.crew_type === 'team' ? 'Team' : 'Solo'}
            </div>
          </div>
        </div>

        {/* Row 3: Pickup City, Delivery City, Route Summary, KM, Miles, Rate, Amount */}
        <div className="grid grid-cols-[1fr_1fr_88px_88px_80px_auto] gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Pickup City</label>
            <input
              className={inp}
              value={trip.pickup_city}
              onChange={e => set('pickup_city', e.target.value)}
              placeholder="Edmonton, AB"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Delivery City</label>
            <input
              className={inp}
              value={trip.delivery_city}
              onChange={e => set('delivery_city', e.target.value)}
              placeholder="Calgary, AB"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">KM</label>
            <input
              className={inp}
              type="number"
              min="0"
              step="0.01"
              value={trip.total_km}
              onChange={e => set('total_km', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Miles</label>
            <input
              className={inp}
              type="number"
              min="0"
              step="0.01"
              value={trip.total_miles}
              onChange={e => set('total_miles', e.target.value)}
              placeholder="0"
              disabled={estimating}
            />
            {estimating && (
              <span className="text-[11px] text-[#6B7280] italic mt-0.5">Estimating…</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Rate/mi</label>
            <input
              className={inp}
              type="number"
              min="0"
              step="0.0001"
              value={trip.rate_per_mile_snapshot ?? ''}
              onChange={e => set('rate_per_mile_snapshot', e.target.value)}
              placeholder="0.0000"
              title="Rate per mile"
            />
          </div>
          <div className="flex flex-col gap-1 items-end">
            <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Amount</label>
            <div className="flex flex-col items-end">
              <input
                className={inp}
                type="number"
                min="0"
                step="0.01"
                value={parseFloat(trip.amount || 0).toFixed(2)}
                onChange={e => set('amount', parseFloat(e.target.value) || 0)}
                title="Auto-calculated from miles × rate. Edit to override."
                style={{ textAlign: 'right', fontWeight: 700, color: '#4F46E5', fontSize: 16, width: 96 }}
              />
              {trip.rate_per_mile_snapshot > 0 && (
                <span className="text-[10.5px] text-[#8E8E93] tabular-nums">
                  @ ${parseFloat(trip.rate_per_mile_snapshot).toFixed(4)}/mi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Route summary + stops toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Route Summary</label>
          <input
            className={inp}
            value={trip.route_summary ?? ''}
            onChange={e => set('route_summary', e.target.value)}
            placeholder="Route summary (optional — overrides pickup→delivery on invoice)"
            title="Overrides pickup→delivery display on invoice"
          />
          {showStops && (
            <button
              type="button"
              onClick={() => setStopsOpen(o => !o)}
              className="flex items-center gap-1 text-[11px] text-indigo-600 bg-transparent border-none cursor-pointer p-0 mt-0.5 self-start"
            >
              {stopsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {stops.length} stop{stops.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Collapsible stops — read-only, from scan */}
        {showStops && stopsOpen && (
          <div className="rounded-[8px] bg-[#F9FAFB] border border-black/[0.05] px-3 py-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#6E6E73] mb-2">
              Stops (read-only — from scan)
            </div>
            <div className="flex flex-col gap-1">
              {stops.map((stop, si) => (
                <div key={si} className="text-[12px] text-[#374151] flex gap-3">
                  <span className="text-[#6B7280] min-w-[20px]">{si + 1}.</span>
                  <span>{stop.city ?? stop.location ?? JSON.stringify(stop)}</span>
                  {stop.distance_from_previous_miles != null && (
                    <span className="text-[#9CA3AF]">{stop.distance_from_previous_miles} mi</span>
                  )}
                  {stop.distance_from_previous_km != null && (
                    <span className="text-[#9CA3AF]">{stop.distance_from_previous_km} km</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 4: Border fee */}
        <div className="flex items-start gap-4 pt-1 border-t border-black/[0.05]">
          <div className="flex items-center gap-2.5 mt-2">
            <ToggleSwitch
              checked={trip.has_border_fee}
              onChange={val => set('has_border_fee', val)}
            />
            <span className="text-[12.5px] text-[#6E6E73] font-medium">Border fee</span>
          </div>
          {trip.has_border_fee && (
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Fee ($)</label>
                <input
                  className={inp}
                  type="number"
                  min="0"
                  step="0.01"
                  value={trip.border_fee}
                  onChange={e => set('border_fee', e.target.value)}
                  placeholder="0.00"
                  style={{ width: 96 }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8E8E93]">Note</label>
                <input
                  className={inp}
                  value={trip.border_fee_note}
                  onChange={e => set('border_fee_note', e.target.value)}
                  placeholder="e.g. FAST card fee"
                  style={{ width: 180 }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default memo(TripRow)
