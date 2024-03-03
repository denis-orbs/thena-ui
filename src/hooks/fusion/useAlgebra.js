import { useCallback, useState } from 'react'
import { JSBI, Percent } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract } from '@/lib/contracts'
import { NonfungiblePositionManager } from '@/lib/fusion/entities/nonfungiblePositionManager'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useAlgebraAdd = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, writeTxn, endTxn, sendTxn } = useTxn()

  const onAlgebraAdd = useCallback(
    async (amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline) => {
      const key = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const adduuid = uuidv4()
      const algebraAddress = Contracts.nonfungiblePositionManager[chainId]
      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
      const { position, depositADisabled, depositBDisabled, noLiquidity } = mintInfo
      const baseCurrencyAddress = baseCurrency.wrapped?.address.toLowerCase()
      const quoteCurrencyAddress = quoteCurrency.wrapped?.address.toLowerCase()
      let isFirstApproved = true
      let isSecondApproved = true
      const firstContract = !baseCurrency.isNative ? getERC20Contract(baseCurrencyAddress, chainId) : null
      const secondContract = !quoteCurrency.isNative ? getERC20Contract(quoteCurrencyAddress, chainId) : null
      if (!baseCurrency.isNative && !depositADisabled) {
        const allowance = await readCall(firstContract, 'allowance', [account, algebraAddress], chainId)
        isFirstApproved = fromWei(allowance, baseCurrency.decimals).gte(amountA.toExact())
      }
      if (!quoteCurrency.isNative && !depositBDisabled) {
        const allowance = await readCall(secondContract, 'allowance', [account, algebraAddress], chainId)
        isSecondApproved = fromWei(allowance, quoteCurrency.decimals).gte(amountB.toExact())
      }
      startTxn({
        key,
        title: 'Add Liquidity',
        transactions: {
          ...(!isFirstApproved && {
            [approve1uuid]: {
              desc: `Approve ${baseCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `Approve ${quoteCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [adduuid]: {
            desc: 'Add Liquidity',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [algebraAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [algebraAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }
      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined
      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
        slippageTolerance: allowedSlippage,
        recipient: account,
        deadline: timestamp.toString(),
        useNative,
        createPool: noLiquidity,
      })
      if (!(await sendTxn(key, adduuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Liquidity Add Successful',
      })
      setPending(false)
    },
    [account, startTxn, endTxn, writeTxn, sendTxn, chainId],
  )

  return { onAlgebraAdd, pending }
}

export const useAlgebraClaim = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, sendTxn } = useTxn()

  const onAlgebraClaim = useCallback(
    async (tokenId, feeValue0, feeValue1, callback) => {
      const key = uuidv4()
      const claimuuid = uuidv4()
      startTxn({
        key,
        title: 'Claim fees',
        transactions: {
          [claimuuid]: {
            desc: `Claim ${feeValue0.currency.symbol}/${feeValue1.currency.symbol} Fees`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const algebraAddress = Contracts.nonfungiblePositionManager[chainId]
      const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
        tokenId,
        expectedCurrencyOwed0: feeValue0,
        expectedCurrencyOwed1: feeValue1,
        recipient: account,
      })

      if (!(await sendTxn(key, claimuuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Claimed fees',
      })
      setPending(false)
      callback()
    },
    [account, startTxn, endTxn, sendTxn, chainId],
  )

  return { onAlgebraClaim, pending }
}

export const useAlgebraRemove = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, sendTxn } = useTxn()

  const onAlgebraRemove = useCallback(
    async (tokenId, position, liquidityPercentage, feeValue0, feeValue1, slippage, deadline, callback) => {
      const key = uuidv4()
      const removeuuid = uuidv4()
      startTxn({
        key,
        title: 'Remove position',
        transactions: {
          [removeuuid]: {
            desc: `Remove ${feeValue0.currency.symbol}/${feeValue1.currency.symbol} position`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const algebraAddress = Contracts.nonfungiblePositionManager[chainId]
      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
        tokenId,
        liquidityPercentage,
        slippageTolerance: allowedSlippage,
        deadline: timestamp.toString(),
        collectOptions: {
          expectedCurrencyOwed0: feeValue0,
          expectedCurrencyOwed1: feeValue1,
          recipient: account,
        },
      })

      if (!(await sendTxn(key, removeuuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Removed position',
      })
      setPending(false)
      callback()
    },
    [account, startTxn, endTxn, sendTxn, chainId],
  )

  return { onAlgebraRemove, pending }
}

export const useAlgebraBurn = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, sendTxn } = useTxn()

  const onAlgebraBurn = useCallback(
    async (tokenId, callback) => {
      const key = uuidv4()
      const burnuuid = uuidv4()
      startTxn({
        key,
        title: `Burn NFT #${tokenId}`,
        transactions: {
          [burnuuid]: {
            desc: `Burn NFT #${tokenId}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const algebraAddress = Contracts.nonfungiblePositionManager[chainId]
      const { calldata, value } = NonfungiblePositionManager.burnCallParameters(tokenId)

      if (!(await sendTxn(key, burnuuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: `NFT #${tokenId} Burnt`,
      })
      setPending(false)
      callback()
    },
    [startTxn, endTxn, sendTxn, chainId],
  )

  return { onAlgebraBurn, pending }
}

export const useAlgebraIncrease = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()

  const onAlgebraIncrease = useCallback(
    async (amountA, amountB, position, depositADisabled, depositBDisabled, slippage, deadline, tokenId, callback) => {
      const algebraAddress = Contracts.nonfungiblePositionManager[chainId]
      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped?.address.toLowerCase()
      const quoteCurrencyAddress = quoteCurrency.wrapped?.address.toLowerCase()
      let isFirstApproved = true
      let isSecondApproved = true
      const firstContract = !baseCurrency.isNative ? getERC20Contract(baseCurrencyAddress, chainId) : null
      const secondContract = !quoteCurrency.isNative ? getERC20Contract(quoteCurrencyAddress, chainId) : null
      if (!baseCurrency.isNative && !depositADisabled) {
        const allowance = await readCall(firstContract, 'allowance', [account, algebraAddress], chainId)
        isFirstApproved = fromWei(allowance, baseCurrency.decimals).gte(amountA.toExact())
      }
      if (!quoteCurrency.isNative && !depositBDisabled) {
        const allowance = await readCall(secondContract, 'allowance', [account, algebraAddress], chainId)
        isSecondApproved = fromWei(allowance, quoteCurrency.decimals).gte(amountB.toExact())
      }
      const key = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const adduuid = uuidv4()
      startTxn({
        key,
        title: 'Add position',
        transactions: {
          ...(!isFirstApproved && {
            [approve1uuid]: {
              desc: `Approve ${baseCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `Approve ${quoteCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [adduuid]: {
            desc: `Add position for NFT #${tokenId}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [algebraAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [algebraAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined
      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
        tokenId,
        slippageTolerance: allowedSlippage,
        deadline: timestamp.toString(),
        useNative,
      })

      if (!(await sendTxn(key, adduuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Added Position',
      })
      setPending(false)
      callback()
    },
    [startTxn, endTxn, writeTxn, sendTxn, account, chainId],
  )

  return { onAlgebraIncrease, pending }
}
