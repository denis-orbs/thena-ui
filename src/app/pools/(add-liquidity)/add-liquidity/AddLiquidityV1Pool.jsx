import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import V1Add from '@/components/common/AddLiquidity/V1Add'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { cn } from '@/lib/utils'
import { ClassicPoolIcon, InfoIcon, StablePoolIcon } from '@/svgs'

import { PairBasicInfo } from './PairBasicInfo'
import { PoolAttributesSection } from './PoolAttributesSection'
import { PoolReserveSection } from './PoolReserveSection'

function AddLiquidityV1Pool({ pair, handleBack }) {
  const t = useTranslations()
  const searchParams = useSearchParams()

  const pairType = pair?.type ?? searchParams.get('pairType')

  const [firstAddress, setFirstAddress] = useState(pair?.token0?.address)
  const [secondAddress, setSecondAddress] = useState(pair?.token1?.address)
  const [showReserve, setShowReserve] = useState(true)

  useEffect(() => {
    setFirstAddress(pair?.token0?.address ?? searchParams.get('firstAddress'))
    setSecondAddress(pair?.token1?.address ?? searchParams.get('secondAddress'))
  }, [pair, searchParams])

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  // If there is only poolv2, then use it
  const pool = useMemo(() => {
    if (!pair?.subpools?.length) return undefined
    return pair.subpools.length > 1 ? pair.subpools.find(item => item.version === 3) : pair.subpools[0]
  }, [pair])

  const PageTitleSection = useMemo(() => {
    const renderTitle = (Icon, text) => (
      <>
        {pair ? (
          <div className='flex flex-col gap-4 lg:gap-16'>
            <div className='flex flex-row items-center gap-2 lg:gap-4 2xl:gap-8'>
              <NewIconGroup
                logo1={pair?.token0?.logoURI ?? UNKNOWN_LOGO}
                logo2={pair?.token1?.logoURI ?? UNKNOWN_LOGO}
              />
              <NewTextHeading>
                {`${pair.token0.symbol === 'WBNB' ? 'BNB' : pair.token0.symbol}/${
                  pair.token1.symbol === 'WBNB' ? 'BNB' : pair.token1.symbol
                }`}
              </NewTextHeading>
            </div>

            <div className='flex items-center justify-between'>
              <NewTextSubHeading className='lg:text-2xl 2xl:text-3xl'>{t(text.split(' ')[0])}</NewTextSubHeading>
              <div className='flex items-center lg:hidden'>
                <i
                  onClick={() => setShowReserve(show => !show)}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-lg',
                    'size-8 min-w-8 md:size-11 md:min-w-11',
                    showReserve ? 'bg-neutral-600' : 'bg-neutral-800',
                  )}
                >
                  <InfoIcon className='size-5 stroke-neutral-400' />
                </i>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex flex-row items-center gap-2 lg:gap-4 2xl:gap-8'>
            <Icon className='size-5 lg:size-12 2xl:size-16' />
            <NewTextHeading>{t(text)}</NewTextHeading>
          </div>
        )}
      </>
    )

    switch (pairType) {
      case PAIR_TYPES.STABLE:
        return renderTitle(StablePoolIcon, 'Stable Pool')

      default:
        return renderTitle(ClassicPoolIcon, 'Classic Pool')
    }
  }, [pairType, pair, t, showReserve])

  return (
    <div className='flex flex-col gap-4'>
      {PageTitleSection}

      <div className='grid lg:grid-cols-add-liquidity-layout lg:gap-4'>
        {/* Left side */}
        <div className='order-2 flex flex-col gap-4 lg:order-1 lg:gap-8'>
          {pair ? (
            <PairBasicInfo pair={pair} />
          ) : (
            <div className='flex flex-col gap-1 lg:gap-2'>
              <div className='flex flex-row items-center gap-2 lg:gap-4 2xl:gap-8'>
                <NewIconGroup
                  classNames={{
                    image: '2xl:size-12',
                  }}
                  logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO}
                  logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO}
                />
                <NewTextHeading className='2xl:text-5xl'>
                  {`${firstAsset?.symbol === 'WBNB' ? 'BNB' : firstAsset?.symbol || ''}/${
                    secondAsset?.symbol === 'WBNB' ? 'BNB' : secondAsset?.symbol || ''
                  }`}
                </NewTextHeading>
              </div>
              <NewTextSubHeading className='lg:text-2xl 2xl:text-3xl'>
                {pairType === PAIR_TYPES.STABLE ? t('Stable') : t('Classic')}
              </NewTextSubHeading>
            </div>
          )}

          <V1Add
            pool={pool}
            pairType={pair?.type}
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            setFirstAddress={setFirstAddress}
            setSecondAddress={setSecondAddress}
            handleBack={handleBack}
          />
        </div>

        {/* Right side */}
        {pool ? (
          <div className='order-1 flex flex-col gap-0 lg:order-2 lg:gap-8'>
            <div className='hidden lg:block'>
              <PoolAttributesSection pair={pair} />
            </div>

            <div className='order-1 lg:order-2'>
              <PoolReserveSection pool={pool} className='hidden lg:block' />

              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={showReserve ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className='block overflow-hidden lg:hidden'
              >
                <PoolReserveSection pool={pool} className='mb-4' />
              </motion.div>
            </div>
          </div>
        ) : (
          <div className='order-1 flex  h-max flex-col gap-3 rounded-md bg-neutral-800 p-4 lg:order-2'>
            <TextHeading className='text-xl'>{t('New Deposit')}</TextHeading>
            <Paragraph>{t('New Deposit description')}</Paragraph>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddLiquidityV1Pool
