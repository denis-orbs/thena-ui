/* THENA Dev */
/* eslint-disable simple-import-sort/imports, react/jsx-filename-extension */
import BigNumber from 'bignumber.js'
import { OrderFilter, TimeUnit } from '@orbs-network/spot-react'
import { zeroAddress } from 'viem'

import { toWei } from '@/utils/utils'

import { ORDER_TYPE_TITLES } from './constants'

export function parseAsset(asset) {
  if (!asset) return undefined

  return {
    address: asset.address === 'BNB' ? zeroAddress : asset.address,
    decimals: asset.decimals,
    symbol: asset.symbol,
    logoUrl: asset.logoURI || '',
  }
}

export function formatTimestamp(value) {
  if (!value) return '-'
  const timestamp = Number(value)
  const millis = timestamp > 1000000000000 ? timestamp : timestamp * 1000
  const date = new Date(millis)

  if (Number.isNaN(date.getTime())) return '-'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function formatDecimals(value, scale = 3, maxDecimals = 8) {
  if (!value) return ''
  const stringValue = value.toString()

  // ─── keep the sign, work with the absolute value ────────────────
  const sign = stringValue.startsWith('-') ? '-' : ''
  const abs = sign ? stringValue.slice(1) : stringValue

  const [intPart, rawDec = ''] = abs.split('.')

  // Fast-path: decimal part is all zeros (or absent) ───────────────
  if (!rawDec || Number(rawDec) === 0) return sign + intPart

  if (intPart !== '0') {
    const sliced = rawDec.slice(0, scale)
    const cleaned = sliced.replace(/0+$/, '') // drop trailing zeros
    const trimmed = cleaned ? `.${cleaned}` : ''
    return sign + intPart + trimmed
  }

  /** Case 2 – |value| < 1 **************************************** */
  const firstSigIdx = rawDec.search(/[^0]/) // first non-zero position
  if (firstSigIdx === -1) return '0' // decimal part is all zeros
  if (firstSigIdx + 1 > maxDecimals) return '0' // too many leading zeros → 0

  const leadingZeros = rawDec.slice(0, firstSigIdx) // keep them
  const significantRaw = rawDec.slice(firstSigIdx).slice(0, scale)
  const significant = significantRaw.replace(/0+$/, '') // trim trailing zeros

  return significant ? `${sign}0.${leadingZeros}${significant}` : '0'
}

export function formatDuration(value) {
  const millis = Number(value || 0)
  if (!millis) return '-'

  const days = millis / TimeUnit.Days
  if (days >= 1) return `${formatDecimals(days, 2)} days`

  const hours = millis / TimeUnit.Hours
  if (hours >= 1) return `${formatDecimals(hours, 2)} hours`

  const minutes = millis / TimeUnit.Minutes
  return `${formatDecimals(minutes, 2)} minutes`
}

function formatUsd(value) {
  return value ? `$${formatDecimals(value, 2)}` : ''
}

function formatTokenAmountWithUsd(value, symbol, usd, fixed = 4) {
  const amount = value ? formatDecimals(value, fixed) : ''
  const usdAmount = formatUsd(usd)

  if (!amount) return usdAmount
  return (
    <>
      <span>{amount}</span>
      {symbol ? <span> {symbol}</span> : null}
      {usdAmount ? <span className='text-xs font-normal text-neutral-400 opacity-70'> ({usdAmount})</span> : null}
    </>
  )
}

export function formatPriceQuote(price, usd, srcToken, dstToken) {
  const amount = new BigNumber(price || 0)
  if (!amount.isFinite() || amount.isNaN() || amount.isZero()) return ''

  const priceFixed = 4
  if (amount.dp(priceFixed).isZero()) return ''

  const priceAmount = formatTokenAmountWithUsd(amount, dstToken?.symbol, usd, priceFixed)
  return (
    <>
      <span>1 {srcToken?.symbol || ''} = </span>
      <span>{priceAmount}</span>
    </>
  )
}

export function getOrderTitle(orderType, t) {
  return t(ORDER_TYPE_TITLES[orderType]) || orderType || 'Order'
}

export function getFilteredOrders(orders, filter) {
  const items = filter === OrderFilter.All ? orders : orders.filter(order => order.status === filter)
  return [...items].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
}

export function getWeiBalanceFromAsset(asset) {
  if (!asset || !asset?.balance?.toString()) return undefined
  return toWei(asset.balance, asset.decimals).toString()
}
