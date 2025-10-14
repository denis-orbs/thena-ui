import { useEffect, useState } from 'react'

import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'

import useWallet from './useWallet'

export function useOpBNBTheTokenBalance() {
  const [balance, setBalance] = useState(null)
  const { account } = useWallet()

  useEffect(() => {
    if (!account) return

    const fetchBalance = async () => {
      const contract = getERC20Contract(Contracts.THE[CHAIN_ID.OPBNB], CHAIN_ID.OPBNB)
      const res = await readCall(contract, 'balanceOf', [account], CHAIN_ID.OPBNB)

      if (res) {
        setBalance(fromWei(res, 18))
      }
    }

    fetchBalance()
  }, [account])

  return balance
}
