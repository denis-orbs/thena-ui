import BigNumber from 'bignumber.js'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { useFarmPositions } from '@/hooks/position/useFarmPosition'
import { useManualPositions } from '@/hooks/position/useManualPosition'
import { useNotStakedPositions } from '@/hooks/position/useNotStakedPosition'
import { useStakedPosition } from '@/hooks/position/useStakedPosition'
import { useWeightedPositions } from '@/hooks/position/useWeightedPosition'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useWeightedPositionList } from '@/hooks/weightedPool/useWeigtedPool'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'
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
  const { push } = useRouter()
  const pools = usePools()
  const vaults = useVaults()
  const userManuals = useManuals()
  const assets = useAssets()

  const [showTable, setShowTable] = useState(false)

  const idleAssets = useMemo(
    () =>
      assets.reduce((total, asset) => {
        if (asset.balance.lte(0)) return total
        return total + asset.balance.times(asset.price).toNumber()
      }, 0),
    [assets],
  )

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
    <div
      className={cn(
        'rounded-xl',
        allPositions.length === 0 && 'bg-[url(/images/no-liquidity-bg.png)] bg-cover bg-center',
      )}
    >
      {allPositions.length > 0 ? (
        <div className='space-y-4 bg-neutral-900 p-4 max-md:bg-transparent max-md:px-4 md:px-9 md:pb-11'>
          <AssetsOverview positions={allPositions} />
          <div className='flex justify-between lg:hidden'>
            <NewTextSubHeading className='text-base font-medium'>{t('My Positions')}</NewTextSubHeading>
            <div className='flex cursor-pointer gap-2 rounded-md p-1' onClick={() => setShowTable(prev => !prev)}>
              <Paragraph className='text-base font-medium text-neutral-500'>
                {t(showTable ? 'Close' : 'Open')}
              </Paragraph>
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
      ) : (
        <div className='flex h-[278px] flex-col justify-between gap-0 p-8 md:justify-end md:gap-[42px]'>
          <div className='flex flex-col'>
            <NewTextHeading>
              YOU HAVE <span className='text-primary-600'>${formatAmount(idleAssets)}</span> IN IDLE ASSETS.
            </NewTextHeading>
            <NewTextHeading>PUT THEM TO WORK NOW!</NewTextHeading>
          </div>
          <PrimaryButton className='w-fit' onClick={() => push('/pools/add-liquidity')}>
            Provide Liquidity
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

export default UserAssets
