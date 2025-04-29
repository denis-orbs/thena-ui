import BigNumber from 'bignumber.js'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { useFarmPositions } from '@/hooks/position/useFarmPosition'
import { useManualPositions } from '@/hooks/position/useManualPosition'
import { useNotStakedPositions } from '@/hooks/position/useNotStakedPosition'
import { useStakedPosition } from '@/hooks/position/useStakedPosition'
import { useWeightedPositions } from '@/hooks/position/useWeightedPosition'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useWeightedPositionList } from '@/hooks/weightedPool/useWeigtedPool'
import { cn, isInvalidAmount } from '@/lib/utils'
import { usePools } from '@/state/pools/hooks'
import { ChevronDownIcon } from '@/svgs'

import AssetsOverview from './AssetsOverview'
import AssetsTable from './AssetsTable'

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
  const t = useTranslations()
  const windowSize = useWindowSize()
  const pools = usePools()
  const vaults = useVaults()
  const userManuals = useManuals()

  const [showTable, setShowTable] = useState(false)

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

  const weightedPositionList = useWeightedPositionList()
  const weightedPositions = useWeightedPositions(weightedPositionList)

  const stakedPosition = useStakedPosition(
    positions.filter(pos => pos.type !== 'Manual' && !pos.tokens && pos.account.gaugeBalance.gt(0)),
  )
  const notStakedPosition = useNotStakedPositions(
    positions.filter(pos => pos.type !== 'Manual' && !pos.tokens && pos.account.walletBalance.gt(0)),
  )

  const allPositions = useMemo(
    () => [...stakedPosition, ...notStakedPosition, ...manualPositions, ...farmingPositions, ...weightedPositions],
    [manualPositions, farmingPositions, weightedPositions, stakedPosition, notStakedPosition],
  )

  useEffect(() => {
    if (windowSize.width >= 834) {
      setShowTable(true)
    }
  }, [windowSize.width])

  return (
    <div className=' space-y-4 rounded-xl bg-neutral-900 p-4 max-md:bg-transparent md:px-9 md:pb-11'>
      <AssetsOverview positions={allPositions} />
      <div className='flex justify-between lg:hidden'>
        <NewTextSubHeading className='text-base font-medium'>{t('My Positions')}</NewTextSubHeading>
        <div className='flex cursor-pointer gap-2 rounded-md p-1' onClick={() => setShowTable(prev => !prev)}>
          <Paragraph className='text-base font-medium text-neutral-500'>{t(showTable ? 'Close' : 'Open')}</Paragraph>
          <ChevronDownIcon className={cn('size-6', showTable && 'rotate-180')} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={showTable ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='overflow-hidden'
      >
        <AssetsTable positions={allPositions} />
      </motion.div>
    </div>
  )
}

export default UserAssets
