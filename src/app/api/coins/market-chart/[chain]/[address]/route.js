import { NextResponse } from 'next/server'

import { TOKEN_MAPPING } from '@/modules/SwapChart/constants'
import { COINGECKO_API_ENDPOINT, corsHeaders, isAllowedOrigin } from '@/utils/api'

export async function GET(req, { params }) {
  const origin = req.headers.get('host')

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let { address, chain } = params
  const { searchParams } = new URL(req.url)

  const tokenMapping = TOKEN_MAPPING[address?.toLowerCase()]
  if (tokenMapping) {
    address = tokenMapping.address
    chain = tokenMapping.chain
  }

  const response = await fetch(
    `${COINGECKO_API_ENDPOINT}/coins/${chain}/contract/${address}/market_chart?${searchParams.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'x-cg-pro-api-key': process.env.COINGECKO_PRO_API_KEY,
      },
    },
  )

  const data = await response.json()
  return NextResponse.json(data, {
    headers: corsHeaders(origin),
  })
}
