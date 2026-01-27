import { NextResponse } from 'next/server'

import { TOKEN_MAPPING } from '@/modules/SwapChart/constants'
import { COINGECKO_API_ENDPOINT, corsHeaders, isAllowedOrigin } from '@/utils/api'

export async function GET(req, { params }) {
  const origin = req.headers.get('host')

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let { chain } = params
  const { searchParams } = new URL(req.url)
  let address = searchParams.get('contract_addresses')

  const tokenMapping = TOKEN_MAPPING[address?.toLowerCase()]
  if (tokenMapping) {
    address = tokenMapping.address
    chain = tokenMapping.chain
  }

  const queryParams = new URLSearchParams({
    contract_addresses: address,
    include_last_updated_at: true,
    vs_currencies: 'usd',
  })

  const response = await fetch(`${COINGECKO_API_ENDPOINT}/simple/token_price/${chain}?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-cg-pro-api-key': process.env.COINGECKO_PRO_API_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('CoinGecko API error:', response.status, errorText)
    return NextResponse.json(
      { error: 'Failed to fetch price data', status: response.status },
      { status: response.status, headers: corsHeaders(origin) },
    )
  }

  const data = await response.json()
  return NextResponse.json(data, {
    headers: corsHeaders(origin),
  })
}
