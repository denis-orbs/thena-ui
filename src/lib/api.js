import _ from 'lodash'
import { ChainId } from 'thena-sdk-core/dist'

import Contracts from '@/constant/contracts'
import { liquidityHub } from '@/modules/LiquidityHub'

const backendApi = 'https://api.thena.fi/api/v1'

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
      balance: 0,
    }))
  } catch (ex) {
    console.error('get assets had error', ex)
    return null
  }
}

export const fetchPools = params =>
  fetch(`${backendApi}/${params[1] === ChainId.BSC ? 'fusions' : 'opfusions'}`)
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

export const fetchOpPairs = () =>
  fetch(`${backendApi}/topPairs/204`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchTopTokens = params =>
  fetch(`${backendApi}/topTokens/${params[1]}`)
    .then(r => r.json())
    .then(r => r.data)

export const fetchNfts = nftId =>
  fetch(`https://ipfs.io/ipfs/QmYG7JJcLxxewgCD9Az2zcnS7CCCZKa6s2738ZC2547eTn/${nftId}`).then(r => r.json())
