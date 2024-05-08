'use client'

/* eslint-disable simple-import-sort/imports */
import React, { useCallback } from 'react'
import { TWAP as ThenaTwap } from '@orbs-network/twap-ui-thena'
import BN from 'bignumber.js'
import { useEstimateFeesPerGas } from 'wagmi'
import TokenModal from '@/modules/TokenModal'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/lib/wallets/useWallet'
import { useWalletModal } from '@/state/settings/hooks'

export { Orders } from '@orbs-network/twap-ui-thena'

export function Twap({
  fromAsset,
  toAsset,
  setFromAddress,
  setToAddress,
  outAmount,
  setFromAmount,
  fromAmount,
  limit,
}) {
  const { account, connector, chainId } = useWallet()
  const baseAssets = useAssets()
  const { openWalletModal } = useWalletModal()
  const estimate = useEstimateFeesPerGas().data

  const onSrcTokenSelected = useCallback(
    asset => {
      setFromAddress(asset.address)
    },
    [setFromAddress],
  )

  const onDestTokenSelected = useCallback(
    asset => {
      setToAddress(asset.address)
    },
    [setToAddress],
  )
  const maxFeePerGas = estimate?.maxFeePerGas.toString()
  const maxPriorityFeePerGas = estimate?.maxPriorityFeePerGas.toString()

  console.log({ maxFeePerGas, maxPriorityFeePerGas })
  return (
    <ThenaTwap
      connect={openWalletModal}
      dappTokens={baseAssets}
      connectedChainId={chainId}
      connector={connector}
      account={account}
      TokenSelectModal={TokenModal}
      srcToken={fromAsset?.address}
      dstToken={toAsset?.address}
      onSrcTokenSelected={onSrcTokenSelected}
      onDestTokenSelected={onDestTokenSelected}
      setFromAmount={setFromAmount}
      outAmount={outAmount}
      outAmountLoading={!BN(fromAmount || '0').isZero() && !outAmount}
      limit={limit}
      maxFeePerGas={maxFeePerGas}
      priorityFeePerGas={maxPriorityFeePerGas}
    />
  )
}
