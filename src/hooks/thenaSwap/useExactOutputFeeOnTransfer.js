import BigNumber from 'bignumber.js'

import { readCall } from '@/lib/contractActions'
import { getElitenessOFTContract } from '@/lib/contracts'
import { fromWei } from '@/utils/utils'

export async function getExactOutputAmountFeeOnTransfer({ isEnabled, outputAmount, chainId }) {
  try {
    if (!isEnabled) return outputAmount
    const taxRate = await readCall(getElitenessOFTContract(), 'taxRate', [], chainId)

    const exactOutputAmount = BigNumber(outputAmount).times(1 - fromWei(taxRate, 18))

    return exactOutputAmount ?? outputAmount
  } catch (error) {
    console.error('Error getting exact output amount fee on transfer', error)
    return outputAmount
  }
}
