import { gql } from 'graphql-request'
import _ from 'lodash'
import { ChainId } from 'thena-sdk-core'

import Contracts from '@/constant/contracts'
import { liquidityHub } from '@/modules/LiquidityHub'

import { v3PoolGraphClient } from './graphql'
import { ZERO_VALUE } from './utils'

const backendApi = 'https://api.thena.fi/api/v1'
const backendApiTestNet = 'https://testnet-thena-backend.zinza.com.vn/api/v1'

export const fetchAssets = async (networkId, liquidityHubEnabled) => {
  try {
    const getTokens = async () => {
      const response = await fetch(`${networkId === 97 ? backendApiTestNet : backendApi}/assets`, {
        method: 'get',
      })
      return response.json()
    }

    const [assetsCall, liquidityHubTokens] = await Promise.all([
      getTokens(),
      liquidityHub.getTokens(liquidityHubEnabled),
    ])
    const assets = _.filter(
      _.uniqBy([...assetsCall.data, ...liquidityHubTokens], it => it.address.toLowerCase()),
      it => it.chainId === networkId,
    )

    const wbnbPrice = assets.find(
      asset => asset.address.toLowerCase() === Contracts.WBNB[networkId].toLowerCase(),
    )?.price

    const nativeBNB = {
      address: 'BNB',
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
      logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
      price: wbnbPrice,
    }
    assets.unshift(nativeBNB)
    return assets.map(item => {
      // TODO: Hard-coded price
      if (networkId === 97) {
        if (item.symbol.includes('BNB')) {
          item.price = 600
        }

        if (item.symbol === 'THE') {
          item.price = 0.2
        }

        if (item.symbol.includes('ETH')) {
          item.price = 3000
        }

        if (item.symbol.includes('BTC')) {
          item.price = 90000
        }
      }

      return {
        ...item,
        chainId: networkId,
        balance: ZERO_VALUE,
      }
    })
  } catch (ex) {
    console.error('get assets had error', ex)
    return null
  }
}

const V3_GET_V3_POOLS = gql`
  query V3_GET_V3_POOLS {
    pools {
      id
      liquidity
      token1 {
        symbol
        id
      }
      token0 {
        symbol
        id
      }
    }
  }
`

export const fetchPoolV3 = async () => {
  try {
    const { pools } = await v3PoolGraphClient.request(V3_GET_V3_POOLS)
    return pools.map(pool => ({
      ...pool,
      version: 3,
    }))
  } catch (e) {
    console.log(e)
    return []
  }
}

export const fetchPools = params =>
  fetch(
    `${params[1] === 97 ? backendApiTestNet : backendApi}/${
      params[1] === ChainId.BSC || params[1] === 97 ? 'fusions?v=3' : 'opfusions'
    }`,
  )
    .then(r => r.json())
    .then(r => r.data)

export const fetchStats = () =>
  fetch(`${backendApi}/stats`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchBscPairs = () =>
  fetch(`${backendApi}/topPairs/56`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchCLpoolV2 = chainId =>
  fetch(`${backendApiTestNet}/topPairs/${chainId}?type=CL`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchBscTestnetPairsV3 = () =>
  fetch(`${backendApiTestNet}/topPairsV3/97`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchOpPairs = () =>
  fetch(`${backendApi}/topPairs/204`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchTopTokens = params =>
  fetch(`${backendApi}/topTokens/${params[1]}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetVeTHETokens = (chainId, account) =>
  fetch(`${backendApiTestNet}/vethes/${chainId}/${account}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchNfts = nftId =>
  fetch(`https://ipfs.io/ipfs/QmYG7JJcLxxewgCD9Az2zcnS7CCCZKa6s2738ZC2547eTn/${nftId}`).then(r => r.json())

export const fetchRevenue = () => fetch('https://flask-henlo-world.vercel.app/').then(r => r.json())
