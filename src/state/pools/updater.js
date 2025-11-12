import BigNumber from 'bignumber.js'
import { chunk } from 'lodash'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core'
import { formatEther, formatUnits } from 'viem'

import {
  GAMMA_TYPES,
  ICHI_SwapFee,
  ICHI_TYPES,
  MANUAL_TYPES,
  PAIR_TYPES,
  UNKNOWN_LOGO,
  V1_POOL_TYPES,
  ZERO_ADDRESS,
} from '@/constant'
import gammaHypervisorAbiV3 from '@/constant/abi/fusion/gammaHypervisorV3.json'
import ichiVaultAbi from '@/constant/abi/fusion/ichiVault.json'
import ichiVaultV3 from '@/constant/abi/fusion/ichiVaultV3.json'
import { HypervisorMFDABI } from '@/constant/abi/integral/HypervisorMFDABI'
import { IchiMFDABI } from '@/constant/abi/integral/IchiMFDABI'
import { MFDFactoryABI } from '@/constant/abi/integral/MFDFactoryABI'
import { GaugeV3ABI } from '@/constant/abi/solidly/GaugeV3ABI'
import { PairAPIABI } from '@/constant/abi/solidly/PairAPIABI'
import { SolidlyFactoryABI } from '@/constant/abi/solidly/SolidlyFactoryABI'
import { SolidlyPairABI } from '@/constant/abi/solidly/SolidlyPairABI'
import voterAbi from '@/constant/abi/voter.json'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import usePrices from '@/hooks/usePrices'
import useWallet from '@/hooks/useWallet'
import { fetchFusionPools } from '@/lib/api'
import { callMulti, simulateCall } from '@/lib/contractActions'
import { fromWei } from '@/lib/utils'

import { updatePools, updatePoolsMigration } from './actions'
import { useChainSettings } from '../settings/hooks'

const pairABI = {
  classic: SolidlyPairABI,
  hypervisor: gammaHypervisorAbiV3,
  ichi: ichiVaultV3,
}

const mfdABI = {
  hypervisor: HypervisorMFDABI,
  ichi: IchiMFDABI,
}

const simulateICHIEarnedRewards = async (receiver, chainId) => {
  try {
    const contract = {
      address: receiver,
      abi: IchiMFDABI,
    }
    return await simulateCall(contract, 'getAllRewards', [], chainId)
  } catch (error) {
    return [0n]
  }
}

const createCallMulti = (calls, abi) =>
  callMulti(
    calls.map(call => ({
      abi,
      address: call.address,
      functionName: call.name,
      args: call.params,
    })),
  )

const pairAddressForAccount = async (chainId, pairs, account, type) => {
  if (!pairs?.length) return []

  const isClassicPair = type === 'classic'
  const isHypervisorPair = type === 'hypervisor'
  const isICHIPair = type === 'ichi'
  const results = []

  try {
    const chunks = chunk(pairs, 10)
    for (let index = 0; index < chunks.length; index++) {
      const pairsList = chunks[index]

      const gaugeForPoolCalls = pairsList.map(pair => ({
        address: Contracts.voter[chainId],
        name: 'gaugeForPool',
        params: [pair.address],
      }))

      const isPairCalls = pairsList.map(pair => ({
        address: Contracts.SolidlyFactory[chainId],
        name: 'isPair',
        params: [pair.address],
      }))

      const accountLpBalanceCalls = pairsList.map(pair => ({
        address: pair.address,
        name: 'balanceOf',
        params: [account],
      }))

      const receiverCalls = pairsList.map(pair => ({
        address: isHypervisorPair ? pair.address : Contracts.MFDFactoryAddress[chainId],
        name: isHypervisorPair ? 'receiver' : 'vaultToStaker',
        params: isHypervisorPair ? [] : [pair.address],
      }))

      const [gaugeForPools, isPairs, accountLpBalances, receivers] = await Promise.all([
        createCallMulti(gaugeForPoolCalls, voterAbi),
        createCallMulti(isPairCalls, SolidlyFactoryABI),
        createCallMulti(accountLpBalanceCalls, pairABI[type]),
        !isClassicPair && receiverCalls.length
          ? createCallMulti(receiverCalls, isHypervisorPair ? gammaHypervisorAbiV3 : MFDFactoryABI)
          : [],
      ])

      const accountGaugeLPAmountCalls = []
      const earnedCalls = []
      const claimable0Calls = []
      const claimable1Calls = []
      const ichisEarned = []

      for (let i = 0; i < pairsList.length; i++) {
        const gauge = gaugeForPools[i]
        const isPair = isPairs[i]
        const pair = pairsList[i]

        if (isClassicPair) {
          if (gauge !== ZERO_ADDRESS && account !== ZERO_ADDRESS) {
            accountGaugeLPAmountCalls.push({
              address: gauge,
              name: 'balanceOf',
              params: [account],
            })

            earnedCalls.push({
              address: gauge,
              name: 'earnedAll',
              params: [account],
            })
          }

          if (isPair) {
            claimable0Calls.push({
              address: pair.address,
              name: 'claimable0',
              params: [account],
            })

            claimable1Calls.push({
              address: pair.address,
              name: 'claimable1',
              params: [account],
            })
          }
        } else if (receivers[i] !== ZERO_ADDRESS) {
          claimable0Calls.push({
            address: receivers[i],
            name: 'claimable',
            params: [account, pair.token0?.address],
          })

          claimable1Calls.push({
            address: receivers[i],
            name: 'claimable',
            params: [account, pair.token1?.address],
          })

          earnedCalls.push({
            address: receivers[i],
            name: 'claimableRewards',
            params: [account],
          })

          if (isICHIPair) {
            const ichiEarned = await simulateICHIEarnedRewards(receivers[i], chainId)
            ichisEarned.push([[Contracts.THE[chainId].toLowerCase()], [Number(ichiEarned[0])]])
          }

          accountGaugeLPAmountCalls.push({
            address: receivers[i],
            name: 'totalBalance',
            params: [account],
          })
        }
      }

      const [accountGaugeLPAmounts, earneds, claimable0s, claimable1s] = await Promise.all([
        createCallMulti(accountGaugeLPAmountCalls, isClassicPair ? GaugeV3ABI : mfdABI[type]),
        isICHIPair ? ichisEarned : createCallMulti(earnedCalls, isClassicPair ? GaugeV3ABI : mfdABI[type]),
        createCallMulti(claimable0Calls, isClassicPair ? SolidlyPairABI : mfdABI[type]),
        createCallMulti(claimable1Calls, isClassicPair ? SolidlyPairABI : mfdABI[type]),
      ])

      let gaugeIndex = 0
      let pairClaimIndex = 0

      for (let i = 0; i < pairsList.length; i++) {
        const pair = pairsList[i]
        const gauge = gaugeForPools[i]
        const isPair = isPairs[i]
        const accountLpBalance = accountLpBalances[i] ?? 0
        let accountGaugeLPAmount = 0
        let earned = 0
        let claimable0 = 0
        let claimable1 = 0

        if (isClassicPair) {
          if (gauge !== ZERO_ADDRESS && account !== ZERO_ADDRESS) {
            accountGaugeLPAmount = accountGaugeLPAmounts[gaugeIndex]
            earned = earneds[gaugeIndex]
            gaugeIndex++
          }

          if (isPair) {
            claimable0 = claimable0s[pairClaimIndex]
            claimable1 = claimable1s[pairClaimIndex]

            pairClaimIndex++
          }
        } else {
          const [receiver] = receivers[i]
          if (receiver !== ZERO_ADDRESS) {
            claimable0 = claimable0s[pairClaimIndex]
            claimable1 = claimable1s[pairClaimIndex]
            const earnedTokens = earneds[gaugeIndex]?.[0] || []
            const earnedRewards = earneds[gaugeIndex]?.[1] || []

            const theAddressId = earnedTokens.findIndex(t => t.toLowerCase() === Contracts.THE[chainId].toLowerCase())
            earned = earnedRewards[theAddressId] ?? 0
            accountGaugeLPAmount = accountGaugeLPAmounts[gaugeIndex]

            pairClaimIndex++
            gaugeIndex++
          }
        }

        results.push({
          pair_address: pair.address,
          claimable0: new BigNumber(String(claimable0)),
          claimable1: new BigNumber(String(claimable1)),
          account_lp_balance: new BigNumber(accountLpBalance),
          account_gauge_balance: new BigNumber(String(accountGaugeLPAmount)),
          account_gauge_earned: new BigNumber(String(earned)),
        })
      }
    }
  } catch (error) {
    console.error('get pairs for account error', error)
  }

  return results
}

const fetchFusionPoolsInfos = async ({ account, chainId, pools }) => {
  const classicPairs = []
  const gammaPairs = []
  const ichiPairs = []

  pools.forEach(fusion => {
    if (GAMMA_TYPES.includes(fusion.type)) {
      gammaPairs.push(fusion)
    } else if (ICHI_TYPES.includes(fusion.type)) {
      ichiPairs.push(fusion)
    } else if ([V1_POOL_TYPES.CLASSIC, V1_POOL_TYPES.VOLATILE, V1_POOL_TYPES.STABLE].includes(fusion.type)) {
      classicPairs.push(fusion)
    }
  })

  const [classicData, gammaData, ichiData] = await Promise.all([
    pairAddressForAccount(chainId, classicPairs, account, 'classic'),
    pairAddressForAccount(chainId, gammaPairs, account, 'hypervisor'),
    pairAddressForAccount(chainId, ichiPairs, account, 'ichi'),
  ])

  return [...classicData, ...gammaData, ...ichiData]
}

const fetchUserFusionsV2 = async (account, pools, chainId) => {
  if (chainId === CHAIN_ID.TEST_BSC) return []

  try {
    const pairInfos = await callMulti(
      pools.map(pool => ({
        address: Contracts.pairAPI[chainId],
        abi: PairAPIABI,
        functionName: chainId === ChainId.BSC ? 'getPairAccount' : 'getPairSimpleAccount',
        args: [pool.address, account],
        chainId,
      })),
      true,
    )

    return pairInfos.map(pool => {
      const { pair_address, claimable0, claimable1, account_lp_balance, account_gauge_earned, account_gauge_balance } =
        pool
      return {
        version: 2,
        address: pair_address, // pair contract address
        walletBalance: account_lp_balance, // account LP tokens balance
        gaugeBalance: account_gauge_balance, // account pair staked in gauge balance
        totalLp: account_lp_balance + account_gauge_balance, // account total LP tokens balance
        gaugeEarned: account_gauge_earned, // account earned emissions for this pair
        token0claimable: claimable0, // claimable 1st token from fees (for unstaked positions)
        token1claimable: claimable1, // claimable 2nd token from fees (for unstaked positions)
      }
    })
  } catch (error) {
    console.error(error)
    return []
  }
}

const fetchUserFusionsV3 = async (account, pools, chainId) => {
  const fusionPoolsInfos = await fetchFusionPoolsInfos({ account: account?.toLowerCase(), chainId, pools })

  return fusionPoolsInfos.map(pool => {
    const { pair_address, claimable0, claimable1, account_gauge_balance, account_gauge_earned, account_lp_balance } =
      pool
    return {
      version: 3,
      address: pair_address,
      walletBalance: new BigNumber(account_lp_balance),
      gaugeBalance: new BigNumber(account_gauge_balance),
      totalLp: new BigNumber(account_lp_balance).plus(account_gauge_balance),
      gaugeEarned: new BigNumber(account_gauge_earned),
      token0claimable: new BigNumber(claimable0),
      token1claimable: new BigNumber(claimable1),
    }
  })
}

const fetchIchiAllowed = async (pools, chainId) => {
  const ichi = pools.filter(pool => ICHI_TYPES.includes(pool.type))
  const allowed0 = await callMulti(
    ichi.map(pool => ({
      address: pool.address,
      abi: ichiVaultAbi,
      functionName: 'allowToken0',
      args: [],
      chainId,
    })),
  )

  let index = 0
  const result = []
  pools.forEach(pool => {
    const isIchi = ICHI_TYPES.includes(pool.type)
    if (pool.type === 'Volatile') pool.type = PAIR_TYPES.CLASSIC
    const deposit = !isIchi ? null : allowed0[index] ? pool.token0 : pool.token1
    if (isIchi) {
      index++
    }
    result.push({
      ...pool,
      allowed: deposit,
    })
  })
  return result
}

function Updater() {
  const dispatch = useDispatch()
  const { account } = useWallet()
  const assets = useAssets()
  const prices = usePrices()
  const { networkId } = useChainSettings()

  const { data: [fusionPoolsV3 = [], fusionPoolsV2 = []] = [] } = useSWR(
    ['fusions api', networkId],
    () =>
      Promise.all([
        fetchFusionPools({
          networkId,
          version: 3,
        }),
        fetchFusionPools({
          networkId,
          version: 2,
        }),
      ]),
    {
      refreshInterval: 60000,
    },
  )

  const { data: userInfos } = useSWRImmutable(
    account && (fusionPoolsV2.length > 0 || fusionPoolsV3.length > 0)
      ? ['pools user api', account, fusionPoolsV2.length, fusionPoolsV3.length, networkId]
      : null,
    async () => {
      const [userFusionsV2, userFusionsV3] = await Promise.all([
        fetchUserFusionsV2(account, fusionPoolsV2, networkId),
        fetchUserFusionsV3(account, fusionPoolsV3, networkId),
      ])
      return [...userFusionsV2, ...userFusionsV3]
    },
  )

  const { data: poolsWithAllowed } = useSWR(
    fusionPoolsV2.length > 0 || fusionPoolsV3.length > 0
      ? ['vaults/allowed', networkId, fusionPoolsV2.length, fusionPoolsV3.length]
      : null,
    () => fetchIchiAllowed([...fusionPoolsV2, ...fusionPoolsV3], networkId),
  )

  const fetchInfo = useCallback(async () => {
    if (!poolsWithAllowed || poolsWithAllowed.length === 0) return
    let userInfo = []
    const autoPoolV3 = {
      ichi: [],
      gamma: [],
      classic: [],
      stable: [],
    }

    if (poolsWithAllowed.length > 0 && assets.length > 0) {
      const bnbTheNarrow = '0xed044cd5654ad208b1bc594fd108c132224e3f3c'
      const bnbTheWide = '0xe8ec29b75d98d3cdc47db9797b00dcaabea2b15b'
      const livetheThe = '0x3765476bffe43cf4c0656bf3a7529c54ae247056' // livethe/the
      const theUsdtWide = '0xb420adb29afd0a4e771739f0a29a4e077eff1acb' // the/usdt wide
      const ankrBnbTheNarrow = '0xd2f1045b4e5ba91ee725e8bf50740617a92e4a5f' // ankrbnb/the wide

      userInfo = poolsWithAllowed
        .map(fusion => {
          const { lpPrice, gauge } = fusion
          let kind
          if ([...GAMMA_TYPES, ...MANUAL_TYPES, ...ICHI_TYPES, 'DefiEdge'].includes(fusion.type)) {
            kind = PAIR_TYPES.LSD
          } else {
            kind = fusion.type === 'Stable' ? PAIR_TYPES.STABLE : PAIR_TYPES.CLASSIC
          }

          const asset0 = assets.find(ele => ele.address.toLowerCase() === fusion?.token0?.address?.toLowerCase())
          const asset1 = assets.find(ele => ele.address.toLowerCase() === fusion?.token1?.address?.toLowerCase())
          const allowed = assets.find(ele => ele.address.toLowerCase() === fusion?.allowed?.address?.toLowerCase())
          const token0 = {
            address: asset0?.address || fusion.token0.address,
            symbol: asset0?.symbol || 'UNKNOWN',
            decimals: asset0?.decimals || 18,
            logoURI: asset0?.logoURI || UNKNOWN_LOGO,
            price: asset0?.price || 0,
          }
          const token1 = {
            address: asset1?.address || fusion.token1.address,
            symbol: asset1?.symbol || 'UNKNOWN',
            decimals: asset1?.decimals || 18,
            logoURI: asset1?.logoURI || UNKNOWN_LOGO,
            price: asset1?.price || 0,
          }
          const token0Reserve = fusion.token0.reserve
          const token1Reserve = fusion.token1.reserve
          let totalTvl
          if (token0.price > 0 && token1.price > 0) {
            totalTvl = token0Reserve * token0.price + token1Reserve * token1.price
          } else if (token0.price > 0) {
            totalTvl = token0Reserve * token0.price * 2
          } else if (token1.price > 0) {
            totalTvl = token1Reserve * token1.price * 2
          } else {
            totalTvl = 0
          }
          const gaugeTvl = fusion.tvl
          let bribeUsd = 0
          const poolBribes = gauge.bribes
          let finalBribes = { fee: null, bribe: null }
          if (poolBribes) {
            if (poolBribes.bribe) {
              finalBribes.bribe = []
              poolBribes.bribe.forEach(ele => {
                const found = assets.find(asset => asset.address.toLowerCase() === ele.address.toLowerCase())
                bribeUsd += ele.amount * (found?.price || 0)
                finalBribes = {
                  bribe: [
                    ...finalBribes.bribe,
                    {
                      address: ele.address,
                      decimals: found?.decimals || 18,
                      amount: ele.amount,
                      symbol: found?.symbol || 'UNKNOWN',
                    },
                  ],
                }
              })
            }
            if (poolBribes.fee) {
              finalBribes.fee = []
              poolBribes.fee.forEach(ele => {
                const found = assets.find(asset => asset.address.toLowerCase() === ele.address.toLowerCase())
                bribeUsd += ele.amount * (found?.price || 0)
                finalBribes = {
                  ...finalBribes,
                  fee: [
                    ...finalBribes.fee,
                    {
                      address: ele.address,
                      decimals: found?.decimals || 18,
                      amount: ele.amount,
                      symbol: found?.symbol || 'UNKNOWN',
                    },
                  ],
                }
              })
            }
          }
          const found = (userInfos ?? []).find(
            item => item.address.toLowerCase() === fusion.address.toLowerCase() && item.version === fusion.version,
          )
          let user = {
            walletBalance: 0,
            gaugeBalance: 0,
            gaugeEarned: 0,
            totalLp: 0,
            token0claimable: 0,
            token1claimable: 0,
            staked0: 0,
            staked1: 0,
            stakedUsd: 0,
            earnedUsd: 0,
            total0: 0,
            total1: 0,
            totalUsd: 0,
          }

          if (found) {
            let walletBalance = formatEther(found.walletBalance)
            let gaugeBalance = formatEther(found.gaugeBalance)

            // ICHI Swap fees => make it Staked
            if (
              fusion.type === ICHI_SwapFee ||
              (GAMMA_TYPES.includes(fusion.type) && fusion.type.includes('SwapFee'))
            ) {
              gaugeBalance = formatEther(found.walletBalance)
              walletBalance = '0'
            }

            user = {
              ...found,
              token0claimable: formatUnits(found.token0claimable, token0.decimals),
              token1claimable: formatUnits(found.token1claimable, token1.decimals),
              walletBalance,
              gaugeBalance,
              totalLp: formatEther(found.totalLp),
              gaugeEarned: fromWei(found.gaugeEarned).toNumber(),
              stakedUsd: fromWei(found.gaugeBalance).times(lpPrice).toNumber(),
              earnedUsd: fromWei(found.gaugeEarned).times(prices.THE).toNumber(),
              totalUsd: fromWei(found.totalLp).times(lpPrice).toNumber(),
            }
          }

          if (fusion?.version === 3) {
            if (ICHI_TYPES.includes(fusion.type)) {
              autoPoolV3.ichi.push({
                ...fusion,
                allowed: {
                  address: allowed?.address,
                  symbol: allowed?.symbol,
                  decimals: allowed?.decimals,
                  logoURI: allowed?.logoURI,
                  price: allowed?.price,
                },
              })
            } else if (GAMMA_TYPES.includes(fusion.type)) {
              autoPoolV3.gamma.push(fusion)
            } else if (fusion.type === PAIR_TYPES.CLASSIC) {
              autoPoolV3.classic.push(fusion)
            } else if (fusion.type === PAIR_TYPES.STABLE) {
              autoPoolV3.stable.push(fusion)
            }
          }

          return {
            ...fusion,
            stable: fusion.type === 'Stable',
            type: kind,
            title: fusion.type,
            tvl: totalTvl,
            token0: {
              ...token0,
              reserve: fusion.token0.reserve,
            },
            token1: {
              ...token1,
              reserve: fusion.token1.reserve,
            },
            allowed: {
              address: allowed?.address,
              symbol: allowed?.symbol,
              decimals: allowed?.decimals,
              logoURI: allowed?.logoURI,
              price: allowed?.price,
            },
            gauge: {
              ...fusion.gauge,
              bribes: finalBribes,
              tvl: gaugeTvl,
              apr: fusion.gauge.apr,
              bribeUsd,
              pooled0: fusion.totalSupply ? (fusion.token0.reserve * fusion.gauge.totalSupply) / fusion.totalSupply : 0,
              pooled1: fusion.totalSupply ? (fusion.token1.reserve * fusion.gauge.totalSupply) / fusion.totalSupply : 0,
            },
            account: user,
          }
        })
        .sort((a, b) => (a.gauge.tvl - b.gauge.tvl) * -1)
        .sort((x, y) => (x.address === ankrBnbTheNarrow.toLowerCase() ? -1 : y.address === ankrBnbTheNarrow ? 1 : 0))
        .sort((x, y) => (x.address === livetheThe.toLowerCase() ? -1 : y.address === livetheThe ? 1 : 0))
        .sort((x, y) => (x.address === theUsdtWide.toLowerCase() ? -1 : y.address === theUsdtWide ? 1 : 0))
        .sort((x, y) => (x.address === bnbTheWide.toLowerCase() ? -1 : y.address === bnbTheWide ? 1 : 0))
        .sort((x, y) => (x.address === bnbTheNarrow.toLowerCase() ? -1 : y.address === bnbTheNarrow ? 1 : 0))
    }

    dispatch(
      updatePools({
        pools: userInfo,
        networkId,
      }),
    )
    dispatch(updatePoolsMigration(autoPoolV3))
  }, [dispatch, assets, networkId, poolsWithAllowed, userInfos, prices])

  useEffect(() => {
    fetchInfo()
  }, [fetchInfo])

  return null
}

export default Updater
