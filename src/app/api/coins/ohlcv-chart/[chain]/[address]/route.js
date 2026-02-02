import { NextResponse } from 'next/server'

import { COINGECKO_API_ENDPOINT, corsHeaders, isAllowedOrigin } from '@/utils/api'

export async function GET(req, { params }) {
  const origin = req.headers.get('host')

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { address, chain } = params
  const { searchParams } = new URL(req.url)
  const timeframe = searchParams.get('timeframe')
  const queryParams = new URLSearchParams({
    aggregate: searchParams.get('aggregate'),
    limit: searchParams.get('limit'),
  })

  // eslint-disable-next-line max-len
  const url = `${COINGECKO_API_ENDPOINT}/onchain/networks/${chain}/tokens/${address}/ohlcv/${timeframe}?${queryParams.toString()}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-cg-pro-api-key': process.env.COINGECKO_PRO_API_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    return NextResponse.json(
      { error: errorText, status: response.status },
      { status: response.status, headers: corsHeaders(origin) },
    )
  }

  const data = await response.json()
  return NextResponse.json(data, {
    headers: corsHeaders(origin),
  })
}
