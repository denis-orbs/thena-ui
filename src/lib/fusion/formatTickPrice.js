import { Fraction, JSBI } from 'thena-sdk-core'

import { Bound } from '@/state/fusion/actions'

export const formatCurrencyAmount = (amount, sigFigs) => {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (amount.divide(amount.decimalScale).lessThan(new Fraction(1, 10000))) {
    return '<0.0001'
  }

  return amount.toSignificant(sigFigs)
}

const formatPrice = (price, sigFigs) => {
  if (!price) {
    return '-'
  }

  return price.toSignificant(sigFigs)
}

export const formatTickPrice = (price, atLimit, direction, placeholder) => {
  if (atLimit[direction]) {
    return direction === Bound.LOWER ? '0' : '∞'
  }

  if (!price && placeholder !== undefined) {
    return placeholder
  }

  return formatPrice(price, 5)
}

export const getRatio = (lower, current, upper) => {
  try {
    if (!current.greaterThan(lower)) {
      return 100
    }
    if (!current.lessThan(upper)) {
      return 0
    }

    const a = Number.parseFloat(lower.toSignificant(15))
    const b = Number.parseFloat(upper.toSignificant(15))
    const c = Number.parseFloat(current.toSignificant(15))

    const ratio = Math.floor((1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100)

    if (ratio < 0 || ratio > 100) {
      throw Error('Out of range')
    }

    return ratio
  } catch {
    return undefined
  }
}
