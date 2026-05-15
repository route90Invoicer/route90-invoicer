function isInvalidNumber(value) {
  return value == null || isNaN(value) || value < 0
}

export function calculateTripAmount(totalMiles, ratePerMile) {
  if (isInvalidNumber(totalMiles) || isInvalidNumber(ratePerMile)) return 0
  return Math.round(totalMiles * ratePerMile * 100) / 100
}

export function calculateSubtotal(trips) {
  if (!trips || trips.length === 0) return 0
  const sum = trips.reduce((acc, trip) => acc + (trip.amount || 0), 0)
  return Math.round(sum * 100) / 100
}

export function calculateGST(subtotal, gstRate) {
  return Math.round(subtotal * gstRate * 100) / 100
}

export function calculateTotal(subtotal, gstAmount) {
  return Math.round((subtotal + gstAmount) * 100) / 100
}

export function calculateBillingPeriod(dateString) {
  const [yearStr, monthStr, dayStr] = dateString.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  if (day <= 15) {
    return {
      periodStart: `${yearStr}-${monthStr}-01`,
      periodEnd: `${yearStr}-${monthStr}-15`,
    }
  }

  // new Date(year, month, 0): month is 1-indexed here because Date uses 0-indexed months,
  // so passing month (e.g. 5 for May) as the month arg treats it as June, and day 0 rolls
  // back to the last day of May — which is exactly the last day of our month.
  const lastDay = new Date(year, month, 0).getDate()
  return {
    periodStart: `${yearStr}-${monthStr}-16`,
    periodEnd: `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function generateNextInvoiceNumber(existingNumbers, prefix, year) {
  const regex = new RegExp(`^${prefix}-${year}-(\\d{3})$`)
  const matching = existingNumbers.filter(n => regex.test(n))

  if (matching.length === 0) return `${prefix}-${year}-001`

  const max = Math.max(...matching.map(n => parseInt(n.match(regex)[1], 10)))
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`
}

export function formatCAD(amount) {
  if (amount == null || isNaN(amount)) return '$0.00'
  return '$' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
