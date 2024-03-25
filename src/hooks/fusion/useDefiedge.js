import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getDefiedgeStrategyContract, getERC20Contract, getGaugeContract, getWBNBContract } from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

export const useDefiedgeAdd = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onDefiedgeAdd = useCallback(
    async (amountA, amountB, amountToWrap, strategy) => {
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped ? baseCurrency.wrapped.address.toLowerCase() : ''
      const quoteCurrencyAddress = quoteCurrency.wrapped ? quoteCurrency.wrapped.address.toLowerCase() : ''
      const strategyAddress = strategy ? strategy.address : undefined
      if (!amountA || !amountB || !strategyAddress) return
      const key = uuidv4()
      const wrapuuid = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const supplyuuid = uuidv4()
      const firstContract = getERC20Contract(baseCurrencyAddress, networkId)
      const secondContract = getERC20Contract(quoteCurrencyAddress, networkId)
      const baseAllowance = await readCall(firstContract, 'allowance', [account, strategyAddress], networkId)
      const isFirstApproved = fromWei(baseAllowance, baseCurrency.decimals).gte(amountA.toExact())
      const quoteAllowance = await readCall(secondContract, 'allowance', [account, strategyAddress], networkId)
      const isSecondApproved = fromWei(quoteAllowance, quoteCurrency.decimals).gte(amountB.toExact())
      startTxn({
        key,
        title: t('Add Liquidity'),
        transactions: {
          ...(amountToWrap && {
            [wrapuuid]: {
              desc: t('Wrap'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isFirstApproved && {
            [approve1uuid]: {
              desc: `${t('Approve')} ${baseCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `${t('Approve')} ${quoteCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [supplyuuid]: {
            desc: t('Add Liquidity'),
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
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [strategyAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [strategyAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const firstParam = (
        baseCurrencyAddress === strategy.token0.address.toLowerCase() ? amountA : amountB
      ).numerator.toString()
      const secondParam = (
        baseCurrencyAddress === strategy.token0.address.toLowerCase() ? amountB : amountA
      ).numerator.toString()

      const defiedgeStrategyContract = getDefiedgeStrategyContract(strategyAddress, networkId)
      if (
        !(await writeTxn(key, supplyuuid, defiedgeStrategyContract, 'mint', [firstParam, secondParam, '0', '0', '0']))
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
    [account, startTxn, writeTxn, endTxn, networkId, onFieldAInput, onFieldBInput, t],
  )

  return { onDefiedgeAdd, pending }
}

export const useDefiedgeAddAndStake = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()
  const t = useTranslations()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onDefiedgeAddAndStake = useCallback(
    async (amountA, amountB, amountToWrap, strategy) => {
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped ? baseCurrency.wrapped.address.toLowerCase() : ''
      const quoteCurrencyAddress = quoteCurrency.wrapped ? quoteCurrency.wrapped.address.toLowerCase() : ''
      const strategyAddress = strategy ? strategy.address : undefined
      if (!amountA || !amountB || !strategyAddress) return
      const key = uuidv4()
      const wrapuuid = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const approve3uuid = uuidv4()
      const supplyuuid = uuidv4()
      const stakeuuid = uuidv4()
      const firstContract = getERC20Contract(baseCurrencyAddress, networkId)
      const secondContract = getERC20Contract(quoteCurrencyAddress, networkId)
      const baseAllowance = await readCall(firstContract, 'allowance', [account, strategyAddress], networkId)
      const isFirstApproved = fromWei(baseAllowance, baseCurrency.decimals).gte(amountA.toExact())
      const quoteAllowance = await readCall(secondContract, 'allowance', [account, strategyAddress], networkId)
      const isSecondApproved = fromWei(quoteAllowance, quoteCurrency.decimals).gte(amountB.toExact())
      startTxn({
        key,
        title: t('Add Liquidity'),
        transactions: {
          ...(amountToWrap && {
            [wrapuuid]: {
              desc: t('Wrap'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isFirstApproved && {
            [approve1uuid]: {
              desc: `${t('Approve')} ${baseCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `${t('Approve')} ${quoteCurrency.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [supplyuuid]: {
            desc: t('Add Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
          [approve3uuid]: {
            desc: `${t('Approve')} LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
          [stakeuuid]: {
            desc: `${t('Stake')} LP`,
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
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [strategyAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [strategyAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const firstParam = (
        baseCurrencyAddress === strategy.token0.address.toLowerCase() ? amountA : amountB
      ).numerator.toString()
      const secondParam = (
        baseCurrencyAddress === strategy.token0.address.toLowerCase() ? amountB : amountA
      ).numerator.toString()

      const defiedgeStrategyContract = getDefiedgeStrategyContract(strategyAddress, networkId)
      if (
        !(await writeTxn(key, supplyuuid, defiedgeStrategyContract, 'mint', [firstParam, secondParam, '0', '0', '0']))
      ) {
        setPending(false)
        return
      }

      const lpContract = getERC20Contract(strategyAddress, networkId)
      const allowance = await readCall(lpContract, 'allowance', [account, strategy.gauge.address], networkId)
      const lpBalance = await readCall(lpContract, 'balanceOf', [account], networkId)
      const isLpApproved = fromWei(allowance).gte(lpBalance)

      if (!isLpApproved) {
        if (!(await writeTxn(key, approve3uuid, lpContract, 'approve', [strategy.gauge.address, maxUint256]))) {
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

      const gaugeContract = getGaugeContract(strategy.gauge.address, networkId)
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
    [account, startTxn, writeTxn, updateTxn, endTxn, networkId, onFieldAInput, onFieldBInput, t],
  )

  return { onDefiedgeAddAndStake, pending }
}

export const useDefiedgeRemove = () => {
  const [pending, setPending] = useState(false)
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()
  const t = useTranslations()

  const onDefiedgeRemove = useCallback(
    async (pool, amount, callback) => {
      const key = uuidv4()
      const removeuuid = uuidv4()
      startTxn({
        key,
        title: t('Remove Liquidity'),
        transactions: {
          [removeuuid]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const contract = getDefiedgeStrategyContract(pool.address, networkId)

      if (!(await writeTxn(key, removeuuid, contract, 'burn', [toWei(amount).toFixed(0), '0', '0']))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Liquidity Remove Successful',
      })
      onFieldAInput('')
      onFieldBInput('')
      callback()
      setPending(false)
    },
    [startTxn, writeTxn, endTxn, networkId, onFieldAInput, onFieldBInput, t],
  )

  return { onDefiedgeRemove, pending }
}
