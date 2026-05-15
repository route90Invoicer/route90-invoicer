import {
  calculateTripAmount,
  calculateSubtotal,
  calculateGST,
  calculateTotal,
  calculateBillingPeriod,
  generateNextInvoiceNumber,
  formatCAD,
} from '../invoiceMath.js'

// ─── calculateTripAmount ───────────────────────────────────────────────────────

describe('calculateTripAmount', () => {
  it('multiplies miles by rate', () => {
    expect(calculateTripAmount(100, 1.5)).toBe(150)
  })

  it('handles floating point: 1500.5 × 0.52', () => {
    expect(calculateTripAmount(1500.5, 0.52)).toBe(780.26)
  })

  it('returns 0 for zero miles', () => {
    expect(calculateTripAmount(0, 1.5)).toBe(0)
  })

  it('returns 0 for null miles', () => {
    expect(calculateTripAmount(null, 1.5)).toBe(0)
  })

  it('returns 0 for null rate', () => {
    expect(calculateTripAmount(100, null)).toBe(0)
  })

  it('returns 0 for undefined miles', () => {
    expect(calculateTripAmount(undefined, 1.5)).toBe(0)
  })

  it('returns 0 for NaN miles', () => {
    expect(calculateTripAmount(NaN, 1.5)).toBe(0)
  })

  it('returns 0 for negative miles', () => {
    expect(calculateTripAmount(-100, 1.5)).toBe(0)
  })

  it('returns 0 for negative rate', () => {
    expect(calculateTripAmount(100, -1.5)).toBe(0)
  })
})

// ─── calculateSubtotal ────────────────────────────────────────────────────────

describe('calculateSubtotal', () => {
  it('sums all trip amounts', () => {
    const trips = [{ amount: 150 }, { amount: 200.50 }, { amount: 99.99 }]
    expect(calculateSubtotal(trips)).toBe(450.49)
  })

  it('returns 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0)
  })

  it('returns 0 for null', () => {
    expect(calculateSubtotal(null)).toBe(0)
  })

  it('handles single trip', () => {
    expect(calculateSubtotal([{ amount: 100 }])).toBe(100)
  })
})

// ─── calculateGST ─────────────────────────────────────────────────────────────

describe('calculateGST', () => {
  it('multiplies subtotal by GST rate', () => {
    expect(calculateGST(1000, 0.05)).toBe(50)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateGST(123.45, 0.05)).toBe(6.17)
  })
})

// ─── calculateTotal ───────────────────────────────────────────────────────────

describe('calculateTotal', () => {
  it('adds subtotal and GST amount', () => {
    expect(calculateTotal(1000, 50)).toBe(1050)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateTotal(123.45, 6.17)).toBe(129.62)
  })
})

// ─── calculateBillingPeriod ───────────────────────────────────────────────────

describe('calculateBillingPeriod', () => {
  it('day 1 falls in period 1–15', () => {
    expect(calculateBillingPeriod('2026-05-01')).toEqual({
      periodStart: '2026-05-01',
      periodEnd: '2026-05-15',
    })
  })

  it('day 15 falls in period 1–15', () => {
    expect(calculateBillingPeriod('2026-05-15')).toEqual({
      periodStart: '2026-05-01',
      periodEnd: '2026-05-15',
    })
  })

  it('day 16 falls in period 16–last day', () => {
    expect(calculateBillingPeriod('2026-05-16')).toEqual({
      periodStart: '2026-05-16',
      periodEnd: '2026-05-31',
    })
  })

  it('Feb 29 2028 (leap year) period end is 29', () => {
    expect(calculateBillingPeriod('2028-02-29')).toEqual({
      periodStart: '2028-02-16',
      periodEnd: '2028-02-29',
    })
  })

  it('Dec 31 period end is 31', () => {
    expect(calculateBillingPeriod('2026-12-31')).toEqual({
      periodStart: '2026-12-16',
      periodEnd: '2026-12-31',
    })
  })
})

// ─── generateNextInvoiceNumber ────────────────────────────────────────────────

describe('generateNextInvoiceNumber', () => {
  it('returns 001 for empty array', () => {
    expect(generateNextInvoiceNumber([], 'R90', 2026)).toBe('R90-2026-001')
  })

  it('increments past existing numbers', () => {
    expect(generateNextInvoiceNumber(['R90-2026-001', 'R90-2026-002'], 'R90', 2026)).toBe('R90-2026-003')
  })

  it('ignores numbers from a different year and resets to 001', () => {
    expect(generateNextInvoiceNumber(['R90-2025-010', 'R90-2025-011'], 'R90', 2026)).toBe('R90-2026-001')
  })

  it('works with alphanumeric prefix', () => {
    expect(generateNextInvoiceNumber([], 'ABC123', 2026)).toBe('ABC123-2026-001')
  })

  it('pads sequence to 3 digits', () => {
    const existing = Array.from({ length: 9 }, (_, i) => `R90-2026-00${i + 1}`)
    expect(generateNextInvoiceNumber(existing, 'R90', 2026)).toBe('R90-2026-010')
  })
})

// ─── formatCAD ────────────────────────────────────────────────────────────────

describe('formatCAD', () => {
  it('formats a typical amount', () => {
    expect(formatCAD(1234.56)).toBe('$1,234.56')
  })

  it('returns $0.00 for null', () => {
    expect(formatCAD(null)).toBe('$0.00')
  })

  it('returns $0.00 for undefined', () => {
    expect(formatCAD(undefined)).toBe('$0.00')
  })

  it('returns $0.00 for zero', () => {
    expect(formatCAD(0)).toBe('$0.00')
  })

  it('handles amounts under $1', () => {
    expect(formatCAD(0.99)).toBe('$0.99')
  })

  it('handles large amounts with multiple comma groups', () => {
    expect(formatCAD(1000000)).toBe('$1,000,000.00')
  })
})
