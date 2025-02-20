import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import SelectorGrid from '@/components/selector/SelectorGrid'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { PoolGroupIcon } from '@/svgs'

export default function Step1() {
  const t = useTranslations()

  const { back } = useRouter()
  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || null
  const updateSearchParams = useUpdateSearchParams()

  useEffect(() => {
    if (!pairType) {
      updateSearchParams({ pairType: PAIR_TYPES.LSD })
    }
  }, [pairType, updateSearchParams])

  const poolTypesData = useMemo(
    () => [
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Concentrated Liquidity')}</TextHeading>
            <Paragraph className='text-sm'>{t('Conc Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.LSD,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.LSD })
        },
      },
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Weighted')}</TextHeading>
            <Paragraph className='text-sm'>{t('Weighted Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.WEIGHTED,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.WEIGHTED })
        },
      },
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Stable')}</TextHeading>
            <Paragraph className='text-sm'>{t('Stable Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.STABLE,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.STABLE })
        },
      },
      {
        content: (
          <div className='flex flex-1 flex-col gap-1'>
            <TextHeading>{t('Classic')}</TextHeading>
            <Paragraph className='text-sm'>{t('Classic Desc')}</Paragraph>
          </div>
        ),
        active: pairType === PAIR_TYPES.CLASSIC,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.CLASSIC })
        },
      },
    ],
    [pairType, t, updateSearchParams],
  )

  return (
    <div className='space-y-10 lg:space-y-20'>
      <h4 className='flex flex-row items-center gap-3'>
        <PoolGroupIcon className='h-11 w-12 lg:h-[116px] lg:w-[108px]' />
        <NewTextHeading>{t('Choose Liquidity Type')}</NewTextHeading>
      </h4>

      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <div className='flex flex-col gap-3'>
          <NewTextSubHeading>{t('Liquidity Pool Type')}</NewTextSubHeading>
          <SelectorGrid data={poolTypesData} isGrid={false} classNames={{ item: 'bg-transparent' }} />
        </div>
      </div>

      <div className='flex gap-4'>
        <EmphasisButton onClick={() => back()}>{t('Cancel')}</EmphasisButton>
        <PrimaryButton
          onClick={() => {
            updateSearchParams({ step: 2 }, true)
          }}
        >
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
