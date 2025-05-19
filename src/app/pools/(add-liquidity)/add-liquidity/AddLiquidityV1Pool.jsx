import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

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

  const [firstAddress, setFirstAddress] = useState(pair?.token0?.address)
  const [secondAddress, setSecondAddress] = useState(pair?.token1?.address)
  const [showReserve, setShowReserve] = useState(false)

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
    const renderTitle = text => (
      <>
        {pair ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-row items-center gap-2 xl:gap-8'>
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
              <NewTextSubHeading className='text-xl md:text-2xl 2xl:text-3xl'>{t(text)}</NewTextSubHeading>
              <div className='flex items-center xl:hidden'>
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
          </div>
        ) : (
          <div className='flex flex-col'>
            <div className='flex flex-row items-center gap-2 xl:gap-8'>
              <NewIconGroup
                classNames={{
                  image: 'xl:size-12',
                }}
                logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO}
                logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO}
              />
              <NewTextHeading className='md:text-4xl 2xl:text-5xl'>
                {`${firstAsset?.symbol === 'WBNB' ? 'BNB' : firstAsset?.symbol || ''}/${
                  secondAsset?.symbol === 'WBNB' ? 'BNB' : secondAsset?.symbol || ''
                }`}
              </NewTextHeading>
            </div>

            <NewTextSubHeading className='text-xl md:text-2xl 2xl:text-3xl'>{t(text)}</NewTextSubHeading>
          </div>
        )}
      </>
    )

    switch (pairType) {
      case PAIR_TYPES.STABLE:
        return renderTitle('Stable')

      default:
        return renderTitle('Classic')
    }
  }, [
    pairType,
    pair,
    t,
    showReserve,
    firstAsset?.logoURI,
    firstAsset?.symbol,
    secondAsset?.logoURI,
    secondAsset?.symbol,
  ])

  return (
    <div className='flex flex-col'>
      {PageTitleSection}

      <div className='grid xl:grid-cols-add-liquidity-layout xl:gap-4'>
        {/* Left side */}
        <div className='order-2 mt-4 flex flex-col gap-4 xl:order-1 xl:mt-8'>
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
            pairType={pair?.type}
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            setFirstAddress={setFirstAddress}
            setSecondAddress={setSecondAddress}
            handleBack={handleBack}
          />
        </div>

        {/* Right side */}
        <div className='order-1 mt-4 flex-col gap-2 md:gap-4 xl:mt-8 xl:flex'>
          {!pair && (
            <div className='hidden h-max flex-col gap-2 rounded-md bg-neutral-800 p-4 xl:flex'>
              <NewTextSubHeading className='!text-xl'>{t('New Deposit')}</NewTextSubHeading>
              <Paragraph>{t('New Deposit description')}</Paragraph>
            </div>
          )}

          {pool && (
            <div className='flex flex-col gap-0 xl:order-2 xl:gap-2'>
              <div className='hidden xl:block'>
                <PoolAttributesSection pair={pair} />
              </div>

              <div className='order-1 xl:order-2'>
                <PoolReserveSection pool={pool} className='hidden xl:block' />

                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={showReserve ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  <PoolReserveSection pool={pool} className='mt-4 block xl:hidden' />
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
