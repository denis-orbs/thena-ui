import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { decodeEventLog, erc20Abi, maxUint256 } from 'viem'

import { GAMMA_TYPES, HASH, TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { readCall, waitCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getGammaHyperVisorContract,
  getGammaUNIProxyContract,
  getGaugeContract,
  getMultiFeeDistributionContract,
  getWBNBContract,
} from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import { useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

import { fetchOdosQuote, simulateOdosSwap } from '../useSwap'

export const useAddGamma = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const handleAddGamma = useCallback(
    async (amountA, amountB, amountToWrap, gammaPair) => {
      console.log(gammaPair)
      const isFarming = gammaPair?.isFarming
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped ? baseCurrency.wrapped.address.toLowerCase() : ''
      const quoteCurrencyAddress = quoteCurrency.wrapped ? quoteCurrency.wrapped.address.toLowerCase() : ''
      const gammaPairAddress = gammaPair?.address

      if (!amountA || !amountB || !gammaPairAddress) return
      const gammaUNIProxyContract = getGammaUNIProxyContract({ chainId: networkId, version: 3, isFarming })

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

      const transactions = {}
      if (amountToWrap) {
        transactions[wrapuuid] = {
          desc: t('Wrap'),
          status: TXN_STATUS.START,
          hash: null,
        }
      }
      if (!isFirstApproved) {
        transactions[approve1uuid] = {
          desc: `${t('Approve')} ${baseCurrency.symbol}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }
      if (!isSecondApproved) {
        transactions[approve2uuid] = {
          desc: `${t('Approve')} ${quoteCurrency.symbol}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[supplyuuid] = {
        desc: t('Add Liquidity'),
        status: TXN_STATUS.START,
        hash: null,
      }

      startTxn({ key, title: t('Add Liquidity'), transactions })

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

      setPending(false)
      if (
        !(await writeTxn(key, supplyuuid, gammaUNIProxyContract, isFarming ? 'depositAndStake' : 'deposit', [
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
        final: 'Liquidity Added And Staked',
      })
      setPending(false)
    },
    [account, endTxn, networkId, onFieldAInput, onFieldBInput, startTxn, t, writeTxn],
  )

  return { handleAddGamma, pending }
}

export const useGammaRemove = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onGammaRemove = useCallback(
    async (pool, amount, version, callback) => {
      const key = uuidv4()
      const removeuuid = uuidv4()
      const unstakeuuid = uuidv4()
      startTxn({
        key,
        title: 'Remove Liquidity',
        transactions: {
          ...(version === 3 && {
            [unstakeuuid]: {
              desc: t('Unstake'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [removeuuid]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const gammaUNIProxyContract = getGammaHyperVisorContract(pool.address, networkId, version)

      if (version === 3) {
        const receiver = await readCall(gammaUNIProxyContract, 'receiver', [], networkId)
        const multiFeeDistributionContract = getMultiFeeDistributionContract(receiver, networkId)
        if (!(await writeTxn(key, unstakeuuid, multiFeeDistributionContract, 'unstake', [toWei(amount).toFixed(0)]))) {
          setPending(false)
          return
        }
      }

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
    [account, startTxn, writeTxn, endTxn, networkId, onFieldAInput, onFieldBInput, t],
  )

  return { onGammaRemove, pending }
}

export const useGammaClaim = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onGammaClaim = useCallback(
    async (pool, callback) => {
      const key = uuidv4()
      const claimId = uuidv4()
      startTxn({
        key,
        title: t('Harvest Rewards'),
        transactions: {
          [claimId]: {
            desc: t('Harvest Rewards'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const gammaFarming = getGammaHyperVisorContract(pool.address, networkId, pool.account?.version)
      const receiver = await readCall(gammaFarming, 'receiver', [], networkId)
      const multiFeeDistributionContract = getMultiFeeDistributionContract(receiver, networkId)

      if (!(await writeTxn(key, claimId, multiFeeDistributionContract, 'getAllRewards', []))) {
        setPending(false)
        return
      }
      callback()
      endTxn({ key, final: 'Harvest Successful' })
      setPending(false)
    },
    [startTxn, writeTxn, endTxn, networkId, t],
  )

  return { onGammaClaim, pending }
}

export const useGetGammaReward = pool => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const [rewardsData, setRewardsData] = useState([])

  const getClaimableRewards = useCallback(async () => {
    if (pool.version === 3 && GAMMA_TYPES.includes(pool.title) && pool.title.includes('Farming')) {
      const gammaUNIProxyContract = getGammaHyperVisorContract(pool.address, chainId, 3)
      const receiver = await readCall(gammaUNIProxyContract, 'receiver', [], chainId)
      const multiFeeDistributionContract = getMultiFeeDistributionContract(receiver, chainId)
      const [tokens, amounts] = await readCall(multiFeeDistributionContract, 'claimableRewards', [account])
      let totalUsd = 0
      const rewards = tokens.map((token, index) => {
        const asset = assets.find(item => item.address.toLowerCase() === token.toLowerCase())
        totalUsd += asset.price * fromWei(amounts[index]).toNumber()
        return {
          asset: asset || { address: token, name: 'Unknown' },
          amount: fromWei(amounts[index]),
        }
      })
      setRewardsData({ totalUsd, rewards })
    }
  }, [account, assets, chainId, pool])

  useEffect(() => {
    getClaimableRewards()
  }, [getClaimableRewards])

  return { rewardsData }
}

export const useGammaMigration = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { networkId } = useChainSettings()
  const { account } = useWallet()
  const { startTxn, endTxn, writeTxn, sendTxn, updateTxn } = useTxn()

  const migrateGamma = useCallback(
    async ({ positionV2, strategy, callback }) => {
      const isStaked = positionV2.account.gaugeBalance > 0
      const amount = positionV2.account.totalLp

      const { address: gammaAddressV2, token0, token1 } = positionV2
      const { address: gammaAddressV3, isFarming } = strategy

      const key = uuidv4()
      const unstakedId = uuidv4()
      const removeId = uuidv4()
      const approveSwapId = uuidv4()
      const swapId = uuidv4()
      const approve1Id = uuidv4()
      const approve2Id = uuidv4()
      const depositId = uuidv4()

      const gammaV2 = getGammaHyperVisorContract(gammaAddressV2, networkId, 2)
      const firstContract = getERC20Contract(token0.address, networkId)
      const secondContract = getERC20Contract(token1.address, networkId)

      const transactions = {}

      if (isStaked) {
        transactions[unstakedId] = {
          desc: `${t('Unstake')} V2`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[removeId] = {
        desc: `${t('Remove Liquidity')} V2`,
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[approveSwapId] = {
        desc: `${t('Approve')}`,
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[swapId] = {
        desc: t('Re-balance'),
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[approve1Id] = {
        desc: `${t('Approve')} ${token0.symbol}`,
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[approve2Id] = {
        desc: `${t('Approve')} ${token1.symbol}`,
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[depositId] = {
        desc: 'Deposit Liquidity to V3',
        status: TXN_STATUS.START,
        hash: null,
      }

      startTxn({ key, title: t('Migration'), transactions })
      setPending(true)

      // TODO: UNSTAKE AND WITHDRAW V2
      if (isStaked) {
        const gaugeContract = getGaugeContract(positionV2.gauge.address, networkId)
        if (!(await writeTxn(key, unstakedId, gaugeContract, 'withdrawAllAndHarvest', []))) {
          setPending(false)
          return
        }
      }

      setPending(true)
      const withdrawTx = await writeTxn(key, removeId, gammaV2, 'withdraw', [
        toWei(amount).toFixed(0),
        account,
        account,
        [0, 0, 0, 0],
      ])
      if (!withdrawTx) {
        setPending(false)
        return
      }

      const withdrawReceipt = await waitCall(withdrawTx)
      const events = withdrawReceipt.logs
      const transferEvent = events.filter(e => e.topics[0] === HASH.TRANSFER)
      const transferAmounts = transferEvent.reduce((acc, o) => {
        const decodeData = decodeEventLog({
          abi: erc20Abi,
          data: o.data,
          topics: o.topics,
        })
        const address = o.address.toLowerCase()
        if (!acc[address]) {
          acc[address] = BigNumber(0)
        }
        const { to = '' } = decodeData.args
        if (to.toLowerCase() === account.toLowerCase()) {
          acc[address] = acc[address].plus(BigNumber(decodeData.args.value.toString()))
        }

        return acc
      }, {})

      // MARK: RE-BALANCE
      setPending(true)
      const gammaUNIProxyContract = getGammaUNIProxyContract({ chainId: networkId, version: 3, isFarming: true })
      const rangeAmountOfToken1 = await readCall(
        gammaUNIProxyContract,
        'getDepositAmount',
        [gammaAddressV3, token0.address, transferAmounts[token0.address]],
        networkId,
      )

      const [min, max] = rangeAmountOfToken1
      const targetToken1 = BigNumber(min).plus(max).div(2)

      let swapFromAmount = BigNumber(0)
      let fromToken = null
      let toToken = null
      if (transferAmounts[token1.address].lt(min)) {
        console.log('Token 1 is insufficient')
        console.log('swap token 0 to token1')

        fromToken = token0
        toToken = token1
        const priceRatio = BigNumber(token0.price).div(token1.price)
        const swapToAmount = BigNumber(targetToken1).minus(transferAmounts[token1.address])
        swapFromAmount = swapToAmount.div(priceRatio).dp(0)
      } else if (transferAmounts[token1.address].gt(max)) {
        console.log('Token 1 is excess')
        console.log('swap token 1 to token 0')
        fromToken = token1
        toToken = token0
        const priceRatio = BigNumber(token1.price).div(token0.price)
        const swapToAmount = BigNumber(transferAmounts[token1.address]).minus(targetToken1)
        swapFromAmount = swapToAmount.div(priceRatio).dp(0)
      }

      const swapAmount = {
        [fromToken.address]: BigNumber(-swapFromAmount), // have to negative number
        [toToken.address]: BigNumber(0),
      }
      if (swapFromAmount.gt(0) && fromToken && toToken) {
        const routerAddress = Contracts.odos[networkId]
        // MARK: APPROVE + SWAP BY ODOS
        const swapTokenContract = getERC20Contract(fromToken.address, networkId)
        const allowanceSwap = await readCall(swapTokenContract, 'allowance', [account, routerAddress], networkId)
        const isApprovedSwap = fromWei(allowanceSwap, fromToken.decimals).gte(swapFromAmount)
        if (isApprovedSwap) {
          updateTxn({ key, uuid: approveSwapId, status: TXN_STATUS.SUCCESS, hash: '' })
          setPending(false)
        } else {
          const tx = await writeTxn(key, approveSwapId, swapTokenContract, 'approve', [routerAddress, maxUint256])
          if (!tx) {
            setPending(false)
            return
          }
        }

        const quote = await fetchOdosQuote({
          inputAmount: swapFromAmount.toString(),
          inputToken: fromToken.address,
          outputToken: toToken.address,
          networkId,
          account,
          slippage: 0.5,
        })

        const { to, data, value } = await simulateOdosSwap(account, quote.pathId, () => {
          setPending(false)
        })
        const swapTx = await sendTxn(key, swapId, to, data, value)
        if (!swapTx) {
          setPending(false)
          return
        }

        const swapReceipt = await waitCall(swapTx)
        const swapEvent = swapReceipt.logs.filter(
          e => e.topics[0] === HASH.TRANSFER && e.address.toLowerCase() === fromToken.address.toLowerCase(),
        )
        const swapedAmount = swapEvent.reduce((sum, e) => {
          const decodeData = decodeEventLog({
            abi: erc20Abi,
            data: e.data,
            topics: e.topics,
          })
          sum += decodeData.args.value
          return sum
        }, 0n)

        swapAmount[toToken.address] = BigNumber(swapedAmount)
      } else {
        updateTxn({ key, uuid: approveSwapId, status: TXN_STATUS.SUCCESS, hash: '' })
        updateTxn({ key, uuid: swapId, status: TXN_STATUS.SUCCESS, hash: '' })
        setPending(false)
      }

      const amountA = transferAmounts[token0.address].plus(swapAmount[token0.address])
      const amountB = transferAmounts[token1.address].plus(swapAmount[token1.address])

      setPending(true)
      const baseAllowance = await readCall(firstContract, 'allowance', [account, gammaAddressV3], networkId)
      const isFirstApproved = fromWei(baseAllowance, token0.decimals).gte(amountA)
      if (!isFirstApproved) {
        updateTxn({ key, uuid: approve1Id, status: TXN_STATUS.SUCCESS, hash: '' })
      } else if (!(await writeTxn(key, approve1Id, firstContract, 'approve', [gammaAddressV3, maxUint256]))) {
        setPending(false)
        return
      }

      setPending(true)
      const quoteAllowance = await readCall(secondContract, 'allowance', [account, gammaAddressV3], networkId)
      const isSecondApproved = fromWei(quoteAllowance, token1.decimals).gte(amountB)
      if (isSecondApproved) {
        updateTxn({ key, uuid: approve2Id, status: TXN_STATUS.SUCCESS, hash: '' })
      } else if (!(await writeTxn(key, approve2Id, secondContract, 'approve', [gammaAddressV3, maxUint256]))) {
        setPending(false)
        return
      }

      setPending(true)
      if (
        !(await writeTxn(key, depositId, gammaUNIProxyContract, isFarming ? 'depositAndStake' : 'deposit', [
          amountA,
          amountB,
          account,
          gammaAddressV3,
          [0, 0, 0, 0],
        ]))
      ) {
        setPending(false)
        return
      }

      callback()
      endTxn({ key, final: 'Migration Successful' })
      setPending(false)
    },
    [networkId, account, t, startTxn, writeTxn, endTxn, sendTxn, updateTxn],
  )

  return { migrateGamma, pending }
}

export const useGammaWithdraw = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { networkId } = useChainSettings()
  const { account } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const withdrawGamma = useCallback(
    async ({ positionV2, callback }) => {
      if (!positionV2) return

      const isStaked = positionV2.account.gaugeBalance > 0
      const amount = positionV2.account.totalLp

      const { address: gammaAddressV2 } = positionV2

      const key = uuidv4()
      const unstakedId = uuidv4()
      const removeId = uuidv4()

      const gammaV2 = getGammaHyperVisorContract(gammaAddressV2, networkId, 2)

      const transactions = {}

      if (isStaked) {
        transactions[unstakedId] = {
          desc: t('Unstake'),
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[removeId] = {
        desc: t('Remove Liquidity'),
        status: TXN_STATUS.START,
        hash: null,
      }

      startTxn({ key, title: 'Withdraw', transactions })
      setPending(true)

      if (isStaked) {
        const gaugeContract = getGaugeContract(positionV2.gauge.address, networkId)
        if (!(await writeTxn(key, unstakedId, gaugeContract, 'withdrawAllAndHarvest', []))) {
          setPending(false)
          return
        }
      }

      setPending(true)
      const withdrawTx = await writeTxn(key, removeId, gammaV2, 'withdraw', [
        toWei(amount).toFixed(0),
        account,
        account,
        [0, 0, 0, 0],
      ])
      if (!withdrawTx) {
        setPending(false)
        return
      }

      callback()
      endTxn({ key, final: 'Withdraw Successfully' })
      setPending(false)
    },
    [networkId, account, t, startTxn, writeTxn, endTxn],
  )

  return { withdrawGamma, pending }
}

export const useStakeGamma = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { networkId } = useChainSettings()
  const { account } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const stakeGamma = useCallback(
    async ({ position, callback }) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const stakeuuid = uuidv4()
      const lpContract = getERC20Contract(position.address, networkId)

      setPending(true)
      const gammaUNIProxyContract = getGammaHyperVisorContract(position.address, networkId, 3)
      const receiver = await readCall(gammaUNIProxyContract, 'receiver', [], networkId)
      const multiFeeDistributionContract = getMultiFeeDistributionContract(receiver, networkId)

      const amount = toWei(position?.account?.walletBalance ?? 0, 18)
      const allowance = await readCall(lpContract, 'allowance', [account, receiver], networkId)
      const isApproved = amount.lte(allowance)

      startTxn({
        key,
        title: 'Stake',
        desc: `${t('Stake')} LP`,
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `${t('Approve')} LP`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [stakeuuid]: {
            desc: `${t('Stake')} ${position.symbol} LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, lpContract, 'approve', [receiver, amount]))) {
          setPending(false)
          return
        }
      }

      if (!(await writeTxn(key, stakeuuid, multiFeeDistributionContract, 'stake', [amount, account]))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Stake Successful' })
      setPending(false)
      callback()
    },
    [networkId, account, t, startTxn, writeTxn, endTxn],
  )

  return { stakeGamma, pending }
}
