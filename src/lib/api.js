import _ from 'lodash'

import Contracts from '@/constant/contracts'
import { liquidityHub } from '@/modules/LiquidityHub'

import { ZERO_VALUE } from './utils'

// TODO: Fix on prod
// const backendApi = 'https://api.thena.fi/api/v1'
const backendApi = 'https://api-dev.thena.fi/api/v1'

export const fetchAssets = async (networkId, liquidityHubEnabled) => {
  try {
    const getTokens = async () => {
      const response = await fetch(`${backendApi}/assets`, {
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
      const response = await fetch(`${backendApi}/customAssets/${networkId}`, {
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
  let url = `${backendApi}/fusions/${networkId}?v=${version}`
  if (type) url += `&type=${type}`

  return fetch(url)
    .then(r => r.json())
    .then(r => r.data)
}

export const fetchStats = () =>
  fetch(`${backendApi}/stats`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchTopPairs = async ({ networkId, version = 3, type }) => {
  let url = `${backendApi}/topPairs/${networkId}?v=${version}`
  if (type) url += `&type=${type}`

  return fetch(url)
    .then(r => r.json())
    .then(r => r.data)
}

export const fetchV2SolidlyPairs = async ({ networkId }) =>
  fetch(`${backendApi}/toppairs/${networkId}?v=2&type=solidly`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchWeightedPools = ({ networkId }) =>
  fetch(`${backendApi}/weightedpools/${networkId}`)
    .then(r => r.json())
    .then(r => (Array.isArray(r.data) ? r.data : []))

export const fetchTopTokens = ({ networkId, version = 3 }) =>
  fetch(`${backendApi}/topTokens/${networkId}?v=${version}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchVeTHETokens = (chainId, account) =>
  fetch(`${backendApi}/vethes/${chainId}/${account}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchNfts = nftId =>
  fetch(`https://ipfs.io/ipfs/QmYG7JJcLxxewgCD9Az2zcnS7CCCZKa6s2738ZC2547eTn/${nftId}`).then(r => r.json())

export const fetchRevenue = () => fetch('https://flask-henlo-world.vercel.app/').then(r => r.json())

export const fetchFusionPoolsInfos = ({ account, chainId }) => {
  const res = fetch(`${backendApi}/getpairaccount/${chainId}?account=${account?.toLowerCase()}`)
    .then(r => r.json())
    .then(r => r.data)
  return res
}

export const fetchVotingHistory = (account, veTHEId, chainId, skip = 0, limit = 10) =>
  fetch(
    `${backendApi}/vote/history/${chainId}?${
      veTHEId !== 'All' ? `tokenId=${veTHEId}&` : ''
    }address=${account}&skip=${skip}&limit=${limit}`,
  )
    .then(r => r.json())
    .then(r => r)

export const fetchAutomationHistory = (chainId, tokenId) =>
  fetch(`${backendApi}/vethes/automation/${chainId}/${tokenId}`)
    .then(r => r.json())
    .then(r => r.data)
