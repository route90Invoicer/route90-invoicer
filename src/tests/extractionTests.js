// Run with: node src/tests/extractionTests.js
// Requires dev server running on localhost:3000

const SCAN_URL = 'http://localhost:3000/api/scan'

// 1x1 white JPEG in base64 (smallest valid JPEG — placeholder for real images)
const PLACEHOLDER_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIRAAAg' +
  'IBBAMAAAAAAAAAAAAAAQIDBAUREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEA' +
  'AAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwZLlqJnHvcz3E5Vvfr7B6r9Vb1QBQB' +
  'Tn//2Q=='

const MOCK_CASES = [
  {
    label: 'Placeholder image — expect empty or graceful error',
    imageBase64: PLACEHOLDER_BASE64,
    mimeType: 'image/jpeg',
    expectedFields: [],
  },
  {
    label: 'Same placeholder — second call (tests repeat handling)',
    imageBase64: PLACEHOLDER_BASE64,
    mimeType: 'image/jpeg',
    expectedFields: [],
  },
]

const FIELDS = [
  'rig_invoice_number',
  'trip_date_start',
  'trip_date_end',
  'pickup_city',
  'delivery_city',
  'total_miles',
]

async function runCase(testCase) {
  const res = await fetch(SCAN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: testCase.imageBase64, mimeType: testCase.mimeType }),
  })
  if (res.status === 422) return { label: testCase.label, status: 'parse_error', trips: [] }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { label: testCase.label, status: 'api_error', error: body.error, trips: [] }
  }
  const { trips } = await res.json()
  return { label: testCase.label, status: 'ok', trips: trips ?? [] }
}

function scoreTrips(actual, expected) {
  if (expected.length === 0) return { matched: 0, total: 0, pct: 100 }
  let matched = 0, total = 0
  expected.forEach((exp, i) => {
    const act = actual[i]
    if (!act) return
    FIELDS.forEach(field => {
      if (exp[field] === undefined) return
      total++
      if (String(act[field] ?? '') === String(exp[field] ?? '')) matched++
    })
  })
  return { matched, total, pct: total === 0 ? 100 : Math.round((matched / total) * 100) }
}

async function main() {
  console.log('Route90 Invoicer — /api/scan extraction test harness\n')
  console.log('NOTE: Add real trip sheet images as test cases to get meaningful accuracy scores.')
  console.log('Each case needs: { label, imageBase64, mimeType, expectedFields: [{field: value}] }\n')

  const results = []
  for (const testCase of MOCK_CASES) {
    process.stdout.write(`Running: "${testCase.label}"… `)
    try {
      const result = await runCase(testCase)
      const score  = scoreTrips(result.trips, testCase.expectedFields)
      console.log(`${result.status} | ${result.trips.length} trips | accuracy: ${score.pct}%`)
      results.push({ ...result, score })
    } catch (err) {
      console.log(`FETCH ERROR — is the dev server running? (${err.message})`)
      results.push({ label: testCase.label, status: 'fetch_error', score: { pct: 0 } })
    }
  }

  console.log('\n── Summary ──────────────────────────────────────')
  const avg = Math.round(results.reduce((a, r) => a + r.score.pct, 0) / results.length)
  console.log(`Cases: ${results.length} | Avg accuracy: ${avg}%`)

  console.log('\nTo add a real test case:')
  console.log('  1. Get base64 from your image (use imageUtils.fileToBase64 in the browser)')
  console.log('  2. Add to MOCK_CASES with expectedFields matching what the sheet shows')
}

main().catch(console.error)
