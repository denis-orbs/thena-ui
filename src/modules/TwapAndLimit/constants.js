/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { OrderFilter, OrderType, TimeUnit } from '@orbs-network/spot-react'

export const DURATION_OPTIONS = [
  { text: 'Minutes', value: TimeUnit.Minutes },
  { text: 'Hours', value: TimeUnit.Hours },
  { text: 'Days', value: TimeUnit.Days },
]

export const ORDER_FILTER_OPTIONS = [
  { text: 'All', value: OrderFilter.All },
  { text: 'Open', value: OrderFilter.Open },
  { text: 'Completed', value: OrderFilter.Completed },
  { text: 'Cancelled', value: OrderFilter.Cancelled },
  { text: 'Expired', value: OrderFilter.Expired },
]

export const ORDER_TYPE_TITLES = {
  [OrderType.LIMIT]: 'limit',
  [OrderType.TWAP_LIMIT]: 'twapLimit',
  [OrderType.TWAP_MARKET]: 'twapMarket',
  [OrderType.STOP_LOSS_LIMIT]: 'stopLossLimit',
  [OrderType.STOP_LOSS_MARKET]: 'stopLossMarket',
  [OrderType.TAKE_PROFIT_LIMIT]: 'takeProfit',
  [OrderType.TAKE_PROFIT_MARKET]: 'takeProfit',
}
