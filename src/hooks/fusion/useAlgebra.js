import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useMemo, useState } from 'react'
import { JSBI, Percent } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { encodeFunctionData, maxUint256, parseUnits } from 'viem'
import { useSimulateContract } from 'wagmi'

import { FusionNPMABI } from '@/abis/fusion/FusionNPMABI'
import { IntegralNPMABI } from '@/abis/integral/IntegralNPMABI'
import { PluginFactoryABI } from '@/abis/integral/PluginFactoryABI'
import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import useWallet from '@/hooks/useWallet'
import { readCall, waitCall } from '@/lib/contractActions'
import { getERC20Contract, getFarmingCenterContract, getIncentiveContract } from '@/lib/contracts'
import { NonfungiblePositionManager } from '@/lib/fusion/entities/nonfungiblePositionManager'
import { errorToast } from '@/lib/notify'
import { useFarmRewards } from '@/state/farmReward/store'
import { useV3MintState } from '@/state/fusion/hooks'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'
import { fromWei, toWei } from '@/utils/utils'

const getNPMContract = (chainId, version) => ({
  abi: version === 3 ? IntegralNPMABI : FusionNPMABI,
  address: version === 3 ? Contracts.NPMIntegral[chainId] : Contracts.NPMFusion[chainId],
})

export function collectAndClaimRewards({ positions, chainId, account }) {
  const farmingCenter = getFarmingCenterContract(chainId)

  const calldata = []
  for (const item of positions) {
    const collectData = encodeFunctionData({
      abi: farmingCenter.abi,
      functionName: 'collectRewards',
      args: [item.poolKey, item.tokenId],
    })
    calldata.push(collectData)
  }

  const claimRewardData = encodeFunctionData({
    abi: farmingCenter.abi,
    functionName: 'claimReward',
    args: [Contracts.THE[chainId], account, maxUint256],
  })
  calldata.push(claimRewardData)

  return calldata
}

export const useAlgebraAdd = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, writeTxn, endTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const { strategy } = useV3MintState()
  const version = strategy?.version ?? 3
  const isFarming = strategy?.isFarming ?? false

  const onAlgebraAdd = useCallback(
    async ({ amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline }, callback) => {
      try {
        const key = uuidv4()
        const approve1uuid = uuidv4()
        const approve2uuid = uuidv4()
        const createPoolId = uuidv4()
        const addLiquidityId = uuidv4()
        const approveNft = uuidv4()
        const stakeId = uuidv4()

        const farmingCenter = getFarmingCenterContract(chainId)
        const incentiveMaker = getIncentiveContract(chainId)
        const positionManger = getNPMContract(chainId, version)

        const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
        const { position, depositADisabled, depositBDisabled, noLiquidity } = mintInfo
        const baseCurrencyAddress = baseCurrency.wrapped?.address.toLowerCase()
        const quoteCurrencyAddress = quoteCurrency.wrapped?.address.toLowerCase()
        let isFirstApproved = true
        let isSecondApproved = true
        const firstContract = !baseCurrency.isNative ? getERC20Contract(baseCurrencyAddress, chainId) : null
        const secondContract = !quoteCurrency.isNative ? getERC20Contract(quoteCurrencyAddress, chainId) : null
        if (!baseCurrency.isNative && !depositADisabled) {
          const allowance = await readCall(firstContract, 'allowance', [account, positionManger.address], chainId)
          isFirstApproved = fromWei(allowance, baseCurrency.decimals).gte(amountA.toExact())
        }
        if (!quoteCurrency.isNative && !depositBDisabled) {
          const allowance = await readCall(secondContract, 'allowance', [account, positionManger.address], chainId)
          isSecondApproved = fromWei(allowance, quoteCurrency.decimals).gte(amountB.toExact())
        }

        const transactions = {}

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

        if (!isFarming && noLiquidity) {
          transactions[createPoolId] = {
            desc: t('Create pool'),
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        transactions[addLiquidityId] = {
          desc: t(isFarming && noLiquidity ? 'Create pool and add liquidity' : 'Add Liquidity'),
          status: TXN_STATUS.START,
          hash: null,
        }

        if (isFarming) {
          transactions[approveNft] = {
            desc: `${t('Approve For Farming')}`,
            status: TXN_STATUS.START,
            hash: null,
          }

          transactions[stakeId] = {
            desc: t('Earn $THE'),
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        startTxn({
          key,
          transactions,
          title: t(noLiquidity ? 'Create pool and add liquidity' : 'Add Liquidity'),
        })
        setPending(true)

        // MARK: APPROVE TOKENS
        if (!isFirstApproved) {
          if (
            !(await writeTxn(key, approve1uuid, firstContract, 'approve', [
              positionManger.address,
              toWei(amountA.toExact(), baseCurrency.decimals),
            ]))
          ) {
            setPending(false)
            return
          }
        }

        if (!isSecondApproved) {
          if (
            !(await writeTxn(key, approve2uuid, secondContract, 'approve', [
              positionManger.address,
              toWei(amountB.toExact(), quoteCurrency.decimals),
            ]))
          ) {
            setPending(false)
            return
          }
        }

        // MARK: CREATE NEW NORMAL POOL (earn 80% fee)
        if (!isFarming && noLiquidity) {
          const txHash = await writeTxn(
            key,
            createPoolId,
            { abi: PluginFactoryABI, address: Contracts.PluginFactory[chainId] },
            'createCustomPoolAndInitialize',
            [position.pool.sqrtRatioX96, position.pool.token0.address, position.pool.token1.address],
          )
          if (!txHash) {
            setPending(false)
            return
          }
        }

        // MARK: ADD LIQUIDITY TO POOL
        const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
        const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

        const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
          slippageTolerance: allowedSlippage,
          recipient: account,
          deadline: timestamp.toString(),
          useNative,
          createPool: noLiquidity && isFarming,
          version,
          isFarming,
          chainId,
        })

        const txHash = await sendTxn(key, addLiquidityId, positionManger.address, calldata, value)
        const addTxRecieve = await waitCall(txHash)
        if (!addTxRecieve) {
          setPending(false)
          return
        }

        if (isFarming) {
          // MARK: APPROVE LP TOKEN FOR FARMING
          const decodeData = NonfungiblePositionManager.getMintedPosition(addTxRecieve, chainId)
          const nftId = decodeData.args?.tokenId
          const poolAddress = decodeData.args?.pool

          if (
            !(await writeTxn(key, approveNft, positionManger, 'approveForFarming', [
              nftId,
              true,
              farmingCenter.address,
            ]))
          ) {
            setPending(false)
            return
          }

          // MARK: STAKE LP TOKEN FOR FARMING
          const poolKey = await readCall(incentiveMaker, 'poolToKey', [poolAddress], chainId)
          if (!(await writeTxn(key, stakeId, farmingCenter, 'enterFarming', [poolKey, nftId]))) {
            setPending(false)
            return
          }
        }

        endTxn({ key, final: 'Liquidity Add Successful' })
        setPending(false)
        if (callback) callback()
      } catch (e) {
        setPending(false)
        throw e
      }
    },
    [chainId, version, isFarming, t, startTxn, account, sendTxn, endTxn, writeTxn],
  )

  return { onAlgebraAdd, pending }
}

export const useSimulateFarmReward = () => {
  const { account, chainId } = useWallet()
  const { rewards: _rewards } = useFarmRewards()
  const { manual } = _rewards
  const farmingCenter = getFarmingCenterContract(chainId)
  // Handle positions array (existing logic)
  const calldata = collectAndClaimRewards({
    positions: Array.from(manual).map(pair => ({
      poolKey: pair[1].args[1],
      tokenId: pair[1].args[2],
    })),
    // positions: [],
    chainId,
    account,
  })

  const { data } = useSimulateContract({
    ...farmingCenter,
    functionName: 'multicall',
    args: [calldata],
    query: {
      enabled: !!account,
    },
  })

  const result = useMemo(() => {
    if (!data?.result) return null

    const { result: results } = data
    let rewardAmount = JSBI.BigInt(0)

    // The last result is always the claimReward call
    const claimRewardResult = results[results.length - 1]
    if (claimRewardResult && claimRewardResult !== '0x') {
      // Decode claimReward result (uint256)
      rewardAmount = JSBI.BigInt(claimRewardResult)
    }

    return fromWei(rewardAmount)
  }, [data])

  return result || fromWei(JSBI.BigInt(0))
}

export const useAlgebraClaim = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, sendTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraClaim = useCallback(
    async ({ tokenId, feeValue0, feeValue1, isFarming, poolkey }, callback) => {
      const key = uuidv4()
      const claimFeeId = uuidv4()
      const claimFarmId = uuidv4()

      setPending(true)
      startTxn({
        key,
        title: 'Claim Rewards',
        transactions: {
          ...(isFarming
            ? {
                [claimFarmId]: {
                  desc: t('Claim Farming Rewards'),
                  status: TXN_STATUS.START,
                  hash: null,
                },
              }
            : {
                [claimFeeId]: {
                  desc: t('Claim Fees'),
                  status: TXN_STATUS.START,
                  hash: null,
                },
              }),
        },
      })

      if (isFarming) {
        if (!poolkey) {
          errorToast('Error', 'Missing pool key')
          return
        }

        const farmingCenter = getFarmingCenterContract(chainId)
        const calldata = collectAndClaimRewards({ positions: [{ poolKey: poolkey, tokenId }], chainId, account })

        if (!(await writeTxn(key, claimFarmId, farmingCenter, 'multicall', [calldata]))) {
          setPending(false)
          return
        }
      } else {
        const positionManger = getNPMContract(chainId, version)
        const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
          tokenId,
          expectedCurrencyOwed0: feeValue0,
          expectedCurrencyOwed1: feeValue1,
          recipient: account,
        })

        if (!(await sendTxn(key, claimFeeId, positionManger.address, calldata, value))) {
          setPending(false)
          return
        }
      }

      endTxn({ key, final: 'Claimed' })
      setPending(false)
      callback()
    },
    [startTxn, t, endTxn, chainId, writeTxn, version, account, sendTxn],
  )

  return { onAlgebraClaim, pending }
}

export const useAlgebraEnterFarming = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onEnterFarming = useCallback(
    async ({ tokenId, poolAddress }, callback) => {
      if (!tokenId || !poolAddress) {
        errorToast('Error', 'Missing token addresses')
        return
      }

      const key = uuidv4()
      const approveId = uuidv4()
      const stakeId = uuidv4()

      const incentiveMaker = getIncentiveContract(chainId)
      const farmingCenter = getFarmingCenterContract(chainId)
      const positionManger = getNPMContract(chainId, 3)

      const farmingApprovals = await readCall(positionManger, 'farmingApprovals', [tokenId], chainId)
      const isNotAppproved = farmingApprovals !== farmingCenter.address

      const transactions = {}
      if (isNotAppproved) {
        transactions[approveId] = {
          desc: `${t('Approve For Farming')}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[stakeId] = {
        desc: t('Earn $THE'),
        status: TXN_STATUS.START,
        hash: null,
      }
      startTxn({ key, title: t('Earn $THE'), transactions })
      setPending(true)

      if (isNotAppproved) {
        // MARK: APPROVE LP TOKEN FOR FARMING
        const txHash = await writeTxn(key, approveId, positionManger, 'approveForFarming', [
          tokenId,
          true,
          farmingCenter.address,
        ])
        if (!txHash) {
          setPending(false)
          return
        }
      }

      // MARK: STAKE LP TOKEN FOR FARMING
      const poolKey = await readCall(incentiveMaker, 'poolToKey', [poolAddress], chainId)
      const txHash = await writeTxn(key, stakeId, farmingCenter, 'enterFarming', [poolKey, tokenId])
      if (!txHash) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Exit Farming Successful' })
      setPending(false)
      callback()
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onEnterFarming, pending }
}

export const useAlgebraExitFarming = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onExitFarming = useCallback(
    async ({ poolkey, tokenId }, callback) => {
      const key = uuidv4()
      const exitId = uuidv4()

      setPending(true)
      startTxn({
        key,
        title: t('Unstake'),
        transactions: {
          [exitId]: {
            desc: t('Unstake'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      const farmingCenter = getFarmingCenterContract(chainId)
      const txHash = await writeTxn(key, exitId, farmingCenter, 'exitFarming', [poolkey, tokenId])
      if (!txHash) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Exit Farming Successful' })
      setPending(false)
      callback()
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onExitFarming, pending }
}

export const useAlgebraRemove = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, sendTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraRemove = useCallback(
    async ({
      tokenId,
      farmReward,
      position,
      liquidityPercentage,
      currency0,
      currency1,
      slippage,
      deadline,
      callback,
    }) => {
      const key = uuidv4()
      const claimRewardId = uuidv4()
      const removeuuid = uuidv4()

      const { reward0, reward1, poolkey } = farmReward ?? {}
      const rewardAmount = Number(reward0?.toSignificant() ?? 0) + Number(reward1?.toSignificant() ?? 0)

      startTxn({
        key,
        title: 'Remove Liquidity',
        transactions: {
          ...(rewardAmount > 0 && {
            [claimRewardId]: {
              desc: t('Claim Rewards'),
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

      if (rewardAmount > 0) {
        const farmingCenter = getFarmingCenterContract(chainId)
        const calldata = collectAndClaimRewards({ positions: [{ poolKey: poolkey, tokenId }], chainId, account })

        if (!(await writeTxn(key, claimRewardId, farmingCenter, 'multicall', [calldata]))) {
          setPending(false)
          return
        }
      }

      setPending(true)
      const positionManger = getNPMContract(chainId, version)
      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
        tokenId,
        liquidityPercentage,
        slippageTolerance: allowedSlippage,
        deadline: timestamp.toString(),
        burnToken: true,
        collectOptions: {
          expectedCurrencyOwed0: currency0,
          expectedCurrencyOwed1: currency1,
          recipient: account,
        },
      })

      if (!(await sendTxn(key, removeuuid, positionManger.address, calldata, value))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Removed position' })
      setPending(false)
      callback()
    },
    [startTxn, t, chainId, version, account, sendTxn, endTxn, writeTxn],
  )

  return { onAlgebraRemove, pending }
}

export const useAlgebraBurn = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraBurn = useCallback(
    async (tokenId, callback) => {
      const key = uuidv4()
      const burnuuid = uuidv4()
      startTxn({
        key,
        title: `${t('Burn')} NFT #${tokenId}`,
        transactions: {
          [burnuuid]: {
            desc: `${t('Burn')} NFT #${tokenId}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const positionManger = getNPMContract(chainId, version)

      const { calldata, value } = NonfungiblePositionManager.burnCallParameters(tokenId)

      if (!(await sendTxn(key, burnuuid, positionManger.address, calldata, value))) {
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
    [startTxn, endTxn, sendTxn, chainId, t, version],
  )

  return { onAlgebraBurn, pending }
}

export const useAlgebraIncrease = (version = 3) => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()
  const t = useTranslations()

  const onAlgebraIncrease = useCallback(
    async (amountA, amountB, position, depositADisabled, depositBDisabled, slippage, deadline, tokenId, callback) => {
      const positionManger = getNPMContract(chainId, version)
      const algebraAddress = positionManger.address

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
        title: 'Add Liquidity',
        transactions: {
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
          [adduuid]: {
            desc: t('Add Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      if (!isFirstApproved) {
        if (
          !(await writeTxn(key, approve1uuid, firstContract, 'approve', [
            algebraAddress,
            toWei(amountA.toExact(), baseCurrency.decimals),
          ]))
        ) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (
          !(await writeTxn(key, approve2uuid, secondContract, 'approve', [
            algebraAddress,
            toWei(amountB.toExact(), quoteCurrency.decimals),
          ]))
        ) {
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
        version,
        chainId,
      })

      if (!(await sendTxn(key, adduuid, algebraAddress, calldata, value))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Added Liquidity',
      })
      setPending(false)
      callback()
    },
    [version, chainId, startTxn, t, sendTxn, endTxn, account, writeTxn],
  )

  return { onAlgebraIncrease, pending }
}

export const useAlgebraMigration = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, writeTxn, endTxn, sendTxn } = useTxn()
  const { slippage, deadline } = useSettings()

  const t = useTranslations()

  const onAlgebraMigrate = useCallback(
    async ({
      positionV2,
      currencyA,
      amountA,
      currencyB,
      amountB,
      mintInfo,
      feeValue0,
      feeValue1,
      tokenId,
      isFarming = false,
      callback,
    }) => {
      const key = uuidv4()

      const createPoolId = uuidv4()
      const removeId = uuidv4()
      const approveId1 = uuidv4()
      const approveId2 = uuidv4()
      const addId = uuidv4()
      const approveNft = uuidv4()
      const stakeId = uuidv4()

      const nftPositionV3 = Contracts.NPMIntegral[chainId]
      const nftPositionV2 = Contracts.NPMFusion[chainId]
      const farmingCenter = getFarmingCenterContract(chainId)
      const incentiveMaker = getIncentiveContract(chainId)
      const positionManger = getNPMContract(chainId, 3)

      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))
      const { positionV3, isPoolExist } = mintInfo

      const baseCurrencyAddress = currencyA.wrapped?.address.toLowerCase()
      const quoteCurrencyAddress = currencyB.wrapped?.address.toLowerCase()

      let isFirstApproved = true
      let isSecondApproved = true
      const firstContract = !currencyA.isNative ? getERC20Contract(baseCurrencyAddress, chainId) : null
      const secondContract = !currencyB.isNative ? getERC20Contract(quoteCurrencyAddress, chainId) : null

      if (!currencyA.isNative) {
        const allowance = await readCall(firstContract, 'allowance', [account, nftPositionV3], chainId)
        isFirstApproved = allowance >= parseUnits(amountA, currencyA.decimals)
      }

      if (!currencyB.isNative) {
        const allowance = await readCall(secondContract, 'allowance', [account, nftPositionV3], chainId)
        isSecondApproved = allowance >= parseUnits(amountB, currencyB.decimals)
      }

      const transactions = {}
      transactions[removeId] = {
        desc: `${t('Remove Liquidity')} from V2`,
        status: TXN_STATUS.START,
        hash: null,
      }
      if (!isFirstApproved) {
        transactions[approveId1] = {
          desc: `${t('Approve')} ${currencyA.symbol}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }
      if (!isSecondApproved) {
        transactions[approveId2] = {
          desc: `${t('Approve')} ${currencyB.symbol}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      if (!isFarming && !isPoolExist) {
        transactions[createPoolId] = {
          desc: t('Create pool'),
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[addId] = {
        desc: `${t('Add Liquidity')} to V3`,
        status: TXN_STATUS.START,
        hash: null,
      }
      if (isFarming) {
        transactions[approveNft] = {
          desc: `${t('Approve')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }

        transactions[stakeId] = {
          desc: `${t('Stake')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      startTxn({ key, title: `${t('Migrate')}`, transactions })
      setPending(true)

      // MARK: REMOVE FROM V2 (INCLUDE CLAIM REWARD)
      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const { calldata: removeCallData, value: removeValue } = NonfungiblePositionManager.removeCallParameters(
        positionV2,
        {
          tokenId,
          liquidityPercentage: new Percent(100, 100),
          slippageTolerance: allowedSlippage,
          deadline: timestamp.toString(),
          burnToken: true,
          collectOptions: {
            expectedCurrencyOwed0: feeValue0,
            expectedCurrencyOwed1: feeValue1,
            recipient: account,
          },
        },
      )

      if (!(await sendTxn(key, removeId, nftPositionV2, removeCallData, removeValue))) {
        setPending(false)
        return
      }

      // APPROVE TOKEN TO V3
      if (!isFirstApproved) {
        if (!(await writeTxn(key, approveId1, firstContract, 'approve', [nftPositionV3, maxUint256]))) {
          setPending(false)
          return
        }
      }

      if (!isSecondApproved) {
        if (!(await writeTxn(key, approveId2, secondContract, 'approve', [nftPositionV3, maxUint256]))) {
          setPending(false)
          return
        }
      }

      // MARK: CREATE NEW NORMAL POOL (earn 80% fee)
      if (!isFarming && !isPoolExist) {
        const txHash = await writeTxn(
          key,
          createPoolId,
          { abi: PluginFactoryABI, address: Contracts.PluginFactory[chainId] },
          'createCustomPoolAndInitialize',
          [positionV3.pool.sqrtRatioX96, positionV3.pool.token0.address, positionV3.pool.token1.address],
        )
        if (!txHash) {
          setPending(false)
          return
        }
      }

      // MARK: ADD LIQUIDITY TO V3
      // const useNative = currencyA.isNative ? currencyA : currencyB.isNative ? currencyB : undefined
      const { calldata: addCallData, value: addValue } = NonfungiblePositionManager.addCallParameters(positionV3, {
        slippageTolerance: allowedSlippage,
        recipient: account,
        deadline: timestamp.toString(),
        useNative: undefined,
        createPool: !isPoolExist,
        version: 3,
        isFarming,
        chainId,
      })

      const txHash = await sendTxn(key, addId, nftPositionV3, addCallData, addValue)
      const addTxRecieve = await waitCall(txHash)
      if (!addTxRecieve) {
        setPending(false)
        return
      }

      if (isFarming) {
        // MARK: APPROVE LP TOKEN FOR FARMING
        const decodeData = NonfungiblePositionManager.getMintedPosition(addTxRecieve, chainId)
        const nftId = decodeData.args?.tokenId
        const poolAddress = decodeData.args?.pool

        if (
          !(await writeTxn(key, approveNft, positionManger, 'approveForFarming', [nftId, true, farmingCenter.address]))
        ) {
          setPending(false)
          return
        }

        // MARK: STAKE LP TOKEN FOR FARMING
        const poolKey = await readCall(incentiveMaker, 'poolToKey', [poolAddress], chainId)
        if (!(await writeTxn(key, stakeId, farmingCenter, 'enterFarming', [poolKey, nftId]))) {
          setPending(false)
          return
        }
      }

      endTxn({ key, final: 'Migrate Successful' })
      setPending(false)
      callback()
    },
    [chainId, slippage, startTxn, t, deadline, account, sendTxn, endTxn, writeTxn],
  )

  return { onAlgebraMigrate, pending }
}

export const useAlgebraRemoveAll = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, sendTxn, updateTxn } = useTxn()
  const { slippage, deadline } = useSettings()
  const { push } = useRouter()

  const onAlgebraRemoveAll = useCallback(
    async ({ position, currencyA, currencyB, feeValue0, feeValue1, tokenId }) => {
      const key = uuidv4()
      const removeId = uuidv4()
      const redirectId = uuidv4()

      const nftPositionV2 = Contracts.NPMFusion[chainId]
      const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))

      const transactions = {
        [removeId]: {
          desc: `${t('Remove Liquidity')} from V2`,
          status: TXN_STATUS.START,
          hash: null,
        },
        [redirectId]: {
          desc: 'Redirect to Provide Liquidity',
          status: TXN_STATUS.START,
          hash: null,
        },
      }

      startTxn({ key, title: `${t('Migrate')}`, transactions })
      setPending(true)

      // MARK: REMOVE FROM V2 (INCLUDE CLAIM REWARD)
      const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
      const { calldata: removeCallData, value: removeValue } = NonfungiblePositionManager.removeCallParameters(
        position,
        {
          tokenId,
          liquidityPercentage: new Percent(100, 100),
          slippageTolerance: allowedSlippage,
          deadline: timestamp.toString(),
          burnToken: true,
          collectOptions: {
            expectedCurrencyOwed0: feeValue0,
            expectedCurrencyOwed1: feeValue1,
            recipient: account,
          },
        },
      )

      if (!(await sendTxn(key, removeId, nftPositionV2, removeCallData, removeValue))) {
        setPending(false)
        return
      }

      push(
        // eslint-disable-next-line max-len
        `add-liquidity?pairType=Conc+Liquidity&step=3&firstAddress=${currencyA.address.toLowerCase()}&secondAddress=${currencyB.address.toLowerCase()}`,
      )
      updateTxn({
        key,
        uuid: redirectId,
        status: TXN_STATUS.SUCCESS,
      })

      endTxn({ key, final: 'Migrated' })
      setPending(false)
    },
    [chainId, slippage, t, startTxn, deadline, account, sendTxn, push, updateTxn, endTxn],
  )

  return { onAlgebraRemoveAll, pending }
}
