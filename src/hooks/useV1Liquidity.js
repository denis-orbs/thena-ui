import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TAX_ASSETS, TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getGaugeContract, getPairContract, getRouterContract } from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

export const useV1Add = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onV1Add = useCallback(
    async (firstAsset, secondAsset, firstAmount, secondAmount, isStable, deadline, slippage, callback) => {
      const key = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const adduuid = uuidv4()
      const routerAddress = Contracts.solidlyRouter[chainId]
      let isFirstApproved = true
      let isSecondApproved = true
      const firstContract = firstAsset.address !== 'BNB' ? getERC20Contract(firstAsset.address, chainId) : null
      const secondContract = secondAsset.address !== 'BNB' ? getERC20Contract(secondAsset.address, chainId) : null
      if (firstAsset.address !== 'BNB') {
        const allowance = await readCall(firstContract, 'allowance', [account, routerAddress], chainId)
        isFirstApproved = fromWei(allowance, firstAsset.decimals).gte(firstAmount)
      }
      if (secondAsset.address !== 'BNB') {
        const allowance = await readCall(secondContract, 'allowance', [account, routerAddress], chainId)
        isSecondApproved = fromWei(allowance, secondAsset.decimals).gte(secondAmount)
      }
      startTxn({
        key,
        title: 'Add Liquidity',
        transactions: {
          ...(!isFirstApproved && {
            [approve1uuid]: {
              desc: `${t('Approve')} ${firstAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `${t('Approve')} ${secondAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [adduuid]: {
            desc: t('Add Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approve1uuid, firstContract, 'approve', [routerAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approve2uuid, secondContract, 'approve', [routerAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }
      const routerContract = getRouterContract(chainId)
      const sendSlippage = new BigNumber(100).minus(slippage).div(100)
      const sendAmount0 = toWei(firstAmount, firstAsset.decimals).toFixed(0)
      const sendAmount1 = toWei(secondAmount, secondAsset.decimals).toFixed(0)
      const deadlineVal = `${dayjs()
        .add(Number(deadline) * 60, 'second')
        .unix()}`
      let sendAmount0Min = toWei(sendSlippage.times(firstAmount), firstAsset.decimals).toFixed(0)
      let sendAmount1Min = toWei(sendSlippage.times(secondAmount), secondAsset.decimals).toFixed(0)

      const wrappedAddress0 = firstAsset.address === 'BNB' ? WBNB[chainId].address : firstAsset.address
      const wrappedAddress1 = secondAsset.address === 'BNB' ? WBNB[chainId].address : secondAsset.address

      const quoteRes = await readCall(
        routerContract,
        'quoteAddLiquidity',
        [wrappedAddress0, wrappedAddress1, isStable, sendAmount0, sendAmount1],
        chainId,
      )

      if (quoteRes && Array.isArray(quoteRes) && quoteRes.length) {
        sendAmount0Min = sendSlippage.times(quoteRes[0]).toFixed(0)
        sendAmount1Min = sendSlippage.times(quoteRes[1]).toFixed(0)
      }

      let func = 'addLiquidity'
      let params = [
        firstAsset.address,
        secondAsset.address,
        isStable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        account,
        deadlineVal,
      ]

      let sendValue = '0'

      if (firstAsset.address === 'BNB') {
        func = 'addLiquidityETH'
        params = [secondAsset.address, isStable, sendAmount1, sendAmount1Min, sendAmount0Min, account, deadlineVal]
        sendValue = sendAmount0
      }
      if (secondAsset.address === 'BNB') {
        func = 'addLiquidityETH'
        params = [firstAsset.address, isStable, sendAmount0, sendAmount0Min, sendAmount1Min, account, deadlineVal]
        sendValue = sendAmount1
      }
      if (!(await writeTxn(key, adduuid, routerContract, func, params, sendValue))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Liquidity Add Successful',
      })

      const poolAddress = await readCall(
        routerContract,
        'pairFor',
        [wrappedAddress0, wrappedAddress1, isStable],
        chainId,
      )
      callback(poolAddress?.toLowerCase())
      setPending(false)
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onV1Add, pending }
}

export const useV1AddAndStake = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()
  const t = useTranslations()

  const onV1AddAndStake = useCallback(
    async (pair, firstAsset, secondAsset, firstAmount, secondAmount, isStable, deadline, slippage, callback) => {
      const key = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const approve3uuid = uuidv4()
      const adduuid = uuidv4()
      const stakeuuid = uuidv4()
      const routerAddress = Contracts.solidlyRouter[chainId]
      let isFirstApproved = true
      let isSecondApproved = true
      const firstContract = firstAsset.address !== 'BNB' ? getERC20Contract(firstAsset.address, chainId) : null
      const secondContract = secondAsset.address !== 'BNB' ? getERC20Contract(secondAsset.address, chainId) : null
      if (firstAsset.address !== 'BNB') {
        const allowance = await readCall(firstContract, 'allowance', [account, routerAddress], chainId)
        isFirstApproved = fromWei(allowance, firstAsset.decimals).gte(firstAmount)
      }
      if (secondAsset.address !== 'BNB') {
        const allowance = await readCall(secondContract, 'allowance', [account, routerAddress], chainId)
        isSecondApproved = fromWei(allowance, secondAsset.decimals).gte(secondAmount)
      }
      startTxn({
        key,
        title: 'Add Liquidity',
        transactions: {
          ...(!isFirstApproved && {
            [approve1uuid]: {
              desc: `${t('Approve')} ${firstAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `${t('Approve')} ${secondAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [adduuid]: {
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
      if (!isFirstApproved) {
        if (
          !(await writeTxn(key, approve1uuid, firstContract, 'approve', [
            routerAddress,
            toWei(firstAmount, firstAsset.decimals),
          ]))
        ) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (
          !(await writeTxn(key, approve2uuid, secondContract, 'approve', [
            routerAddress,
            toWei(secondAmount, secondAsset.decimals),
          ]))
        ) {
          setPending(false)
          return
        }
      }
      const routerContract = getRouterContract(chainId)
      const sendSlippage = new BigNumber(100).minus(slippage).div(100)
      const sendAmount0 = toWei(firstAmount, firstAsset.decimals).toFixed(0)
      const sendAmount1 = toWei(secondAmount, secondAsset.decimals).toFixed(0)
      const deadlineVal = `${dayjs()
        .add(Number(deadline) * 60, 'second')
        .unix()}`
      let sendAmount0Min = toWei(sendSlippage.times(firstAmount), firstAsset.decimals).toFixed(0)
      let sendAmount1Min = toWei(sendSlippage.times(secondAmount), secondAsset.decimals).toFixed(0)

      const wrappedAddress0 = firstAsset.address === 'BNB' ? WBNB[chainId].address : firstAsset.address
      const wrappedAddress1 = secondAsset.address === 'BNB' ? WBNB[chainId].address : secondAsset.address

      const quoteRes = await readCall(
        routerContract,
        'quoteAddLiquidity',
        [wrappedAddress0, wrappedAddress1, isStable, sendAmount0, sendAmount1],
        chainId,
      )

      if (quoteRes && Array.isArray(quoteRes) && quoteRes.length) {
        sendAmount0Min = sendSlippage.times(quoteRes[0]).toFixed(0)
        sendAmount1Min = sendSlippage.times(quoteRes[1]).toFixed(0)
      }

      let func = 'addLiquidity'
      let params = [
        firstAsset.address,
        secondAsset.address,
        isStable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        account,
        deadlineVal,
      ]
      let sendValue = '0'

      if (firstAsset.address === 'BNB') {
        func = 'addLiquidityETH'
        params = [secondAsset.address, isStable, sendAmount1, sendAmount1Min, sendAmount0Min, account, deadlineVal]
        sendValue = sendAmount0
      }
      if (secondAsset.address === 'BNB') {
        func = 'addLiquidityETH'
        params = [firstAsset.address, isStable, sendAmount0, sendAmount0Min, sendAmount1Min, account, deadlineVal]
        sendValue = sendAmount1
      }
      if (!(await writeTxn(key, adduuid, routerContract, func, params, sendValue))) {
        setPending(false)
        return
      }
      const lpContract = getERC20Contract(pair.address, chainId)
      const allowance = await readCall(lpContract, 'allowance', [account, pair.gauge.address], chainId)
      const lpBalance = await readCall(lpContract, 'balanceOf', [account], chainId)
      const isLpApproved = fromWei(allowance).gte(lpBalance)

      if (!isLpApproved) {
        if (!(await writeTxn(key, approve3uuid, lpContract, 'approve', [pair.gauge.address, maxUint256]))) {
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

      const gaugeContract = getGaugeContract(pair.gauge.address, chainId)
      if (!(await writeTxn(key, stakeuuid, gaugeContract, 'deposit', [lpBalance]))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Liquidity add & stake successful',
      })

      const poolAddress = await readCall(
        routerContract,
        'pairFor',
        [wrappedAddress0, wrappedAddress1, isStable],
        chainId,
      )
      callback(poolAddress?.toLowerCase())
      setPending(false)
    },
    [account, chainId, startTxn, writeTxn, endTxn, updateTxn, t],
  )

  return { onV1AddAndStake, pending }
}

export const useClaimFees = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onClaimFees = useCallback(
    async pair => {
      const key = uuidv4()
      const claimuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: 'Claim Fees',
        transactions: {
          [claimuuid]: {
            desc: t('Claim Fees'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const pairContract = getPairContract(pair.address, chainId)
      if (!(await writeTxn(key, claimuuid, pairContract, 'claimFees', []))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Claim Successful',
      })
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onClaimFees, pending }
}

export const useV1Remove = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onV1Remove = useCallback(
    async (pair, withdrawAmount, deadline, firstAmount, secondAmount, slippage, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const removeuuid = uuidv4()
      const claimuuid = uuidv4()
      const routerAddress = Contracts.solidlyRouter[chainId]
      const lpContract = getERC20Contract(pair.address, chainId)
      const allowance = await readCall(lpContract, 'allowance', [account, routerAddress], chainId)
      const isApproved = fromWei(allowance).gte(withdrawAmount)
      const shouldClaim =
        (pair.account.token0claimable.gt(0) || pair.account.token1claimable.gt(0)) &&
        pair.account.walletBalance.eq(withdrawAmount)
      startTxn({
        key,
        title: shouldClaim ? 'Remove and Claim' : t('Remove Liquidity'),
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `${t('Approve')} LP`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [removeuuid]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
          ...(shouldClaim && {
            [claimuuid]: {
              desc: t('Claim Fees'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
        },
      })

      setPending(true)
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, lpContract, 'approve', [routerAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const routerContract = getRouterContract(chainId)
      const sendSlippage = new BigNumber(100).minus(slippage).div(100)
      const sendAmount = toWei(withdrawAmount, pair.decimals).toFixed(0)
      let sendAmount0Min = toWei(firstAmount, pair.token0.decimals).times(sendSlippage).toFixed(0)
      let sendAmount1Min = toWei(secondAmount, pair.token1.decimals).times(sendSlippage).toFixed(0)
      const deadlineVal = `${dayjs()
        .add(Number(deadline) * 60, 'second')
        .unix()}`

      const quoteRes = await readCall(
        routerContract,
        'quoteRemoveLiquidity',
        [
          pair.token0.address === 'BNB' ? WBNB[chainId].address : pair.token0.address,
          pair.token1.address === 'BNB' ? WBNB[chainId].address : pair.token1.address,
          pair.stable,
          sendAmount,
        ],
        chainId,
      )

      if (quoteRes && Array.isArray(quoteRes) && quoteRes.length) {
        sendAmount0Min = sendSlippage.times(quoteRes[0]).toFixed(0)
        sendAmount1Min = sendSlippage.times(quoteRes[1]).toFixed(0)
      }

      let func = 'removeLiquidity'
      let params = [
        pair.token0.address,
        pair.token1.address,
        pair.stable,
        sendAmount,
        sendAmount0Min,
        sendAmount1Min,
        account,
        deadlineVal,
      ]

      if (pair.token0.address.toLowerCase() === WBNB[chainId].address.toLowerCase()) {
        func = TAX_ASSETS[chainId].includes(pair.token1.address.toLowerCase())
          ? 'removeLiquidityETHSupportingFeeOnTransferTokens'
          : 'removeLiquidityETH'
        params = [pair.token1.address, pair.stable, sendAmount, sendAmount1Min, sendAmount0Min, account, deadlineVal]
      }
      if (pair.token1.address.toLowerCase() === WBNB[chainId].address.toLowerCase()) {
        func = TAX_ASSETS[chainId].includes(pair.token0.address.toLowerCase())
          ? 'removeLiquidityETHSupportingFeeOnTransferTokens'
          : 'removeLiquidityETH'
        params = [pair.token0.address, pair.stable, sendAmount, sendAmount0Min, sendAmount1Min, account, deadlineVal]
      }
      if (!(await writeTxn(key, removeuuid, routerContract, func, params))) {
        setPending(false)
        return
      }

      if (shouldClaim) {
        const pairContract = getPairContract(pair.address, chainId)
        if (!(await writeTxn(key, claimuuid, pairContract, 'claimFees', []))) {
          setPending(false)
          return
        }
      }

      endTxn({
        key,
        final: 'Liquidity Remove Successful',
      })
      callback()
      setPending(false)
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onV1Remove, pending }
}

export const useV1Migrate = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()

  const migrateV1 = useCallback(
    async ({ positionV2, strategy, callback }) => {
      if (!positionV2 || !strategy) return

      const key = uuidv4()
      const unstakeId = uuidv4()
      const approveId = uuidv4()
      const stakeId = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: 'Migrate',
        transactions: {
          [unstakeId]: {
            desc: t('Unstake and Harvest'),
            status: TXN_STATUS.START,
            hash: null,
          },
          [approveId]: {
            desc: `${t('Approve')} LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
          [stakeId]: {
            desc: t('Stake LP'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      const gaugeContractV2 = getGaugeContract(positionV2.gauge.address, chainId)
      if (!(await writeTxn(key, unstakeId, gaugeContractV2, 'withdrawAllAndHarvest', []))) {
        setPending(false)
        return
      }

      const lpContract = getERC20Contract(positionV2.address, chainId)
      const allowance = await readCall(lpContract, 'allowance', [account, positionV2.gauge.address], chainId)
      const balanceOf = await readCall(lpContract, 'balanceOf', [account], chainId)
      const isApproved = fromWei(allowance).gte(balanceOf)

      setPending(true)
      if (!isApproved) {
        if (!(await writeTxn(key, approveId, lpContract, 'approve', [strategy.gauge.address, maxUint256]))) {
          setPending(false)
          return
        }
      } else {
        updateTxn({ key, uuid: approveId, status: TXN_STATUS.SUCCESS })
      }

      setPending(true)
      const gaugeContractV3 = getGaugeContract(strategy.gauge.address, chainId)
      if (!(await writeTxn(key, stakeId, gaugeContractV3, 'deposit', [balanceOf]))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Migrate Successful' })
      setPending(false)
      callback()
    },
    [startTxn, t, chainId, writeTxn, account, endTxn, updateTxn],
  )

  return { migrateV1, pending }
}

export const useV1Stake = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()

  const onV1Stake = useCallback(
    async (pool, amount, callback) => {
      const key = uuidv4()
      const approveId = uuidv4()
      const stakeId = uuidv4()

      startTxn({
        key,
        title: 'Stake',
        transactions: {
          [approveId]: {
            desc: `${t('Approve')} LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
          [stakeId]: {
            desc: t('Stake LP'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      const lpContract = getERC20Contract(pool.address, chainId)
      const allowance = await readCall(lpContract, 'allowance', [account, pool.gauge.address], chainId)
      const isApproved = fromWei(allowance).gte(amount)

      if (!isApproved) {
        if (!(await writeTxn(key, approveId, lpContract, 'approve', [pool.gauge.address, maxUint256]))) {
          setPending(false)
          return
        }
      } else {
        updateTxn({ key, uuid: approveId, status: TXN_STATUS.SUCCESS })
      }

      const depositAmount = toWei(amount).dp(0).toString(10)
      setPending(true)
      const gaugeContractV3 = getGaugeContract(pool.gauge.address, chainId)
      if (!(await writeTxn(key, stakeId, gaugeContractV3, 'deposit', [depositAmount]))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Staked' })
      setPending(false)
      callback()
    },
    [startTxn, t, chainId, writeTxn, account, endTxn, updateTxn],
  )

  return { onV1Stake, pending }
}
