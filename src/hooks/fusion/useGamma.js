import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getGammaClearingContract,
  getGammaHyperVisorContract,
  getGammaUNIProxyContract,
  getGaugeContract,
  getWBNBContract,
} from '@/lib/contracts'
import { warnToast } from '@/lib/notify'
import { formatAmount, fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

export const useGammaAdd = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onGammaAdd = useCallback(
    async (amountA, amountB, amountToWrap, gammaPair) => {
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped ? baseCurrency.wrapped.address.toLowerCase() : ''
      const quoteCurrencyAddress = quoteCurrency.wrapped ? quoteCurrency.wrapped.address.toLowerCase() : ''
      const gammaPairAddress = gammaPair ? gammaPair.address : undefined
      if (!amountA || !amountB || !gammaPairAddress) return
      const gammaUNIProxyContract = getGammaUNIProxyContract(networkId)
      const clearingAddress = await readCall(gammaUNIProxyContract, 'clearance', [], networkId)
      const clearingContract = getGammaClearingContract(clearingAddress, networkId)
      const { deposit0Max: deposit0MaxRes, deposit1Max: deposit1MaxRes } = await readCall(
        clearingContract,
        'positions',
        [gammaPairAddress],
        networkId,
      )
      const deposit0Max = fromWei(deposit0MaxRes, gammaPair.token0.decimals)
      const deposit1Max = fromWei(deposit1MaxRes, gammaPair.token1.decimals)
      if (
        deposit0Max.lt((baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountA : amountB).toExact())
      ) {
        warnToast(`Maximum deposit amount of ${gammaPair.token0.symbol} is ${deposit0Max.toFormat(0)}.`, 'warn')
        return
      }
      if (
        deposit1Max.lt((baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountB : amountA).toExact())
      ) {
        warnToast(`Maximum deposit amount of ${gammaPair.token1.symbol} is ${deposit1Max.toFormat(0)}.`, 'warn')
        return
      }
      const key = uuidv4()
      const wrapuuid = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const supplyuuid = uuidv4()
      const firstContract = getERC20Contract(baseCurrencyAddress, networkId)
      const secondContract = getERC20Contract(quoteCurrencyAddress, networkId)
      const baseAllowance = await readCall(firstContract, 'allowance', [account, gammaPairAddress], networkId)
      const isFirstApproved = fromWei(baseAllowance, baseCurrency.decimals).gte(amountA.toExact())
      const quoteAllowance = await readCall(secondContract, 'allowance', [account, gammaPairAddress], networkId)
      const isSecondApproved = fromWei(quoteAllowance, quoteCurrency.decimals).gte(amountB.toExact())
      startTxn({
        key,
        title: 'Add Liquidity',
        transactions: {
          ...(amountToWrap && {
            [wrapuuid]: {
              desc: `Wrap ${formatAmount(fromWei(amountToWrap.toString(10)))} BNB for WBNB`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
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
          [supplyuuid]: {
            desc: 'Add Liquidity',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      if (amountToWrap) {
        const wbnbContract = getWBNBContract(networkId)
        if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], amountToWrap.toString(10)))) {
          setPending(false)
          return
        }
      }
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [gammaPairAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [gammaPairAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const firstParam = (
        baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountA : amountB
      ).numerator.toString()
      const secondParam = (
        baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountB : amountA
      ).numerator.toString()

      if (
        !(await writeTxn(key, supplyuuid, gammaUNIProxyContract, 'deposit', [
          firstParam,
          secondParam,
          account,
          gammaPairAddress,
          [0, 0, 0, 0],
        ]))
      ) {
        setPending(false)
        return
      }
      onFieldAInput('')
      onFieldBInput('')
      endTxn({
        key,
        final: 'Liquidity Add Successful',
      })
      setPending(false)
    },
    [account, startTxn, writeTxn, endTxn, networkId, onFieldAInput, onFieldBInput],
  )

  return { onGammaAdd, pending }
}

export const useGammaAddAndStake = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onGammaAddAndStake = useCallback(
    async (amountA, amountB, amountToWrap, gammaPair) => {
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped ? baseCurrency.wrapped.address.toLowerCase() : ''
      const quoteCurrencyAddress = quoteCurrency.wrapped ? quoteCurrency.wrapped.address.toLowerCase() : ''
      const gammaPairAddress = gammaPair ? gammaPair.address : undefined
      if (!amountA || !amountB || !gammaPairAddress) return
      const gammaUNIProxyContract = getGammaUNIProxyContract(networkId)
      const clearingAddress = await readCall(gammaUNIProxyContract, 'clearance', [], networkId)
      const clearingContract = getGammaClearingContract(clearingAddress, networkId)
      const { deposit0Max: deposit0MaxRes, deposit1Max: deposit1MaxRes } = await readCall(
        clearingContract,
        'positions',
        [gammaPairAddress],
        networkId,
      )
      const deposit0Max = fromWei(deposit0MaxRes, gammaPair.token0.decimals)
      const deposit1Max = fromWei(deposit1MaxRes, gammaPair.token1.decimals)
      if (
        deposit0Max.lt((baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountA : amountB).toExact())
      ) {
        warnToast(`Maximum deposit amount of ${gammaPair.token0.symbol} is ${deposit0Max.toFormat(0)}.`, 'warn')
        return
      }
      if (
        deposit1Max.lt((baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountB : amountA).toExact())
      ) {
        warnToast(`Maximum deposit amount of ${gammaPair.token1.symbol} is ${deposit1Max.toFormat(0)}.`, 'warn')
        return
      }
      const key = uuidv4()
      const wrapuuid = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const approve3uuid = uuidv4()
      const supplyuuid = uuidv4()
      const stakeuuid = uuidv4()
      const firstContract = getERC20Contract(baseCurrencyAddress, networkId)
      const secondContract = getERC20Contract(quoteCurrencyAddress, networkId)
      const baseAllowance = await readCall(firstContract, 'allowance', [account, gammaPairAddress], networkId)
      const isFirstApproved = fromWei(baseAllowance, baseCurrency.decimals).gte(amountA.toExact())
      const quoteAllowance = await readCall(secondContract, 'allowance', [account, gammaPairAddress], networkId)
      const isSecondApproved = fromWei(quoteAllowance, quoteCurrency.decimals).gte(amountB.toExact())
      startTxn({
        key,
        title: 'Add Liquidity',
        transactions: {
          ...(amountToWrap && {
            [wrapuuid]: {
              desc: `Wrap ${formatAmount(fromWei(amountToWrap.toString(10)))} BNB for WBNB`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
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
          [supplyuuid]: {
            desc: 'Add Liquidity',
            status: TXN_STATUS.START,
            hash: null,
          },
          [approve3uuid]: {
            desc: 'Approve LP',
            status: TXN_STATUS.START,
            hash: null,
          },
          [stakeuuid]: {
            desc: 'Stake LP',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      if (amountToWrap) {
        const wbnbContract = getWBNBContract(networkId)
        if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], amountToWrap.toString(10)))) {
          setPending(false)
          return
        }
      }
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [gammaPairAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [gammaPairAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const firstParam = (
        baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountA : amountB
      ).numerator.toString()
      const secondParam = (
        baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountB : amountA
      ).numerator.toString()

      if (
        !(await writeTxn(key, supplyuuid, gammaUNIProxyContract, 'deposit', [
          firstParam,
          secondParam,
          account,
          gammaPairAddress,
          [0, 0, 0, 0],
        ]))
      ) {
        setPending(false)
        return
      }

      const lpContract = getERC20Contract(gammaPairAddress, networkId)
      const allowance = await readCall(lpContract, 'allowance', [account, gammaPair.gauge.address], networkId)
      const lpBalance = await readCall(lpContract, 'balanceOf', [account], networkId)
      const isLpApproved = fromWei(allowance).gte(lpBalance)

      if (!isLpApproved) {
        if (!(await writeTxn(key, approve3uuid, lpContract, 'approve', [gammaPair.gauge.address, maxUint256]))) {
          setPending(false)
          return
        }
      } else {
        updateTxn({
          key,
          uuid: approve3uuid,
          status: TXN_STATUS.SUCCESS,
        })
      }

      const gaugeContract = getGaugeContract(gammaPair.gauge.address, networkId)
      if (!(await writeTxn(key, stakeuuid, gaugeContract, 'deposit', [lpBalance]))) {
        setPending(false)
        return
      }

      onFieldAInput('')
      onFieldBInput('')
      endTxn({
        key,
        final: 'Liquidity Added And Staked',
      })
      setPending(false)
    },
    [account, startTxn, writeTxn, updateTxn, endTxn, networkId, onFieldAInput, onFieldBInput],
  )

  return { onGammaAddAndStake, pending }
}

export const useGammaRemove = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onGammaRemove = useCallback(
    async (pool, amount, callback) => {
      const key = uuidv4()
      const removeuuid = uuidv4()
      startTxn({
        key,
        title: 'Remove position',
        transactions: {
          [removeuuid]: {
            desc: `Remove ${pool.symbol} Gamma LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const gammaUNIProxyContract = getGammaHyperVisorContract(pool.address, networkId)

      if (
        !(await writeTxn(key, removeuuid, gammaUNIProxyContract, 'withdraw', [
          toWei(amount).toFixed(0),
          account,
          account,
          [0, 0, 0, 0],
        ]))
      ) {
        setPending(false)
        return
      }
      callback()
      onFieldAInput('')
      onFieldBInput('')
      endTxn({
        key,
        final: 'Liquidity Remove Successful',
      })
      setPending(false)
    },
    [account, startTxn, writeTxn, endTxn, networkId, onFieldAInput, onFieldBInput],
  )

  return { onGammaRemove, pending }
}
