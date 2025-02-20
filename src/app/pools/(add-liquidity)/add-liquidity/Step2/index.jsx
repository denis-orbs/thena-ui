import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { ClassicPoolIcon, CLPoolIcon, ScalesIcon, StablePoolIcon } from '@/svgs'

import ChooseTokensSection from './ChooseTokensSection'

export default function Step2() {
  const t = useTranslations()

  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || PAIR_TYPES.LSD

  const PageTitleSection = useMemo(() => {
    const renderTitle = (Icon, text) => (
      <h4 className='flex flex-row items-center gap-3 lg:gap-4 2xl:gap-8'>
        <Icon className='size-6 lg:size-10 2xl:size-[86px]' />
        <NewTextHeading>{t(text)}</NewTextHeading>
      </h4>
    )

    switch (pairType) {
      case PAIR_TYPES.STABLE:
        return renderTitle(StablePoolIcon, 'Stable Pool')

      case PAIR_TYPES.CLASSIC:
        return renderTitle(ClassicPoolIcon, 'Classic Pool')

      case PAIR_TYPES.WEIGHTED:
        return renderTitle(ScalesIcon, 'Weighted Pool')

      default:
        return renderTitle(CLPoolIcon, 'Concentrated Liquidity')
    }
  }, [pairType, t])

  const PoolDescriptionSection = useMemo(() => {
    const renderDescription = (title, description) => (
      <div className='flex h-max flex-col gap-2 rounded-md bg-neutral-900 p-3 lg:p-4'>
        <NewTextSubHeading className='!text-xl'>{t(title)}</NewTextSubHeading>
        <p className='text-neutral-400'>{t(description)}</p>
      </div>
    )

    switch (pairType) {
      case PAIR_TYPES.STABLE:
        return renderDescription('Stable', 'Stable Desc')

      case PAIR_TYPES.CLASSIC:
        return renderDescription('Classic', 'Classic Desc')

      case PAIR_TYPES.WEIGHTED:
        return renderDescription('Weighted', 'Weighted Desc')

      default:
        return renderDescription('Conc Liquidity', 'Conc Desc')
    }
  }, [pairType, t])

  return (
    <div className='space-y-6 lg:space-y-12 2xl:space-y-16'>
      {PageTitleSection}

      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <ChooseTokensSection pairType={pairType} />

        {PoolDescriptionSection}
      </div>
    </div>
  )
}
