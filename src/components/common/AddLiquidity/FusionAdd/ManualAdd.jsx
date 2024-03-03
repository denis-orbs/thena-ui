'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import React, { useCallback } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { useAlgebraAdd } from '@/hooks/fusion/useAlgebra'
import { warnToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'
import { Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'

export default function ManualAdd({ baseCurrency, quoteCurrency, mintInfo }) {
  const { account } = useWallet()
  const { open } = useWeb3Modal()
  const { errorMessage } = mintInfo
  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]
  const { onAlgebraAdd, pending } = useAlgebraAdd()
  const { slippage, deadline } = useSettings()

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }

    onAlgebraAdd(amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline)
  }, [errorMessage, baseCurrency, quoteCurrency, amountA, amountB, mintInfo, slippage, deadline, onAlgebraAdd])

  if (!account) {
    return (
      <PrimaryButton className='w-full' onClick={() => open()}>
        Connect Wallet
      </PrimaryButton>
    )
  }

  return (
    <PrimaryButton
      disabled={pending}
      onClick={() => {
        onAddLiquidity()
      }}
      className='w-full'
    >
      Add Liquidity
    </PrimaryButton>
  )
}
