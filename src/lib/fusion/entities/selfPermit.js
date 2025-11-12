import { toHex } from 'thenafi-fusion-sdk'
import { encodeFunctionData } from 'viem'

import { SelfPermitABI } from '@/constant/abi/fusion/SelfPermitABI'

function isAllowedPermit(permitOptions) {
  return 'nonce' in permitOptions
}

export class SelfPermit {
  constructor() {
    if (this.constructor === SelfPermit) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  static getCalldata(func, args) {
    return encodeFunctionData({
      abi: SelfPermitABI,
      functionName: func,
      args,
    })
  }

  static encodePermit(token, options) {
    return isAllowedPermit(options)
      ? SelfPermit.getCalldata('selfPermitAllowed', [
          token.address,
          toHex(options.nonce),
          toHex(options.expiry),
          options.v,
          options.r,
          options.s,
        ])
      : SelfPermit.getCalldata('selfPermit', [
          token.address,
          toHex(options.amount),
          toHex(options.deadline),
          options.v,
          options.r,
          options.s,
        ])
  }
}
