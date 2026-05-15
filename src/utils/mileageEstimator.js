const MILEAGE_TABLE = {}

export function estimateMileage(fromCity, toCity) {
  const key = [fromCity, toCity].sort().join('|')
  return MILEAGE_TABLE[key] ?? null
}
