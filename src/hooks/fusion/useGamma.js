import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { GAMMA_TYPES, TXN_STATUS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getGammaClearingContract,
  getGammaHyperVisorContract,
  getGammaUNIProxyContract,
  getGaugeContract,
  getMultiFeeDistributionContract,
  getWBNBContract,
} from '@/lib/contracts'
import { successToast, warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'
import { useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

export const useGammaAdd = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onGammaAdd = useCallback(
    async (amountA, amountB, amountToWrap, gammaPair) => {
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped ? baseCurrency.wrapped.address.toLowerCase() : ''
      const quoteCurrencyAddress = quoteCurrency.wrapped ? quoteCurrency.wrapped.address.toLowerCase() : ''
      const gammaPairAddress = gammaPair?.address

      if (!amountA || !amountB || !gammaPairAddress) return
      const gammaUNIProxyContract = getGammaUNIProxyContract(networkId)
      const clearingAddress = await readCall(gammaUNIProxyContract, 'clearance', [], networkId)
      const clearingContract = getGammaClearingContract(clearingAddress, networkId)
      const positionsResp = await readCall(clearingContract, 'positions', [gammaPairAddress], networkId)
      const deposit0MaxRes = positionsResp?.[8] || 0n
      const deposit1MaxRes = positionsResp?.[9] || 0n
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

      const firstParam = (
        baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountA : amountB
      ).numerator.toString()
      const secondParam = (
        baseCurrencyAddress === gammaPair.token0.address.toLowerCase() ? amountB : amountA
      ).numerator.toString()

      const firstParamNumber = Number(firstParam)
      const secondParamNumber = Number(secondParam)
      const deposit0MaxNumber = new BigNumber(deposit0MaxRes).toNumber()
      const deposit1MaxNumber = new BigNumber(deposit1MaxRes).toNumber()

      const checkMaxA = Math.ceil(firstParamNumber / deposit0MaxNumber)
      const checkMaxB = Math.ceil(secondParamNumber / deposit1MaxNumber)

      const checkMax = Math.max(checkMaxA, checkMaxB)

      let transactions = {
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
      }

      const supplyuuidList = []
      if (checkMax > 1) {
        for (let i = 0; i < checkMax; i++) {
          const uuidI = uuidv4()
          supplyuuidList.push(uuidI)
          transactions = {
            ...transactions,
            [uuidI]: {
              desc: t('Add Liquidity'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }
        }
      } else {
        transactions = {
          ...transactions,
          [supplyuuid]: {
            desc: t('Add Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        }
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

      if (checkMax > 1) {
        successToast(`Your request is above Gamma max deposit. Your deposit is split in ${checkMax} transactions`)
        for (let i = 1; i < checkMax + 1; i++) {
          const firstParamI =
            firstParamNumber > deposit0MaxNumber * i
              ? deposit0MaxNumber
              : firstParamNumber - deposit0MaxNumber * (i - 1)
          const secondParamI =
            secondParamNumber > deposit1MaxNumber * i
              ? deposit1MaxNumber
              : secondParamNumber - deposit1MaxNumber * (i - 1)

          if (
            !(await writeTxn(key, supplyuuidList[i - 1], gammaUNIProxyContract, 'deposit', [
              firstParamI > 0 ? firstParamI : '0',
              secondParamI > 0 ? secondParamI : '0',
              account,
              gammaPairAddress,
              [0, 0, 0, 0],
            ]))
          ) {
            setPending(false)
            return
          }
        }
      } else if (
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
    [account, startTxn, writeTxn, endTxn, networkId, onFieldAInput, onFieldBInput, t],
  )

  return { onGammaAdd, pending }
}

export const useGammaAddAndStake = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()
  const t = useTranslations()

  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers()

  const onGammaAddAndStake = useCallback(
    async (amountA, amountB, amountToWrap, gammaPair, version = 3) => {
      const baseCurrency = amountA.currency
      const quoteCurrency = amountB.currency
      const baseCurrencyAddress = baseCurrency.wrapped ? baseCurrency.wrapped.address.toLowerCase() : ''
      const quoteCurrencyAddress = quoteCurrency.wrapped ? quoteCurrency.wrapped.address.toLowerCase() : ''
      const gammaPairAddress = gammaPair?.address

      if (!amountA || !amountB || !gammaPairAddress) return
      const gammaUNIProxyContract = getGammaUNIProxyContract(networkId, version)

      if (version === 2) {
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

      if (version === 2) {
        transactions[approve3uuid] = {
          desc: `${t('Approve')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }

        transactions[stakeuuid] = {
          desc: `${t('Stake')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }
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

      if (
        !(await writeTxn(key, supplyuuid, gammaUNIProxyContract, version === 3 ? 'depositAndStake' : 'deposit', [
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

      // MARK: It will be automatically farming after you deposit into that pool (Gamma farming v3)
      if (version === 2) {
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
      }

      onFieldAInput('')
      onFieldBInput('')
      endTxn({
        key,
        final: 'Liquidity Added And Staked',
      })
      setPending(false)
    },
    [account, endTxn, networkId, onFieldAInput, onFieldBInput, startTxn, t, updateTxn, writeTxn],
  )

  return { onGammaAddAndStake, pending }
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

export const useGammaData = pool => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const [rewardsData, setRewardsData] = useState([])

  const getClaimableRewards = useCallback(async () => {
    if (pool.version === 3 && GAMMA_TYPES.includes(pool.title)) {
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
  }, [account, assets, chainId, pool.address, pool.title, pool.version])

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
  const { startTxn, endTxn, writeTxn } = useTxn()

  const migrateGamma = useCallback(
    async ({ pool, callback }) => {
      const isStaked = pool.account.gaugeBalance > 0
      const amount = pool.account.totalLp

      const key = uuidv4()

      const unstakedId = uuidv4()
      const removeId = uuidv4()
      // const swapId = uuidv4()
      const approve1uuid = uuidv4()
      const approve2uuid = uuidv4()
      const depositId = uuidv4()

      const gammaPairAddress = pool.address
      const { token0, token1 } = pool
      const firstContract = getERC20Contract(token0.address, networkId)
      const secondContract = getERC20Contract(token1.address, networkId)
      const baseAllowance = await readCall(firstContract, 'allowance', [account, gammaPairAddress], networkId)
      const isFirstApproved = fromWei(baseAllowance, token0.decimals).gte(amount.toExact())
      const quoteAllowance = await readCall(secondContract, 'allowance', [account, gammaPairAddress], networkId)
      const isSecondApproved = fromWei(quoteAllowance, token1.decimals).gte(amount.toExact())

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

      if (!isFirstApproved) {
        transactions[approve1uuid] = {
          desc: `${t('Approve')} ${token0.symbol}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      if (!isSecondApproved) {
        transactions[approve2uuid] = {
          desc: `${t('Approve')} ${token1.symbol}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      startTxn({ key, title: t('Migration'), transactions })
      setPending(true)
      const gammaV2 = getGammaHyperVisorContract(pool.address, networkId, 2)
      const gammaV3 = getGammaHyperVisorContract(pool.address, networkId, 3)

      if (isStaked) {
        const gaugeContract = getGaugeContract(pool.gauge.address, networkId)
        if (!(await writeTxn(key, unstakedId, gaugeContract, 'withdrawAllAndHarvest', []))) {
          setPending(false)
          return
        }
      }

      const txHash = await writeTxn(key, removeId, gammaV2, 'withdraw', [
        toWei(amount).toFixed(0),
        account,
        account,
        [0, 0, 0, 0],
      ])
      if (!txHash) {
        setPending(false)
        return
      }

      // TODO: swap

      // TODO: add liquidity
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

      const amountA = '0'
      const amountB = '0'

      if (
        !(await writeTxn(key, depositId, gammaV3, 'deposit', [
          amountA,
          amountB,
          account,
          gammaPairAddress,
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
    [t, startTxn, networkId, writeTxn, account, endTxn],
  )

  return { migrateGamma, pending }
}
