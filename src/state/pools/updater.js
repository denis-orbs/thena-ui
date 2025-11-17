import BigNumber from 'bignumber.js'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core'
import { formatEther, formatUnits } from 'viem'

import { HypervisorMFDABI } from '@/abis/gamma/HypervisorMFDABI'
import { HypervisorV3ABI } from '@/abis/gamma/HypervisorV3ABI'
import { IchiMFDABI } from '@/abis/ichi/IchiMFDABI'
import { IchiVaultV2ABI } from '@/abis/ichi/IchiVaultV2ABI'
import { IchiVaultV3ABI } from '@/abis/ichi/IchiVaultV3ABI'
import { MFDFactoryABI } from '@/abis/integral/MFDFactoryABI'
import { SolidlyPairABI } from '@/abis/solidly/SolidlyPairABI'
import { GaugeV3ABI } from '@/abis/ve/GaugeV3ABI'
import { PairAPIABI } from '@/abis/ve/PairAPIABI'
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
  hypervisor: HypervisorV3ABI,
  ichi: IchiVaultV3ABI,
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

  const isSolidlyPair = type === 'classic'
  const isHypervisorPair = type === 'hypervisor'
  const isICHIPair = type === 'ichi'
  const results = []

  try {
    const pairsList = pairs

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

    const [accountLpBalances, receivers] = await Promise.all([
      createCallMulti(accountLpBalanceCalls, pairABI[type]),
      !isSolidlyPair && receiverCalls.length
        ? createCallMulti(receiverCalls, isHypervisorPair ? HypervisorV3ABI : MFDFactoryABI)
        : [],
    ])

    const accountGaugeLPAmountCalls = []
    const earnedCalls = []
    const claimable0Calls = []
    const claimable1Calls = []
    const ichisEarned = []

    for (let i = 0; i < pairsList.length; i++) {
      const pair = pairsList[i]
      const gaugeAddress = pair.gauge.address

      if (isSolidlyPair) {
        if (gaugeAddress !== ZERO_ADDRESS && account !== ZERO_ADDRESS) {
          accountGaugeLPAmountCalls.push({
            address: gaugeAddress,
            name: 'balanceOf',
            params: [account],
          })

          earnedCalls.push({
            address: gaugeAddress,
            name: 'earnedAll',
            params: [account],
          })
        }

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
      createCallMulti(accountGaugeLPAmountCalls, isSolidlyPair ? GaugeV3ABI : mfdABI[type]),
      isICHIPair ? ichisEarned : createCallMulti(earnedCalls, isSolidlyPair ? GaugeV3ABI : mfdABI[type]),
      createCallMulti(claimable0Calls, isSolidlyPair ? SolidlyPairABI : mfdABI[type]),
      createCallMulti(claimable1Calls, isSolidlyPair ? SolidlyPairABI : mfdABI[type]),
    ])

    let gaugeIndex = 0
    let pairClaimIndex = 0

    for (let i = 0; i < pairsList.length; i++) {
      const pair = pairsList[i]
      const gaugeAddress = pair.gauge.address
      const accountLpBalance = accountLpBalances[i] ?? 0
      let accountGaugeLPAmount = 0
      let earned = 0
      let claimable0 = 0
      let claimable1 = 0

      if (isSolidlyPair) {
        if (gaugeAddress !== ZERO_ADDRESS && account !== ZERO_ADDRESS) {
          accountGaugeLPAmount = accountGaugeLPAmounts[gaugeIndex]
          earned = earneds[gaugeIndex]
          gaugeIndex++
        }
        claimable0 = claimable0s[pairClaimIndex]
        claimable1 = claimable1s[pairClaimIndex]

        pairClaimIndex++
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

const fetchUserPoolsV2 = async (account, pools, chainId) => {
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

    return pairInfos
      .filter(pool => !!pool)
      .map(pool => {
        const {
          pair_address,
          claimable0,
          claimable1,
          account_lp_balance,
          account_gauge_earned,
          account_gauge_balance,
        } = pool
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

const fetchUserPoolsV3 = async (account, pools, chainId) => {
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
      abi: IchiVaultV2ABI,
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

  const { data: [v3Pools = [], v2Pools = []] = [] } = useSWR(
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
    account && (v2Pools.length > 0 || v3Pools.length > 0)
      ? ['pools user api', account, v2Pools.length, v3Pools.length, networkId]
      : null,
    async () => {
      const [userPoolsV2, userPoolsV3] = await Promise.all([
        fetchUserPoolsV2(account, v2Pools, networkId),
        fetchUserPoolsV3(account, v3Pools, networkId),
      ])
      return [...userPoolsV2, ...userPoolsV3]
    },
  )

  const { data: poolsWithAllowed } = useSWR(
    v2Pools.length > 0 || v3Pools.length > 0 ? ['vaults/allowed', networkId, v2Pools.length, v3Pools.length] : null,
    () => fetchIchiAllowed([...v2Pools, ...v3Pools], networkId),
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
      userInfo = poolsWithAllowed
        .map(pool => {
          const { lpPrice, gauge } = pool
          let kind
          if ([...GAMMA_TYPES, ...MANUAL_TYPES, ...ICHI_TYPES, 'DefiEdge'].includes(pool.type)) {
            kind = PAIR_TYPES.LSD
          } else {
            kind = pool.type === 'Stable' ? PAIR_TYPES.STABLE : PAIR_TYPES.CLASSIC
          }

          const asset0 = assets.find(ele => ele.address.toLowerCase() === pool?.token0?.address?.toLowerCase())
          const asset1 = assets.find(ele => ele.address.toLowerCase() === pool?.token1?.address?.toLowerCase())
          const allowed = assets.find(ele => ele.address.toLowerCase() === pool?.allowed?.address?.toLowerCase())
          const token0 = {
            address: asset0?.address || pool.token0.address,
            symbol: asset0?.symbol || 'UNKNOWN',
            decimals: asset0?.decimals || 18,
            logoURI: asset0?.logoURI || UNKNOWN_LOGO,
            price: asset0?.price || 0,
          }
          const token1 = {
            address: asset1?.address || pool.token1.address,
            symbol: asset1?.symbol || 'UNKNOWN',
            decimals: asset1?.decimals || 18,
            logoURI: asset1?.logoURI || UNKNOWN_LOGO,
            price: asset1?.price || 0,
          }
          const token0Reserve = pool.token0.reserve
          const token1Reserve = pool.token1.reserve
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
          const gaugeTvl = pool.tvl
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
            item => item.address.toLowerCase() === pool.address.toLowerCase() && item.version === pool.version,
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
            if (pool.type === ICHI_SwapFee || (GAMMA_TYPES.includes(pool.type) && pool.type.includes('SwapFee'))) {
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

          if (pool?.version === 3) {
            if (ICHI_TYPES.includes(pool.type)) {
              autoPoolV3.ichi.push({
                ...pool,
                allowed: {
                  address: allowed?.address,
                  symbol: allowed?.symbol,
                  decimals: allowed?.decimals,
                  logoURI: allowed?.logoURI,
                  price: allowed?.price,
                },
              })
            } else if (GAMMA_TYPES.includes(pool.type)) {
              autoPoolV3.gamma.push(pool)
            } else if (pool.type === PAIR_TYPES.CLASSIC) {
              autoPoolV3.classic.push(pool)
            } else if (pool.type === PAIR_TYPES.STABLE) {
              autoPoolV3.stable.push(pool)
            }
          }

          return {
            ...pool,
            stable: pool.type === 'Stable',
            type: kind,
            title: pool.type,
            tvl: totalTvl,
            token0: {
              ...token0,
              reserve: pool.token0.reserve,
            },
            token1: {
              ...token1,
              reserve: pool.token1.reserve,
            },
            allowed: {
              address: allowed?.address,
              symbol: allowed?.symbol,
              decimals: allowed?.decimals,
              logoURI: allowed?.logoURI,
              price: allowed?.price,
            },
            gauge: {
              ...pool.gauge,
              bribes: finalBribes,
              tvl: gaugeTvl,
              apr: pool.gauge.apr,
              bribeUsd,
              pooled0: pool.totalSupply ? (pool.token0.reserve * pool.gauge.totalSupply) / pool.totalSupply : 0,
              pooled1: pool.totalSupply ? (pool.token1.reserve * pool.gauge.totalSupply) / pool.totalSupply : 0,
            },
            account: user,
          }
        })
        .sort((a, b) => (a.gauge.tvl - b.gauge.tvl) * -1)
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
