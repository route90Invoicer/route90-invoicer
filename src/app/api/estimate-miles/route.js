import { anthropic } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

const COST_PER_1K = 0.00025

const cache = new Map()

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { pickupCity, deliveryCity } = body

  if (!pickupCity || !deliveryCity || typeof pickupCity !== 'string' || typeof deliveryCity !== 'string') {
    return NextResponse.json({ error: 'pickupCity and deliveryCity must be non-empty strings' }, { status: 400 })
  }

  if (pickupCity.trim().toLowerCase() === deliveryCity.trim().toLowerCase()) {
    return NextResponse.json({ miles: 0, pickupCity, deliveryCity })
  }

  const cacheKey = `${pickupCity.trim().toLowerCase()}|${deliveryCity.trim().toLowerCase()}`
  if (cache.has(cacheKey)) {
    console.log(`[estimate-miles] Cache hit: ${pickupCity} → ${deliveryCity}`)
    return NextResponse.json({ miles: cache.get(cacheKey), pickupCity, deliveryCity })
  }

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: `Approximate one-way driving distance in miles from ${pickupCity} to ${deliveryCity}. Reply with only an integer. Nothing else.`,
        },
      ],
    })
  } catch (err) {
    console.error('[estimate-miles] Anthropic error:', err.message)
    return NextResponse.json({ error: 'Could not estimate distance' }, { status: 422 })
  }

  const raw = response.content[0].text.trim()
  const miles = parseInt(raw, 10)

  if (isNaN(miles)) {
    console.error('[estimate-miles] Parse failed. Raw:', raw)
    return NextResponse.json({ error: 'Could not estimate distance' }, { status: 422 })
  }

  const totalTokens = response.usage.input_tokens + response.usage.output_tokens
  const cost = (totalTokens / 1000) * COST_PER_1K
  console.log(`[estimate-miles] ${pickupCity} → ${deliveryCity}: ${miles} miles | ${totalTokens} tokens | $${cost.toFixed(6)}`)

  cache.set(cacheKey, miles)

  return NextResponse.json({ miles, pickupCity, deliveryCity })
}
