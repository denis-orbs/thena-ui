import { useMemo } from 'react'
import { zeroAddress } from 'viem'

import { PAIR_TYPES } from '@/constant'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import { usePools } from '@/state/pools/hooks'

import { useFarmPositions } from './position/useFarmPosition'
import { useManualPositions } from './position/useManualPosition'
import { useNotStakedPositions } from './position/useNotStakedPosition'
import { useStakedPosition } from './position/useStakedPosition'
import { useWeightedPositions } from './position/useWeightedPosition'
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

export const usePositions = () => {
  const pools = usePools()
  const vaults = useVaults()
  const userManuals = useManuals()
  const weightedPositionList = useWeightedPositionList()

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
    positions.filter(pos => pos.type !== 'Manual' && !pos.tokens && pos.account.gaugeBalance.gt(0)),
  )
  const notStakedPosition = useNotStakedPositions(
    positions.filter(pos => pos.type !== 'Manual' && !pos.tokens && pos.account.walletBalance.gt(0)),
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

  return allPositions
}
