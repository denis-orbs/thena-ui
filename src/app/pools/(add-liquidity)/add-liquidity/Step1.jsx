import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { SelectorPoolTypeLarge, SelectorPoolTypeMini } from '@/components/selector/SelectorMobile'
import { NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { cn } from '@/lib/utils'
import { InfoNeutralIcon, PoolGroupIcon } from '@/svgs'

function ContentTypeOptionMini({ heading, desc, active }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  return (
    <>
      <div className='flex gap-2 lg:hidden'>
        <div
          className={cn(
            'flex flex-1 gap-2 rounded-xl p-2 hover:bg-neutral-800',
            !show && 'items-center',
            active && 'bg-primary-950/60 hover:bg-primary-950/60',
          )}
        >
          {active ? (
            <div className='size-5 rounded-full bg-primary-600 p-1.5'>
              <div className='h-2 w-2 rounded-full bg-white' />
            </div>
          ) : (
            <div className='size-5 rounded-full border border-neutral-600' />
          )}
          <div className={cn('flex flex-1 flex-col')}>
            <TextHeading className='!text-sm font-normal !leading-5 text-neutral-300'>{t(heading)}</TextHeading>
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn('overflow-hidden lg:hidden')}
            >
              <Paragraph className='mt-1 text-sm font-normal text-neutral-500'>{t(desc)}</Paragraph>
            </motion.div>
          </div>
        </div>
        <EmphasisButton
          className={cn(
            'ml-auto flex !size-9 items-center justify-center p-2 outline-0 hover:bg-neutral-900',
            show ? 'bg-neutral-600' : 'bg-neutral-900',
          )}
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            setShow(prev => !prev)
          }}
        >
          <InfoNeutralIcon className={cn('size-4', show ? 'stroke-neutral-200' : 'stroke-neutral-400')} />
        </EmphasisButton>
      </div>
    </>
  )
}

export default function Step1() {
  const t = useTranslations()

  const { push } = useRouter()
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
          <>
            <ContentTypeOptionMini
              active={pairType === PAIR_TYPES.LSD}
              heading='Concentrated Liquidity'
              desc='Conc Desc'
            />

            <div className='hidden flex-1 flex-col gap-1 lg:flex'>
              <TextHeading className='text-sm lg:text-base'>{t('Concentrated Liquidity')}</TextHeading>
            </div>
          </>
        ),
        active: pairType === PAIR_TYPES.LSD,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.LSD })
        },
      },
      {
        content: (
          <>
            <ContentTypeOptionMini active={pairType === PAIR_TYPES.WEIGHTED} heading='Weighted' desc='Weighted Desc' />

            <div className='hidden flex-1 flex-col gap-1 lg:flex'>
              <TextHeading className='text-sm lg:text-base'>{t('Weighted')}</TextHeading>
            </div>
          </>
        ),
        active: pairType === PAIR_TYPES.WEIGHTED,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.WEIGHTED })
        },
      },
      {
        content: (
          <>
            <ContentTypeOptionMini active={pairType === PAIR_TYPES.STABLE} heading='Stable' desc='Stable Desc' />

            <div className='hidden flex-1 flex-col gap-1 lg:flex'>
              <TextHeading className='text-sm lg:text-base'>{t('Stable')}</TextHeading>
            </div>
          </>
        ),
        active: pairType === PAIR_TYPES.STABLE,
        onClickHandler: () => {
          updateSearchParams({ pairType: PAIR_TYPES.STABLE })
        },
      },
      {
        content: (
          <>
            <ContentTypeOptionMini active={pairType === PAIR_TYPES.CLASSIC} heading='Classic' desc='Classic Desc' />

            <div className='hidden flex-1 flex-col gap-1 lg:flex'>
              <TextHeading className='text-sm lg:text-base'>{t('Classic')}</TextHeading>
            </div>
          </>
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
    <div className='space-y-4 max-lg:-mx-2 max-lg:-mb-4 max-lg:-mt-2.5 max-lg:min-h-[calc(100vh-128px)] lg:space-y-6'>
      <h4 className='flex flex-row items-center gap-2 lg:gap-4 xl:gap-8'>
        <PoolGroupIcon className='h-9 w-9 lg:h-12 lg:w-20' />
        <NewTextHeading className='max-lg:text-xl'>{t('Choose Liquidity Type')}</NewTextHeading>
      </h4>

      <div className='flex h-full gap-4'>
        <div className='flex h-full w-full flex-col gap-8 max-lg:min-h-[calc(100vh-180px)] lg:w-1/2'>
          <div className='lg:hidden'>
            <SelectorPoolTypeMini data={poolTypesData} />
          </div>

          <div className='max-lg:hidden'>
            <SelectorPoolTypeLarge data={poolTypesData} isGrid={false} />
          </div>

          <div className='mt-auto flex flex-col items-end justify-end gap-2'>
            <EmphasisButton className='w-full lg:hidden' onClick={() => push('/pools')}>
              {t('Cancel')}
            </EmphasisButton>
            <EmphasisButton
              className='w-full max-lg:bg-primary-600'
              onClick={() => updateSearchParams({ step: 2 }, true)}
            >
              {t('Next')}
            </EmphasisButton>
          </div>
        </div>
        <div className='w-1/2 space-y-2 rounded-lg bg-neutral-900 p-4 max-lg:hidden'>
          <div className='flex flex-col gap-1'>
            <TextHeading className='leading-5'>{t('Concentrated Liquidity')}</TextHeading>
            <Paragraph className='!text-sm font-normal'>{t('Conc Desc')}</Paragraph>
          </div>
          <div className='flex flex-col gap-1'>
            <TextHeading className='text-base leading-5'>{t('Weighted')}</TextHeading>
            <Paragraph className='!text-sm font-normal'>{t('Weighted Desc')}</Paragraph>
          </div>
          <div className='flex flex-col gap-1'>
            <TextHeading className='text-base leading-5'>{t('Stable')}</TextHeading>
            <Paragraph className='!text-sm font-normal'>{t('Stable Desc new')}</Paragraph>
          </div>
          <div className='flex flex-col gap-1'>
            <TextHeading className='text-base leading-5'>{t('Classic')}</TextHeading>
            <Paragraph className='!text-sm font-normal'>{t('Classic Desc')}</Paragraph>
          </div>
        </div>
      </div>
    </div>
  )
}
