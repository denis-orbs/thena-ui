import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import V1Add from '@/components/common/AddLiquidity/V1Add'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { cn } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import { PairBasicInfo } from './PairBasicInfo'
import { PoolAttributesSection } from './PoolAttributesSection'
import { PoolReserveSection } from './PoolReserveSection'

function AddLiquidityV1Pool({ pair, handleBack }) {
  const t = useTranslations()
  const searchParams = useSearchParams()

  const pairType = pair?.type ?? searchParams.get('pairType')

  const [firstAddress, setFirstAddress] = useState(pair?.token0?.address ?? searchParams.get('firstAddress'))
  const [secondAddress, setSecondAddress] = useState(pair?.token1?.address ?? searchParams.get('secondAddress'))
  const [showReserve, setShowReserve] = useState(false)

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  // If there is only poolv2, then use it
  const pool = useMemo(() => {
    if (!pair?.subpools?.length) return undefined
    return pair.subpools.length > 1 ? pair.subpools.find(item => item.version === 3) : pair.subpools[0]
  }, [pair])

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-row items-center gap-2 xl:gap-8'>
          <NewIconGroup
            logo1={(pair ? pair?.token0?.logoURI : firstAsset?.logoURI) ?? UNKNOWN_LOGO}
            logo2={(pair ? pair?.token1?.logoURI : secondAsset?.logoURI) ?? UNKNOWN_LOGO}
          />
          <NewTextHeading>
            {`${
              (pair ? pair?.token0?.symbol : firstAsset?.symbol) === 'WBNB'
                ? 'BNB'
                : pair
                  ? pair?.token0?.symbol
                  : firstAsset?.symbol
            }/${
              (pair ? pair?.token1?.symbol : secondAsset?.symbol) === 'WBNB'
                ? 'BNB'
                : pair
                  ? pair?.token1?.symbol
                  : secondAsset?.symbol
            }`}
          </NewTextHeading>
        </div>
      </div>
      <div className='mb-2 flex flex-col items-center justify-between xl:mb-4 xl:hidden'>
        <div className='flex w-full flex-row justify-between gap-2'>
          <NewTextSubHeading className='text-xl md:text-2xl 2xl:text-3xl'>
            {t((pair?.type || pairType) === PAIR_TYPES.STABLE ? 'Stable' : 'Classic')}
          </NewTextSubHeading>
          <div className='flex flex-col items-center'>
            <i
              onClick={() => setShowReserve(show => !show)}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-lg',
                'size-8 min-w-8 md:size-11 md:min-w-11',
                showReserve ? 'bg-neutral-600' : 'bg-neutral-900',
              )}
            >
              <InfoIcon className='size-4 stroke-neutral-400 md:size-5' />
            </i>
          </div>
        </div>
        {!pool && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={showReserve ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='mt-2 h-max flex-col gap-2 rounded-md bg-neutral-800 p-4'>
              <div>
                <NewTextSubHeading className='font-archia text-xl!'>{t('New Deposit')}</NewTextSubHeading>
              </div>
              <div>
                <Paragraph className='text-neutral-400'>{t('New Deposit description')}</Paragraph>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 xl:gap-8'>
        {/* Left side */}
        <div className='order-2 col-span-1 flex flex-col gap-4 xl:order-1'>
          <NewTextSubHeading className='hidden min-h-11 items-end text-xl xl:flex 2xl:text-3xl'>
            {t((pair?.type || pairType) === PAIR_TYPES.STABLE ? 'Stable' : 'Classic')}
          </NewTextSubHeading>
          {pair && (
            <div className='flex flex-col gap-2 md:gap-4 xl:gap-8'>
              <PairBasicInfo pair={pair} />
              <div className='hidden max-xl:block'>
                <PoolAttributesSection pair={pair} />
              </div>
            </div>
          )}

          <V1Add
            pool={pool}
            pairType={pair?.type || pairType}
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            setFirstAddress={setFirstAddress}
            setSecondAddress={setSecondAddress}
            handleBack={handleBack}
          />
        </div>

        {/* Right side */}
        <div className='order-1 col-span-1 flex-col gap-2 md:gap-4 xl:flex'>
          {!pair && (
            <div className='mt-4 hidden h-max flex-col gap-2 rounded-md bg-neutral-800 p-4 xl:mt-8 xl:flex'>
              <NewTextSubHeading className='font-archia text-xl!'>{t('New Deposit')}</NewTextSubHeading>
              <Paragraph className='text-neutral-400'>{t('New Deposit description')}</Paragraph>
            </div>
          )}

          {pool && (
            <div className='flex flex-col gap-0 xl:order-2 xl:gap-4'>
              <div className='hidden w-full xl:block'>
                <PoolAttributesSection pair={pair} className='w-full' />
              </div>

              <div className='order-1 xl:order-2'>
                <PoolReserveSection pool={pool} className='hidden xl:block' />

                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={showReserve ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  <PoolReserveSection pool={pool} className='mb-4 block xl:hidden' />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityV1Pool
