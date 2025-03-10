import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { ClassicPoolIcon, CLPoolIcon, InfoNeutralIcon, ScalesIcon, StablePoolIcon } from '@/svgs'

import ChooseTokensSection from './ChooseTokensSection'

function TitleSection({ Icon, text, description }) {
  const [show, setShow] = useState(false)
  const t = useTranslations()

  return (
    <div className='flex flex-col gap-2'>
      <h4 className='flex flex-row items-center gap-2 lg:gap-4 2xl:gap-8'>
        <Icon className='hidden size-5 md:block lg:size-12 2xl:size-16' />
        <NewTextHeading className='text-2xl'>{t(text)}</NewTextHeading>
        <EmphasisButton
          className='ml-auto block w-fit bg-neutral-600 p-2 lg:hidden'
          onClick={() => setShow(prev => !prev)}
        >
          <InfoNeutralIcon className='h-4 w-4' />
        </EmphasisButton>
      </h4>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='w-full overflow-hidden lg:hidden'
      >
        <div className='z-10 flex gap-3 rounded-lg bg-neutral-900 p-4'>
          <p className='text-sm text-neutral-300'>{t(description)}</p>
        </div>
      </motion.div>
    </div>
  )
}

export default function Step2() {
  const t = useTranslations()

  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || PAIR_TYPES.LSD
  const PageTitleSection = useMemo(() => {
    const renderTitle = (Icon, text, description) => <TitleSection Icon={Icon} text={text} description={description} />

    switch (pairType) {
      case PAIR_TYPES.STABLE:
        return renderTitle(StablePoolIcon, 'Stable Pool', 'Stable Desc')

      case PAIR_TYPES.CLASSIC:
        return renderTitle(ClassicPoolIcon, 'Classic Pool', 'Classic Desc')

      case PAIR_TYPES.WEIGHTED:
        return renderTitle(ScalesIcon, 'Weighted Pool', 'Weighted Desc')

      default:
        return renderTitle(CLPoolIcon, 'Concentrated Liquidity', 'Conc Desc')
    }
  }, [pairType])

  const PoolDescriptionSection = useMemo(() => {
    const renderDescription = (title, description) => (
      <div className='hidden h-max flex-col gap-2 rounded-md bg-neutral-900 p-4 lg:flex'>
        <NewTextSubHeading className='hidden !text-xl md:block'>{t(title)}</NewTextSubHeading>
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

      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <ChooseTokensSection pairType={pairType} />

        {PoolDescriptionSection}
      </div>
    </div>
  )
}
