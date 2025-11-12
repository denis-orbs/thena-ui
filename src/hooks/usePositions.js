import { useMemo } from 'react'
import { zeroAddress } from 'viem'

import { HypervisorV3ABI } from '@/abis/gamma/HypervisorV3ABI'
import { IchiVaultV3ABI } from '@/abis/ichi/IchiVaultV3ABI'
import { MultiFeeDistributionABI } from '@/abis/ve/MultiFeeDistributionABI'
import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { batchCallMulti } from '@/lib/contractActions'
import { fromWei, isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import { usePools } from '@/state/pools/hooks'

import { useFarmPositions } from './position/useFarmPosition'
import { useManualPositions } from './position/useManualPosition'
import { useNotStakedPositions } from './position/useNotStakedPosition'
import { useStakedPosition } from './position/useStakedPosition'
import { useWeightedPositions } from './position/useWeightedPosition'
import { useCachedSWR } from './useCachedSWR'
import useWallet from './useWallet'
import { useWeightedPositionList } from './weightedPool/useWeigtedPool'

const updateWalletBalance = positions => {
  const groupedPositions = positions.reduce((map, position) => {
    if (!map[position.address]) {
      map[position.address] = []
    }
    map[position.address].push(position)
    return map
  }, {})

  Object.values(groupedPositions).forEach(group => {
    const posV2 = group.find(pos => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pos.type) && pos.version === 2)
    const posV3 = group.find(pos => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pos.type) && pos.version === 3)

    if (posV2 && posV3 && !isInvalidAmount(posV2.account.walletBalance)) {
      // Update walletBalance for the version 2 position
      posV2.account.walletBalance = ZERO_VALUE
    }
  })

  return positions
}

const useGetPositionClaimableRewards = (pools, type) => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const queryKey = useMemo(
    () => [`${type}-claimable-reward`, pools.map(pool => pool.address), account, chainId],
    [account, chainId, pools, type],
  )
  const { data } = useCachedSWR(queryKey, async () => {
    const farmContractAddresses = await batchCallMulti(
      pools.map(pool => ({
        address: pool.address,
        abi: type === 'ichi' ? IchiVaultV3ABI : HypervisorV3ABI,
        functionName: type === 'ichi' ? 'farmingContract' : 'receiver',
      })),
    )
    const results = await batchCallMulti(
      farmContractAddresses.map(address => ({
        address,
        abi: MultiFeeDistributionABI,
        functionName: 'claimableRewards',
        args: [account],
      })),
    )

    const allPools = pools.map((pool, index) => ({
      ...pool,
      tokens: results[index][0],
      amounts: results[index][1],
    }))

    const filteredPools = allPools.filter(item => item.amounts.some(amount => !fromWei(amount).isZero()))

    return filteredPools.map(pool => {
      const { tokens, amounts } = pool
      let totalUsd = 0
      for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index]
        const asset = assets.find(item => item.address.toLowerCase() === token.toLowerCase())
        totalUsd += (asset.price ?? 0) * fromWei(amounts[index]).toNumber()
      }
      return {
        ...pool,
        rewardUsd: totalUsd,
      }
    })
  })

  return data
}

const useRemovedClaimablePositions = () => {
  const positions = usePools()
  const ichiPositions = useMemo(
    () =>
      positions.filter(
        pos =>
          pos.title === ICHI_TYPES[0] &&
          pos.version === 3 &&
          !(pos.account?.gaugeBalance?.gt(0) || pos.account?.walletBalance?.gt(0)),
      ),
    [positions],
  )
  const gammaPositions = useMemo(
    () =>
      positions.filter(
        pos =>
          pos.version === 3 &&
          GAMMA_TYPES.includes(pos.title) &&
          pos.title.includes('Farming') &&
          !(pos.account?.gaugeBalance?.gt(0) || pos.account?.walletBalance?.gt(0)),
      ),
    [positions],
  )

  const removedClaimableIchiPositions = useGetPositionClaimableRewards(ichiPositions, 'ichi')
  const removedClaimableGammaPositions = useGetPositionClaimableRewards(gammaPositions, 'gamma')

  return [...removedClaimableIchiPositions, ...removedClaimableGammaPositions]
}

export const usePositions = () => {
  const userManuals = useManuals()
  const weightedPositionList = useWeightedPositionList()
  const pools = usePools()
  const vaults = useVaults()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])

  const positions = useMemo(() => {
    const pos = [...userPools, ...userManuals]
    return updateWalletBalance(pos)
  }, [userManuals, userPools])

  const manualPositions = useManualPositions(
    positions.filter(pos => pos.type === 'Manual' && pos?.deployer !== zeroAddress),
  )
  const farmingPositions = useFarmPositions(
    positions.filter(pos => pos.type === 'Manual' && pos?.deployer === zeroAddress),
  )

  const weightedPositions = useWeightedPositions(weightedPositionList)

  const stakedPosition = useStakedPosition(
    positions.filter(pos => pos.type !== 'Manual' && !pos.tokens && pos.account?.gaugeBalance?.gt(0)),
  )
  const notStakedPosition = useNotStakedPositions(
    positions.filter(pos => pos.type !== 'Manual' && !pos.tokens && pos.account?.walletBalance?.gt(0)),
  )

  const allPositions = useMemo(
    () =>
      [...stakedPosition, ...notStakedPosition, ...manualPositions, ...farmingPositions, ...weightedPositions].map(
        (item, index) => ({
          ...item,
          positionId: `pos-${index}`,
        }),
      ),
    [manualPositions, farmingPositions, weightedPositions, stakedPosition, notStakedPosition],
  )

  const removedClaimablePositions = useRemovedClaimablePositions()

  return {
    positions: allPositions,
    removedClaimablePositions,
  }
}
