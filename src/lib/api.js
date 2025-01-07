import _ from 'lodash'
import { ChainId } from 'thena-sdk-core'

import Contracts from '@/constant/contracts'
import { liquidityHub } from '@/modules/LiquidityHub'

import { ZERO_VALUE } from './utils'

// const backendApi = 'https://api.thena.fi/api/v1'
const backendApi = 'https://testnet-thena-backend.zinza.com.vn/api/v1'

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

export const fetchPoolsV3 = params =>
  fetch(`${backendApi}/${params[1] === ChainId.BSC || params[1] === 97 ? 'fusions?v=3' : 'opfusions'}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchStats = () =>
  fetch(`${backendApi}/stats`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchBscPairsV3 = () =>
  fetch(`${backendApi}/topPairs/56?v=3`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchCLpoolV2 = chainId =>
  fetch(`${backendApi}/topPairs/${chainId}?type=CL`)
    .then(r => r.json())
    .then(r => (Array.isArray(r.data) ? r.data : []))

export const fetchBscTestnetPairsV3 = () =>
  fetch(`${backendApi}/topPairs/97?v=3`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchWeightedPools = chainId =>
  fetch(`${backendApi}/weightedpools/${chainId}`)
    .then(r => r.json())
    .then(r => (Array.isArray(r.data) ? r.data : []))

export const fetchOpPairs = () =>
  fetch(`${backendApi}/topPairs/204`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchTopTokens = params =>
  fetch(`${backendApi}/topTokens/${params[1]}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetVeTHETokens = (chainId, account) =>
  fetch(`${backendApi}/vethes/${chainId}/${account}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchNfts = nftId =>
  fetch(`https://ipfs.io/ipfs/QmYG7JJcLxxewgCD9Az2zcnS7CCCZKa6s2738ZC2547eTn/${nftId}`).then(r => r.json())

export const fetchRevenue = () => fetch('https://flask-henlo-world.vercel.app/').then(r => r.json())

export const fetchPairInfos = (account, chainId) => {
  const res = fetch(`${backendApi}/getpairaccount/${chainId}?account=${account?.toLowerCase()}`)
    .then(r => r.json())
    .then(r => r.data)
  return res
}

export const fetchVotingHistory = (account, skip = 0, limit = 10) =>
  fetch(`${backendApi}/vote/history?address=${account}&skip=${skip}&limit=${limit}`)
    .then(r => r.json())
    .then(r => r)
