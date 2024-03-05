import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TAX_ASSETS, TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getGaugeContract, getPairContract, getRouterContract } from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useV1Add = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onV1Add = useCallback(
    async (firstAsset, secondAsset, firstAmount, secondAmount, isStable, slippage, deadline, callback) => {
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
              desc: `Approve ${firstAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `Approve ${secondAsset.symbol}`,
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
      const sendAmount0Min = toWei(sendSlippage.times(firstAmount), firstAsset.decimals).toFixed(0)
      const sendAmount1Min = toWei(sendSlippage.times(secondAmount), secondAsset.decimals).toFixed(0)

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
      callback()
      setPending(false)
    },
    [account, chainId, startTxn, writeTxn, endTxn],
  )

  return { onV1Add, pending }
}

export const useV1AddAndStake = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()

  const onV1AddAndStake = useCallback(
    async (pair, firstAsset, secondAsset, firstAmount, secondAmount, isStable, slippage, deadline, callback) => {
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
              desc: `Approve ${firstAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isSecondApproved && {
            [approve2uuid]: {
              desc: `Approve ${secondAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [adduuid]: {
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
      const sendAmount0Min = toWei(sendSlippage.times(firstAmount), firstAsset.decimals).toFixed(0)
      const sendAmount1Min = toWei(sendSlippage.times(secondAmount), secondAsset.decimals).toFixed(0)

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
      callback()
      setPending(false)
    },
    [account, chainId, startTxn, writeTxn, endTxn, updateTxn],
  )

  return { onV1AddAndStake, pending }
}

export const useClaimFees = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onClaimFees = useCallback(
    async pair => {
      const key = uuidv4()
      const claimuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: 'Claim fees',
        transactions: {
          [claimuuid]: {
            desc: `Claim fees for ${pair.symbol}`,
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
    [chainId, startTxn, writeTxn, endTxn],
  )

  return { onClaimFees, pending }
}

export const useV1Remove = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onV1Remove = useCallback(
    async (pair, withdrawAmount, slippage, deadline, firstAmount, secondAmount, callback) => {
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
        title: shouldClaim ? 'Remove and Claim' : 'Remove position',
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: 'Approve LP',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [removeuuid]: {
            desc: 'Remove Liquidity',
            status: TXN_STATUS.START,
            hash: null,
          },
          ...(shouldClaim && {
            [claimuuid]: {
              desc: 'Claim fees',
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
      const sendAmount0Min = toWei(firstAmount, pair.token0.decimals).times(sendSlippage).toFixed(0)
      const sendAmount1Min = toWei(secondAmount, pair.token1.decimals).times(sendSlippage).toFixed(0)
      const deadlineVal = `${dayjs()
        .add(Number(deadline) * 60, 'second')
        .unix()}`

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
    [account, chainId, startTxn, writeTxn, endTxn],
  )

  return { onV1Remove, pending }
}
