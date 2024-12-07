import { UNKNOWN_LOGO } from '@/constant'
import { ERC20Abi } from '@/constant/abi'
import { callMulti, readCall } from '@/lib/contractActions'

export function getFromLocalStorage(key) {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key)
  }
  return null
}

export function getFromSessionStorage(key) {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key)
  }
  return null
}

const fetchTokenDataFromSC = async ({ address, account, chainId }) => {
  if (!address) {
    return {
      address: '',
      name: 'UNKNOWN',
      symbol: 'UNKNOWN',
      decimals: 18,
      logoURI: UNKNOWN_LOGO,
      balance: 0n,
      price: 0,
      isWarning: true,
    }
  }

  try {
    const res = await callMulti(
      ['name', 'symbol', 'decimals'].map(functionName => ({
        address,
        abi: ERC20Abi,
        functionName,
        chainId,
      })),
    )

    let balance = 0n
    if (account) {
      balance = await readCall({ address, abi: ERC20Abi }, 'balanceOf', [account], chainId)
    }

    return {
      address: address?.toLowerCase(),
      name: res?.[0] ?? 'UNKNOWN',
      symbol: res?.[1] ?? 'UNKNOWN',
      decimals: res?.[2] ?? 18,
      logoURI: UNKNOWN_LOGO,
      balance,
      price: 0,
      isWarning: true,
    }
  } catch (error) {
    console.error(error)
    return undefined
  }
}

export const getTokenInfo = async ({ address, assets, account, chainId }) => {
  let asset = assets.find(item => item.address.toLowerCase() === address?.toLowerCase())
  if (!asset) {
    asset = await fetchTokenDataFromSC({ address, account, chainId })
  }
  return asset
}
