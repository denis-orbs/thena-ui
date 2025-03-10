import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { ClassicPoolIcon, CLPoolIcon, ScalesIcon, StablePoolIcon } from '@/svgs'

import ChooseTokensSection from './ChooseTokensSection'

export default function Step2() {
  const t = useTranslations()

  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || PAIR_TYPES.LSD

  const PageTitleSection = useMemo(() => {
    const renderTitle = (Icon, text) => (
      <h4 className='flex flex-row items-center gap-2 lg:gap-4 2xl:gap-8'>
        <Icon className='hidden size-5 md:block lg:size-12 2xl:size-16' />
        <NewTextHeading className='text-2xl'>{t(text)}</NewTextHeading>
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
      <div className='flex h-max flex-col gap-2 rounded-md bg-neutral-900 p-4'>
        <NewTextSubHeading className='hidden !text-xl lg:block'>{t(title)}</NewTextSubHeading>
        <Paragraph className='text-sm text-neutral-300 md:text-base'>{t(description)}</Paragraph>
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

      <div className='grid gap-4 max-md:!mt-2 lg:grid-cols-add-liquidity-layout'>
        <div className='order-2 lg:order-1'>
          <ChooseTokensSection pairType={pairType} />
        </div>

        <div className='order-1 lg:order-2'>{PoolDescriptionSection}</div>
      </div>
    </div>
  )
}
