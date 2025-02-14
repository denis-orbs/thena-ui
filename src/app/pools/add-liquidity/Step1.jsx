import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import SelectorGrid from '@/components/selector/SelectorGrid'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { PoolGroupIcon } from '@/svgs'

export default function Step1({ nextStep }) {
  const t = useTranslations()

  const { replace, back } = useRouter()
  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || null

  const updateSearchParams = useCallback(
    updates => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newPathname = `${window.location.pathname}?${params.toString()}`
      replace(newPathname)
    },
    [replace, searchParams],
  )

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
        <TextHeading className='font-archia text-3xl font-semibold lg:text-[96px]'>
          {t('Chose Liquidity Type')}
        </TextHeading>
      </h4>

      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='flex w-full flex-col gap-3 lg:w-[60%]'>
          <TextHeading>{t('Liquidity Pool Type')}</TextHeading>
          <SelectorGrid classNames={{ item: 'bg-transparent pl-0' }} data={poolTypesData} isGrid={false} />
        </div>
      </div>

      <div className='flex gap-4'>
        <EmphasisButton onClick={() => back()}>{t('Cancel')}</EmphasisButton>
        <PrimaryButton
          onClick={() => {
            nextStep(2)
          }}
        >
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
