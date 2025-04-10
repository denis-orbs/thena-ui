import React, { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { useWeightedPositionList } from '@/hooks/weightedPool/useWeigtedPool'
import { usePools } from '@/state/pools/hooks'

import AssetsOverview from './AssetsOverview'
import AssetsTable from './AssetsTable'
import CaclculatorData from './CaclculatorData'

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
  const collectData = useCallback(
    data => {
      const { position, apr, depositLiquidity, rewardUsd, index } = data
      setPositionsValue(prev => {
        const dataUpdate = prev
        dataUpdate[index] = { position, apr, depositLiquidity, rewardUsd }
        return dataUpdate
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positions],
  )

  return (
    <Box className='space-y-4 max-md:bg-transparent max-md:px-0'>
      <AssetsOverview positionsValue={positionsValue} />
      <AssetsTable positions={positions} />
      <CaclculatorData positions={positions} onData={collectData} />
    </Box>
  )
}

export default UserAssets
