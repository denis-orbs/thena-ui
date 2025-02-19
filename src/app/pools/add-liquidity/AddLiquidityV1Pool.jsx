import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import V1Add from '@/components/common/AddLiquidity/V1Add'
import IconGroup from '@/components/icongroup'
import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { ClassicPoolIcon, StablePoolIcon } from '@/svgs'

import { PairBasicInfo } from './PairBasicInfo'

function AddLiquidityV1Pool({ pair }) {
  const t = useTranslations()
  const searchParams = useSearchParams()

  const [slippage, setSlippage] = useState(0.5)

  const pairType = pair?.type ?? searchParams.get('pairType')

  const PageTitleSection = useMemo(() => {
    const renderTitle = (Icon, text) => (
      <>
        {pair ? (
          <div className='flex flex-col gap-1 lg:gap-2'>
            <div className='flex flex-row items-center gap-3 lg:gap-4 2xl:gap-8'>
              <IconGroup
                className='-space-x-0'
                classNames={{
                  image: 'size-6 lg:size-10 2xl:size-[86px]',
                }}
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
          <div className='flex flex-row items-center gap-3 lg:gap-4 2xl:gap-8'>
            <Icon className='size-6 lg:size-10 2xl:size-[86px]' />
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
        <div className='flex flex-col gap-4 lg:gap-8'>
          {pair !== null ? (
            <PairBasicInfo pair={pair} />
          ) : (
            <div className='flex flex-col gap-1 lg:gap-2'>
              <div className='flex flex-row items-center gap-3 lg:gap-4 2xl:gap-8'>
                <IconGroup
                  className='-space-x-0'
                  classNames={{
                    image: 'size-6 lg:size-12',
                  }}
                  logo1={pair?.token0?.logoURI ?? UNKNOWN_LOGO}
                  logo2={pair?.token1?.logoURI ?? UNKNOWN_LOGO}
                />
                <NewTextHeading className='2xl:text-5xl'>
                  {`${pair?.token0?.symbol === 'WBNB' ? 'BNB' : pair?.token0?.symbol}/${
                    pair?.token1?.symbol === 'WBNB' ? 'BNB' : pair?.token1?.symbol
                  }`}
                </NewTextHeading>
              </div>
              <NewTextSubHeading className='lg:text-2xl 2xl:text-3xl'>
                {pairType === PAIR_TYPES.STABLE ? t('Stable') : t('Classic Pool')}
              </NewTextSubHeading>
            </div>
          )}

          <V1Add
            pool={(pair?.subpools ?? []).find(item => item.version === 3)}
            pairType={pair?.type}
            firstAsset={useGetAsset(pair?.token0?.address)}
            secondAsset={useGetAsset(pair?.token1?.address)}
            slippage={slippage}
            setSlippage={setSlippage}
          />
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityV1Pool
