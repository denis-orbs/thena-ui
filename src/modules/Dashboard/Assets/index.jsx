import React, { useCallback, useMemo, useRef } from 'react'

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
  const positionsValueRef = useRef([])
  const collectData = useCallback(data => {
    const { position, apr, depositLiquidity, rewardUsd, index } = data
    positionsValueRef.current[index] = { position, apr, depositLiquidity, rewardUsd }
  }, [])
  return (
    <Box className='space-y-4 max-md:bg-transparent max-md:px-0'>
      <AssetsOverview
        positionsValue={positionsValueRef.current}
        positions={[...userPools, ...userManuals, ...weightedPositionList]}
      />
      <AssetsTable
        positions={[...userPools, ...userManuals, ...weightedPositionList]}
        positionsValueRef={positionsValueRef}
      />
      <CaclculatorData positions={[...userPools, ...userManuals, ...weightedPositionList]} onData={collectData} />
    </Box>
  )
}

export default UserAssets
