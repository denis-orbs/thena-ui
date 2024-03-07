import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'
import { formatEther, formatUnits } from 'viem'

import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { pairAPIAbi } from '@/constant/abi'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useExtraRewardsInfo } from '@/hooks/useGeneral'
import usePrices from '@/hooks/usePrices'
import { fetchPools } from '@/lib/api'
import { callMulti } from '@/lib/contractActions'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import { updatePools } from './actions'
import { useChainSettings } from '../settings/hooks'

const fetchUserFusions = async (url, account, pools, chainId) => {
  const pairInfos = await callMulti(
    pools.map(pool => ({
      address: Contracts.pairAPI[chainId],
      abi: pairAPIAbi,
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
      address: pair_address, // pair contract address
      walletBalance: account_lp_balance, // account LP tokens balance
      gaugeBalance: account_gauge_balance, // account pair staked in gauge balance
      totalLp: account_lp_balance + account_gauge_balance, // account total LP tokens balance
      gaugeEarned: account_gauge_earned, // account earned emissions for this pair
      token0claimable: claimable0, // claimable 1st token from fees (for unstaked positions)
      token1claimable: claimable1, // claimable 2nd token from fees (for unstaked positions)
    }
  })
}

const fetchIchiAllowed = async (_, pools, chainId) => {
  const ichi = pools.filter(pool => pool.type === 'ICHI')
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
    const isIchi = pool.type === 'ICHI'
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
  const extraRewardsInfo = useExtraRewardsInfo()
  const { networkId } = useChainSettings()
  const { data: pools } = useSWR(['pools api', networkId], { fetcher: fetchPools })
  const { data: userInfos } = useSWR(account && pools ? ['pools user api', account, networkId] : null, url =>
    fetchUserFusions(url, account, pools, networkId),
  )
  const { data: poolsWithAllowed } = useSWR(pools && pools.length > 0 ? ['vaults/allowed', networkId] : null, url =>
    fetchIchiAllowed(url, pools, networkId),
  )

  const fetchInfo = useCallback(async () => {
    if (!poolsWithAllowed) return
    let userInfo = []
    if (poolsWithAllowed.length > 0 && assets.length > 0) {
      const bnbTheNarrow = '0xed044cd5654ad208b1bc594fd108c132224e3f3c'
      const bnbTheWide = '0xe8ec29b75d98d3cdc47db9797b00dcaabea2b15b'
      const livetheThe = '0x3765476bffe43cf4c0656bf3a7529c54ae247056' // livethe/the
      const theUsdtWide = '0xb420adb29afd0a4e771739f0a29a4e077eff1acb' // the/usdt wide
      const ankrBnbTheNarrow = '0xd2f1045b4e5ba91ee725e8bf50740617a92e4a5f' // ankrbnb/the wide

      const totalWeight = poolsWithAllowed.reduce((sum, current) => sum + current.gauge.weight, 0)

      userInfo = poolsWithAllowed
        .map(fusion => {
          const { lpPrice, gauge } = fusion
          let kind
          if (['Narrow', 'Wide', 'Correlated', 'CL_Stable', 'ICHI', 'DefiEdge'].includes(fusion.type)) {
            kind = PAIR_TYPES.LSD
          } else {
            kind = fusion.type === 'Stable' ? PAIR_TYPES.STABLE : PAIR_TYPES.CLASSIC
          }
          const asset0 = assets.find(ele => ele.address.toLowerCase() === fusion.token0.address.toLowerCase())
          const asset1 = assets.find(ele => ele.address.toLowerCase() === fusion.token1.address.toLowerCase())
          const allowed = assets.find(ele => ele.address.toLowerCase() === fusion.allowed?.address.toLowerCase())
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
          const gaugeTvl = lpPrice * gauge.totalSupply
          const weightPercent = totalWeight > 0 ? (gauge.weight / totalWeight) * 100 : 0
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
          const found = (userInfos ?? []).find(item => item.address.toLowerCase() === fusion.address.toLowerCase())
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
          let extraApr = 0
          let extraRewards = null
          let extraRewardsInUsd = 0
          const foundExtra = (extraRewardsInfo ?? []).find(ele => ele.pairAddress === fusion.address)
          if (foundExtra) {
            extraApr = ((foundExtra.rewardRate * 31536000 * prices[foundExtra.doubleRewarderSymbol]) / gaugeTvl) * 100
            extraRewards = {
              amount: foundExtra.pendingReward,
              symbol: foundExtra.doubleRewarderSymbol,
            }
            extraRewardsInUsd = extraRewards.amount * prices[foundExtra.doubleRewarderSymbol]
          }
          if (found) {
            user = {
              ...found,
              token0claimable: formatUnits(found.token0claimable, token0.decimals),
              token1claimable: formatUnits(found.token1claimable, token1.decimals),
              walletBalance: formatEther(found.walletBalance),
              gaugeBalance: formatEther(found.gaugeBalance),
              totalLp: formatEther(found.totalLp),
              gaugeEarned: formatEther(found.gaugeEarned),
              stakedUsd: fromWei(found.gaugeBalance).times(lpPrice).toNumber(),
              earnedUsd: fromWei(found.gaugeEarned).times(prices.THE).plus(extraRewardsInUsd).toNumber(),
              totalUsd: fromWei(found.totalLp).times(lpPrice).toNumber(),
              extraRewards,
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
              apr: fusion.gauge.apr + extraApr,
              weightPercent,
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
  }, [dispatch, assets, extraRewardsInfo, networkId, poolsWithAllowed, userInfos, prices])

  useEffect(() => {
    fetchInfo()
  }, [fetchInfo])

  return null
}

export default Updater
