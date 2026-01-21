'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import Skeleton from '@/components/skeleton'
import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { usePositions, usePositionsLoading } from '@/hooks/usePositions'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

import AssetsOverview from './AssetsOverview'
import AssetsTable from './AssetsTable'
import SectionDivider from '../SectionDivider'

const richRenderers = {
  line1: chunks => <NewTextHeading>{chunks}</NewTextHeading>,
  line2: chunks => <NewTextHeading>{chunks}</NewTextHeading>,
  amount: chunks => <span className='text-primary-600'>{chunks}</span>,
}

function UserAssets({ setPositionRewards }) {
  const t = useTranslations()
  const { push } = useRouter()
  const { positions, removedClaimablePositions } = usePositions()
  const isLoading = usePositionsLoading()
  const assets = useAssets()

  const [showTable, setShowTable] = useState(true)
  const [currentHoverTableRow, setCurrentHoverTableRow] = useState(null)
  const [isHoverFromChart, setIsHoverFromChart] = useState(false)

  const idleAssets = useMemo(
    () =>
      assets.reduce((total, asset) => {
        if (asset.balance.lte(0)) return total
        return total + asset.balance.times(asset.price).toNumber()
      }, 0),
    [assets],
  )

  if (isLoading && positions.length === 0 && removedClaimablePositions.length === 0) {
    return <Skeleton className='h-[278px] w-full rounded-xl' />
  }

  return (
    <>
      <div className='flex flex-col rounded-xl max-md:bg-neutral-900 md:gap-2'>
        <div
          className={cn(
            'rounded-xl',
            positions.length === 0 &&
              removedClaimablePositions.length === 0 &&
              'bg-[url(/images/no-liquidity-bg.png)] bg-cover bg-center',
          )}
        >
          {positions.length > 0 || removedClaimablePositions.length > 0 ? (
            <div
              className={cn(
                'flex flex-col gap-4 rounded-xl bg-neutral-900 p-4 max-md:bg-transparent md:pt-8 md:pb-2',
                !positions.length && 'max-md:hidden',
              )}
            >
              <AssetsOverview
                isHoverFromChart={isHoverFromChart}
                setIsHoverFromChart={setIsHoverFromChart}
                currentHoverTableRow={currentHoverTableRow}
                positions={positions}
                removedClaimablePositions={removedClaimablePositions}
                setPositionRewards={setPositionRewards}
                isLoading={isLoading}
              />
              {positions.length > 0 && (
                <>
                  <div className='flex items-center justify-between xl:hidden'>
                    <NewTextSubHeading className='md:text-base'>{t('My Positions')}</NewTextSubHeading>
                    <div
                      className='flex cursor-pointer gap-2 rounded-md p-1'
                      onClick={() => setShowTable(prev => !prev)}
                    >
                      <Paragraph className='text-base font-medium text-neutral-500'>
                        {t(showTable ? 'Close' : 'Open')}
                      </Paragraph>
                      <ChevronDownIcon className='h-6 w-6' isRevert={showTable} />
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={showTable ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className='overflow-hidden'
                  >
                    <AssetsTable
                      setIsHoverFromChart={setIsHoverFromChart}
                      positions={positions}
                      setCurrentHoverTableRow={setCurrentHoverTableRow}
                      isLoading={isLoading}
                    />
                  </motion.div>
                </>
              )}
            </div>
          ) : (
            <div className='flex h-[278px] flex-col justify-between gap-0 p-8 md:justify-end md:gap-[42px]'>
              <div className='flex flex-col uppercase'>
                {t.rich('idleAssets', {
                  ...richRenderers,
                  value: formatAmount(idleAssets),
                })}
              </div>
              <PrimaryButton className='w-fit' onClick={() => push('/pools/add-liquidity')}>
                {t('Provide Liquidity')}
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
      <SectionDivider />
    </>
  )
}

export default UserAssets
