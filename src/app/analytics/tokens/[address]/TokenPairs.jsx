'use client'

import { gql } from 'graphql-request'
import { useMemo } from 'react'
import useSWR from 'swr'

import { TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { fusionClient, v1Client } from '@/lib/graphql'
import { useChainSettings } from '@/state/settings/hooks'

import PairsTable from '../../pairs/PairsTable'

const V1_PAIRS = gql`
  query v1TokenPairs($address: String!) {
    pairs(
      where: { or: [{ token0: $address }, { token1: $address }] }
      first: 500
      orderBy: trackedReserveETH
      orderDirection: desc
    ) {
      id
    }
  }
`

const getV1PairData = async (chainId, address) => {
  try {
    const { pairs } = await v1Client[chainId].request(V1_PAIRS, {
      address,
    })
    const data = pairs.map(ele => ele.id)
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch v1 token pair data', error)
    return { error: true }
  }
}

const FUSION_PAIRS = gql`
  query fusionTokenPairs($address: String!) {
    pools(
      where: { or: [{ token0_contains_nocase: $address }, { token1_contains_nocase: $address }] }
      first: 1000
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
      id
    }
  }
`

const getFusionPairData = async (chainId, address) => {
  try {
    const { pools } = await fusionClient[chainId].request(FUSION_PAIRS, {
      address,
    })
    const data = pools.map(ele => ele.id)
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion token pair data', error)
    return { error: true }
  }
}

const fetchTokenPairsData = async (chainId, token) => {
  console.log('fetch token pair data ======================')
  const { data: fusiondata } = await getFusionPairData(chainId, token.address)
  const { data: v1data } = await getV1PairData(chainId, token.address)
  return (fusiondata ?? []).concat(v1data ?? [])
}

export default function TokenPairs({ token }) {
  const { pairs } = usePairs()
  const { networkId } = useChainSettings()
  const { data } = useSWR(
    token && ['analytics/token/pairs', token.address],
    () => fetchTokenPairsData(networkId, token),
    {
      refreshInterval: 0,
    },
  )
  const filteredPairs = useMemo(() => {
    if (!data || !pairs) return []
    return pairs.filter(ele => data.includes(ele.address))
  }, [data, pairs])
  return (
    <div className='flex flex-col gap-6'>
      <TextHeading className='text-xl'>{token?.symbol} Pairs</TextHeading>
      <PairsTable data={filteredPairs} />
    </div>
  )
}
