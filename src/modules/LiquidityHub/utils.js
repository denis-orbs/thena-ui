import { BigNumber as BN } from 'bignumber.js'

export const subtractSlippage = (allowedSlippage, outAmount) => {
  if (!outAmount) return undefined

  return BN(outAmount)
    .multipliedBy(BN(10000 - allowedSlippage * 100))
    .div(BN(10000))
    .decimalPlaces(0)
    .toString()
}

export async function promiseWithTimeout(promise, timeout) {
  let timer

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('timeout'))
    }, timeout)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timer)
    return result
  } catch (error) {
    clearTimeout(timer)
    throw error
  }
}
