import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const INPUT_COST_PER_1K = 0.003
const OUTPUT_COST_PER_1K = 0.015

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { imageBase64, mimeType } = body

  if (!imageBase64 || !mimeType || typeof imageBase64 !== 'string' || typeof mimeType !== 'string') {
    return NextResponse.json({ error: 'imageBase64 and mimeType must be non-empty strings' }, { status: 400 })
  }

  if (imageBase64.length > 6_700_000) {
    return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 })
  }

  const estimatedSizeKB = Math.round((imageBase64.length * 0.75) / 1024)
  console.log(`[scan] Image size: ~${estimatedSizeKB}KB`)

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: `You are reading a handwritten trucking trip sheet. Your job is to extract every trip entry from the image into structured JSON.

RULES:
- Return ONLY a raw JSON array. No markdown fences. No explanation. No preamble. Start with [ and end with ].
- If a field is not present or illegible, use null (or [] for array fields).
- For city names, strip province/state abbreviations — return the city name only.
- For dates, use 'YYYY-MM-DD' format. Infer the year from context if only month/day are written.
- All numeric values (distances, fees) must be plain numbers, not strings.

FIELDS TO EXTRACT PER TRIP ENTRY:

rig_invoice_number   — string or null. The trip sheet reference number (often in the top-right corner, e.g. '685316').
trip_date_start      — 'YYYY-MM-DD' or null. First date of the trip.
trip_date_end        — 'YYYY-MM-DD' or null. Last date of the trip. Same as start if single-day.
order_numbers        — string[] or []. Any order, load, or BOL numbers associated with the trip.
truck_number         — string or null. The unit/truck number.
driver_names         — string[] or []. All driver names on the trip (first+last if legible).
pickup_city          — string or null. City of origin, no province/state.
delivery_city        — string or null. Final destination city, no province/state.
total_km             — number or null. Total distance in kilometres. Use this for values labeled 'km' or 'K'.
total_miles          — number or null. Total distance in miles. Use this for values labeled 'M', 'mi', or 'miles'. A value like '4486 M' means 4486 miles — extract 4486 here, not as total_km.
border_fee           — number or null. Any border/crossing fee amount written on the sheet.
border_fee_note      — string or null. Any label or description written next to the border fee (e.g. 'CBSA', 'border crossing', 'customs').
stops                — array of stop objects in route sequence. Include the pickup city as the FIRST entry and the delivery city as the LAST entry. Include every intermediate stop found on the sheet between them.
                       Each stop object: { "city": string, "distance_from_previous_km": number|null, "distance_from_previous_miles": number|null }
                       For the first stop (pickup), distance_from_previous_km and distance_from_previous_miles are both null.
                       For every subsequent stop, extract the segment distance written between that stop and the previous one, in whichever units are shown.
calculated_total_miles — number or null. Sum ALL distance_from_previous_miles values across the stops array. This is YOUR independent calculation from the segment distances — do NOT copy the total written at the bottom of the sheet. If no per-segment mile distances are available, return null.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    })
  } catch (err) {
    console.error('[scan] Anthropic error:', err.message)
    return NextResponse.json({ error: 'Scan failed', details: err.message }, { status: 500 })
  }

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const cost = (inputTokens / 1000) * INPUT_COST_PER_1K + (outputTokens / 1000) * OUTPUT_COST_PER_1K
  console.log(`[scan] Tokens: ${inputTokens} in / ${outputTokens} out — est. cost $${cost.toFixed(5)}`)

  const raw = response.content[0].text.trim()

  let trips
  try {
    trips = JSON.parse(raw)
  } catch {
    console.error('[scan] JSON parse failed. Raw:', raw.slice(0, 200))
    return NextResponse.json({ error: 'Could not parse response', raw }, { status: 422 })
  }

  // KM → miles fallback: sheets that only write km get a converted total_miles
  for (const trip of trips) {
    if ((trip.total_miles == null || Number(trip.total_miles) === 0) &&
        trip.total_km != null && Number(trip.total_km) > 0) {
      trip.total_miles = Math.round(Number(trip.total_km) * 0.621371)
    }
  }

  // ── Task 2: Mileage discrepancy detection ─────────────────────────────────
  for (const trip of trips) {
    const sheetTotal = trip.total_miles != null ? Number(trip.total_miles) : null
    const calcTotal  = trip.calculated_total_miles != null ? Number(trip.calculated_total_miles) : null

    if (sheetTotal != null && calcTotal != null && sheetTotal > 0) {
      const discrepancyMiles = Math.abs(sheetTotal - calcTotal)
      const discrepancyPct   = (discrepancyMiles / sheetTotal) * 100

      if (discrepancyPct > 5) {
        trip.mileage_discrepancy        = true
        trip.mileage_discrepancy_detail = `Sheet total: ${sheetTotal} mi, Calculated from stops: ${calcTotal} mi (${discrepancyPct.toFixed(1)}% difference)`
      } else {
        trip.mileage_discrepancy        = false
        trip.mileage_discrepancy_detail = null
      }
    } else {
      trip.mileage_discrepancy        = null  // can't verify
      trip.mileage_discrepancy_detail = null
    }
  }

  // ── Task 3: Driver profile matching ───────────────────────────────────────
  let activeDrivers = []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('drivers')
      .select('id, full_name')
      .eq('is_active', true)

    if (error) {
      console.error('[scan] Driver query error:', error.message)
    } else {
      activeDrivers = data ?? []
    }
  } catch (err) {
    console.error('[scan] Driver query exception:', err.message)
  }

  for (const trip of trips) {
    const names = Array.isArray(trip.driver_names) ? trip.driver_names : []

    if (names.length === 0) {
      trip.matched_driver_profiles = []
      continue
    }

    const matched = []
    for (const extractedName of names) {
      const normalizedExtracted = extractedName.toLowerCase().trim()
      const found = activeDrivers.find(driver => {
        const normalizedDB = driver.full_name.toLowerCase().trim()
        return normalizedDB.includes(normalizedExtracted) || normalizedExtracted.includes(normalizedDB)
      })
      if (found) {
        matched.push({ id: found.id, full_name: found.full_name })
      }
    }
    trip.matched_driver_profiles = matched
  }

  return NextResponse.json({
    trips,
    usage: { input: inputTokens, output: outputTokens },
  })
}
