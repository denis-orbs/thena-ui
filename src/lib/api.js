import { ChainId } from 'thena-sdk-core/dist'

const backendApi = 'https://api.thena.fi/api/v1'

export const fetchAssets = () =>
  fetch(`${backendApi}/assets`)
    .then(r => r.json())
    .then(r => r.data)

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
