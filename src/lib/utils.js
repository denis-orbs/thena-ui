import BigNumber from 'bignumber.js'
import clsx from 'clsx'
import { sample } from 'lodash'
import { twMerge } from 'tailwind-merge'
import { WBNB } from 'thena-sdk-core'

import { RPC_PROVIDERS, RPC_PROVIDERS_REWARDS, SCAN_URLS } from '@/constant'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 20,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
})

export const ZERO_VALUE = new BigNumber(0)
export const fromWei = (number, decimals = 18) => new BigNumber(number).div(new BigNumber(10).pow(decimals))
export const toWei = (number, decimals = 18) => new BigNumber(number).times(new BigNumber(10).pow(decimals))

/** Merge classes with tailwind-merge with clsx full feature */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatAddress(string) {
  return `${string.slice(0, 4)}...${string.slice(-4)}`
}

export function getRpcUrl(chainId) {
  return sample(RPC_PROVIDERS[chainId])
}

export function getRpcUrlRewards(chainId) {
  return sample(RPC_PROVIDERS_REWARDS[chainId])
}

export const formatAmount = (amount = null, shorted = false, fixed = 3, hideNegative = true) => {
  if (!amount || new BigNumber(amount).isZero()) return '0'
  const bigAmount = new BigNumber(amount)
  if (hideNegative && bigAmount.lt(new BigNumber(1).div(new BigNumber(10).pow(fixed)))) {
    return `< ${new BigNumber(1).div(new BigNumber(10).pow(fixed)).toString(10)}`
  }

  if (bigAmount.gt(1) && bigAmount.lt(1000)) {
    return bigAmount.dp(2).toFormat()
  }

  if (shorted) {
    if (bigAmount.gte(1e12)) {
      return `${bigAmount.div(1e12).dp(2).toFormat()}T`
    }

    if (bigAmount.gte(1e9)) {
      return `${bigAmount.div(1e9).dp(2).toFormat()}B`
    }

    if (bigAmount.gte(1e6)) {
      return `${bigAmount.div(1e6).dp(2).toFormat()}M`
    }

    if (bigAmount.gte(1e3)) {
      return `${bigAmount.div(1e3).dp(2).toFormat()}K`
    }
  }

  if (bigAmount.gte(1e3)) {
    return bigAmount.dp(0).toFormat()
  }

  return bigAmount.dp(fixed).toFormat()
}

export const goToDoc = url => {
  window.open(url ?? 'https://thena.gitbook.io/', '_blank')
}

export const goScan = (chainId, address, isTxn) => {
  if (isTxn) {
    window.open(`${SCAN_URLS[chainId]}/tx/${address}`, '_blank')
  } else {
    window.open(`${SCAN_URLS[chainId]}/address/${address}`, '_blank')
  }
}

export const isInvalidAmount = amount => !amount || Number(amount) === Number.isNaN || Number(amount) <= 0

export const wrappedAddress = asset =>
  !asset ? null : asset.address === 'BNB' ? WBNB[asset.chainId].address.toLowerCase() : asset.address

export const unwrappedSymbol = asset => (!asset ? null : asset.symbol === 'WBNB' ? 'BNB' : asset.symbol)

export const ordinals = n => ['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th'

export const sliceAddress = string => `${string.slice(0, 6)}...${string.slice(-4)}`

export const convertTimestamp = timeStamp => {
  const date = new Date(timeStamp * 1000)
  return date
}

export const sleep = delay =>
  new Promise(resolve => {
    setTimeout(resolve, delay)
  })

export const retry = async (callback, breakCondition, maxRetries = 3) => {
  let retries = 0

  while (retries < maxRetries) {
    if (breakCondition) {
      break
    }

    await callback()

    retries++
    await sleep(1000)
  }
}

export const customSort = (a, b, isDesc) => {
  if (a === undefined && b === undefined) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  if (a && b) {
    return (a - b) * (isDesc ? -1 : 1)
  }
  return 0
}

export const formatNumberDecimals = (value, precision) => {
  const multiplier = 10 ** (precision || 0)
  return Math.round(value * multiplier) / multiplier
}

export function isValidHttpUrl(string) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', // fragment locator
    'i',
  )
  return pattern.test(string)
}
