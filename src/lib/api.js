import filter from 'lodash/filter'
import uniqBy from 'lodash/uniqBy'

import { BNB_LOGO } from '@/constant'
import Contracts from '@/constant/contracts'
import { liquidityHub } from '@/modules/LiquidityHub'

import { ZERO_VALUE } from '../utils/utils'

// TODO: Fix on prod
export const backendApi = 'https://api.thena.fi/api'

const getApiVersion = version => (version === 3 ? 'v3' : 'v1')

export const fetchAssets = async networkId => {
  try {
    const getTokens = async () => {
      const response = await fetch(`${backendApi}/v1/assets`, {
        method: 'get',
      })
      return response.json()
    }

    const [assetsCall, liquidityHubTokens] = await Promise.all([getTokens(), liquidityHub.getTokens()])
    const assets = filter(
      uniqBy([...assetsCall.data, ...liquidityHubTokens], it => it.address.toLowerCase()),
      it => it.chainId === networkId,
    )
    // both lists have CAKE, so we need to merge them
    const cakeIndex = assets.findIndex(it => it.symbol === 'CAKE')
    if (cakeIndex !== -1) {
      assets[cakeIndex] = {
        ...assets[cakeIndex],
        extended: true,
      }
    }

    const wbnbPrice = assets.find(
      asset => asset.address.toLowerCase() === Contracts.WBNB[networkId].toLowerCase(),
    )?.price

    const nativeBNB = {
      address: 'BNB',
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
      logoURI: BNB_LOGO,
      price: wbnbPrice,
    }
    assets.unshift(nativeBNB)
    return assets.map(item => ({
      ...item,
      chainId: networkId,
      balance: ZERO_VALUE,
    }))
  } catch (ex) {
    console.error('get assets had error', ex)
    return []
  }
}

export const fetchCustomAssets = async networkId => {
  try {
    const getCustomTokens = async () => {
      const response = await fetch(`${backendApi}/v3/customAssets/${networkId}`, {
        method: 'get',
      })
      return response.json()
    }

    const customAssetsData = (await getCustomTokens()).data

    const customAssets = filter(
      uniqBy(customAssetsData, it => it.address.toLowerCase()),
      it => it.chainId === networkId,
    )

    return customAssets.map(item => ({
      ...item,
      chainId: networkId,
      balance: ZERO_VALUE,
    }))
  } catch (ex) {
    console.error('get custom assets had error', ex)
    return []
  }
}

export const fetchFusionPools = async ({ networkId, version = 3, type }) => {
  const apiVersion = getApiVersion(version)
  let url = `${backendApi}/${apiVersion}/fusions/${networkId}`
  if (type) url += `?type=${type}`

  return fetch(url)
    .then(r => r.json())
    .then(r => r.data)
}

export const fetchStats = () =>
  fetch(`${backendApi}/v1/stats`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchTopPairs = async ({ networkId, version = 3, type }) => {
  const apiVersion = getApiVersion(version)
  let url = `${backendApi}/${apiVersion}/topPairs/${networkId}`
  if (type) url += `?type=${type}`

  return fetch(url)
    .then(r => r.json())
    .then(r => r.data)
}

export const fetchV2SolidlyPairs = async ({ networkId }) =>
  fetch(`${backendApi}/v1/topPairs/${networkId}?type=solidly&populate=1`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchTopTokens = async ({ networkId, version = 3 }) => {
  const apiVersion = getApiVersion(version)
  return fetch(`${backendApi}/${apiVersion}/topTokens/${networkId}`)
    .then(r => r.json())
    .then(r => r.data)
}

const NFT_IPFS_CID = 'QmYG7JJcLxxewgCD9Az2zcnS7CCCZKa6s2738ZC2547eTn'
const NFT_FETCH_TIMEOUT_MS = 10000
const NFT_IPFS_GATEWAYS = ['dweb.link', 'dget.top', 'ipfs.io', 'ipfs.ecolatam.com', 'w3s.link']

let cachedNftGateway = null

const getNftGatewayOrder = () => {
  if (!cachedNftGateway) return NFT_IPFS_GATEWAYS
  return [cachedNftGateway, ...NFT_IPFS_GATEWAYS.filter(gateway => gateway !== cachedNftGateway)]
}

export const fetchNfts = async nftId => {
  const gateways = getNftGatewayOrder()
  let lastError = null

  for (const gateway of gateways) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NFT_FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(`https://${gateway}/ipfs/${NFT_IPFS_CID}/${nftId}`, {
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`Gateway ${gateway} responded ${response.status}`)
      }

      const data = await response.json()
      cachedNftGateway = gateway
      return data
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError || new Error('All NFT IPFS gateways failed')
}

// export const fetchRevenue = () => fetch('https://flask-henlo-world.vercel.app/').then(r => r.json())
export const fetchRevenue = () => fetch(`${backendApi}/v1/stats`).then(r => r.json())

export const fetchHistoricalTokensPrice = async ({ chainId, tokenAddresses, page = 1, limit = 1000, startDate }) => {
  const url = `${backendApi}/v3/historical-token-price/${chainId}`
  const formData = new FormData()

  formData.append('page', page)
  formData.append('limit', limit)
  formData.append('date_gte', startDate)
  formData.append('tokens', JSON.stringify(tokenAddresses))
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  return await response.json()
}

export const getAnalyticsData = async ({ networkId, first, page, epoch }) => {
  let url = `${backendApi}/v3/analytics/${networkId}?page=${page}&limit=${first}`
  if (epoch) url += `&epoch=${epoch}`

  return fetch(url)
    .then(r => r.json())
    .then(r => r.data)
}

export const getTradingRoute = async ({ tokenIn, tokenOut, amountIn, networkId, tradeType = 0 }) => {
  try {
    const params = new URLSearchParams({
      chainId: networkId?.toString() || '56',
      tokenIn,
      tokenOut,
      amountIn,
      tradeType: tradeType.toString(),
    })

    const response = await fetch(`${backendApi}/v3/trading-route?${params.toString()}`, {
      method: 'GET',
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('getTradingRoute error', error)
    throw error
  }
}
