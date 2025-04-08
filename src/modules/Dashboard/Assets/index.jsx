import React, { useMemo } from 'react'

import Box from '@/components/box'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { useWeightedPositionList } from '@/hooks/weightedPool/useWeigtedPool'
import { usePools } from '@/state/pools/hooks'

import AssetsOverview from './AssetsOverview'
import AssetsTable from './AssetsTable'

function UserAssets() {
  const pools = usePools()
  const vaults = useVaults()
  const userManuals = useManuals()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])
  const weightedPositionList = useWeightedPositionList()
  return (
    <Box className='space-y-4 max-md:bg-transparent max-md:px-0'>
      <AssetsOverview />
      <AssetsTable positions={[...userPools, ...userManuals, ...weightedPositionList]} />
    </Box>
  )
}

export default UserAssets
