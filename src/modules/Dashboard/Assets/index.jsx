import BigNumber from 'bignumber.js'
import React, { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { PAIR_TYPES } from '@/constant'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { useWeightedPositionList } from '@/hooks/weightedPool/useWeigtedPool'
import { isInvalidAmount } from '@/lib/utils'
import { usePools } from '@/state/pools/hooks'

import AssetsOverview from './AssetsOverview'
import AssetsTable from './AssetsTable'
import CaclculatorData from './CaclculatorData'

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
      posV2.account.walletBalance = new BigNumber(0)
    }
  })

  return positions
}

function UserAssets() {
  const pools = usePools()
  const vaults = useVaults()
  const userManuals = useManuals()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])
  const weightedPositionList = useWeightedPositionList()
  const [positionsValue, setPositionsValue] = useState([])
  const positions = useMemo(
    () => [...userPools, ...userManuals, ...weightedPositionList],
    [userManuals, userPools, weightedPositionList],
  )

  const filteredPositions = useMemo(() => updateWalletBalance(positions), [positions])

  const collectData = useCallback(
    data => {
      const { position, apr, depositLiquidity, rewardUsd, index, rewards = [] } = data
      setPositionsValue(prev => {
        const dataUpdate = prev
        dataUpdate[index] = { position, apr, depositLiquidity, rewardUsd, rewards }
        return dataUpdate
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positions],
  )

  return (
    <Box className='space-y-4 max-md:bg-transparent max-md:px-0 md:space-y-10 md:!pt-11'>
      <AssetsOverview positionsValue={positionsValue} />
      <AssetsTable positions={filteredPositions} />
      <CaclculatorData positions={filteredPositions} onData={collectData} />
    </Box>
  )
}

export default UserAssets
