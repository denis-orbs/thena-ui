import _ from 'lodash'

import Contracts from '@/constant/contracts'
import { liquidityHub } from '@/modules/LiquidityHub'

import { ZERO_VALUE } from './utils'

// TODO: Fix on prod
const backendApi = 'https://api.thena.fi/api'

const getApiVersion = version => (version === 3 ? 'v3' : 'v1')

export const fetchAssets = async (networkId, liquidityHubEnabled) => {
  try {
    const getTokens = async () => {
      const response = await fetch(`${backendApi}/v1/assets`, {
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
      logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
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

    const customAssets = _.filter(
      _.uniqBy(customAssetsData, it => it.address.toLowerCase()),
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

export const fetchWeightedPools = ({ networkId }) =>
  fetch(`${backendApi}/v3/weightedpools/${networkId}`)
    .then(r => r.json())
    .then(r => (Array.isArray(r.data) ? r.data : []))

export const fetchTopTokens = async ({ networkId, version = 3 }) => {
  const apiVersion = getApiVersion(version)
  return fetch(`${backendApi}/${apiVersion}/topTokens/${networkId}`)
    .then(r => r.json())
    .then(r => r.data)
}

export const fetchVeTHETokens = (chainId, account) =>
  fetch(`${backendApi}/v3/vethes/${chainId}/${account?.toLowerCase()}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchNfts = nftId =>
  fetch(`https://ipfs.io/ipfs/QmYG7JJcLxxewgCD9Az2zcnS7CCCZKa6s2738ZC2547eTn/${nftId}`).then(r => r.json())

export const fetchRevenue = () => fetch('https://flask-henlo-world.vercel.app/').then(r => r.json())

export const fetchFusionPoolsInfos = ({ account, chainId }) => {
  const res = fetch(`${backendApi}/v3/getpairaccount/${chainId}?account=${account?.toLowerCase()}`)
    .then(r => r.json())
    .then(r => r.data)
  return res
}

export const fetchVotingHistory = async (account, veTHEId, chainId, skip = 0, limit = 10) => {
  let url = `${backendApi}/v3/vote/history/${chainId}?address=${account?.toLowerCase()}&skip=${skip}&limit=${limit}`
  if (veTHEId !== 'All') url += `&tokenId=${veTHEId}`

  return fetch(url)
    .then(r => r.json())
    .then(r => r)
}

export const fetchAutomationHistory = (chainId, tokenId) =>
  fetch(`${backendApi}/v3/vethes/automation/${chainId}/${tokenId}`)
    .then(r => r.json())
    .then(r => r.data)
