import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import V1Add from '@/components/common/AddLiquidity/V1Add'
import Divider from '@/components/divider'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { formatAmount, unwrappedSymbol } from '@/lib/utils'
import { ClassicPoolIcon, StablePoolIcon } from '@/svgs'

import { PairBasicInfo } from './PairBasicInfo'
import { PoolAttributesSection } from './PoolAttributesSection'

function AddLiquidityV1Pool({ pair }) {
  const t = useTranslations()
  const searchParams = useSearchParams()

  const pairType = pair?.type ?? searchParams.get('pairType')

  const [firstAddress, setFirstAddress] = useState(pair?.token0?.address)
  const [secondAddress, setSecondAddress] = useState(pair?.token1?.address)

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
          <div className='flex flex-col gap-1 lg:gap-2'>
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
            <NewTextSubHeading className='lg:text-2xl 2xl:text-3xl'>{t(text.split(' ')[0])}</NewTextSubHeading>
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
  }, [pairType, pair, t])

  return (
    <div className='flex flex-col gap-8 lg:gap-10 2xl:gap-16'>
      {PageTitleSection}

      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        {/* Left side */}
        <div className='flex flex-col gap-4 lg:gap-8'>
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
                {pairType === PAIR_TYPES.STABLE ? t('Stable') : t('Classic Pool')}
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
          />
        </div>

        {/* Right side */}
        {pool ? (
          <div className='flex flex-col gap-4 lg:gap-8'>
            <PoolAttributesSection pair={pair} />

            <div className='flex flex-col gap-4 rounded-md bg-neutral-800 p-4'>
              <div className='flex flex-col gap-4'>
                <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>
                      {unwrappedSymbol(pool.token0)} {t('Amount')}
                    </Paragraph>
                    <Paragraph>{formatAmount(pool.token0.reserve)}</Paragraph>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>
                      {unwrappedSymbol(pool.token1)} {t('Amount')}
                    </Paragraph>
                    <Paragraph>{formatAmount(pool.token1.reserve)}</Paragraph>
                  </div>
                </div>
              </div>
              <Divider />
              <div className='flex flex-col gap-4'>
                <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                    <Paragraph>{formatAmount(pool.account.totalLp)} LP</Paragraph>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                    <Paragraph>{formatAmount(pool.account.gaugeBalance)} LP</Paragraph>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex h-max flex-col gap-3 rounded-md bg-neutral-800 p-4'>
            <TextHeading className='text-xl'>{t('New Deposit')}</TextHeading>
            <Paragraph>{t('New Deposit description')}</Paragraph>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddLiquidityV1Pool
