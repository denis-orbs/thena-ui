'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import Selector from '@/components/selector'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { warnToast } from '@/lib/notify'
import { cn } from '@/lib/utils'
import TokenModal from '@/modules/TokenModal'
import { ChevronDownIcon } from '@/svgs'

export default function SelectPair({
  fromAsset,
  setFromAddress,
  toAsset,
  setToAddress,
  pairType,
  setPairType,
  setCurrentStep,
  isModal,
}) {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [isFirstSelected, setIsFirstSelected] = useState(false)
  const t = useTranslations()

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
          setPairType(PAIR_TYPES.LSD)
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
          setPairType(PAIR_TYPES.STABLE)
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
          setPairType(PAIR_TYPES.CLASSIC)
        },
      },
    ],
    [pairType, setPairType, t],
  )

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-2'>
          <TextHeading>{t('Select Pair')}</TextHeading>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              classNames={{
                input: 'cursor-pointer caret-transparent',
              }}
              type='text'
              onClick={() => {
                setIsFirstSelected(true)
                setIsTokenModalOpen(true)
              }}
              LeadingIcon={
                fromAsset ? <CircleImage src={fromAsset.logoURI} alt='thena token logo' width={20} height={20} /> : null
              }
              TrailingIcon={<ChevronDownIcon className={cn(isTokenModalOpen && 'rotate-180')} />}
              placeholder={fromAsset?.symbol || t('Select Asset')}
              readOnly
            />
            <Input
              classNames={{
                input: 'cursor-pointer caret-transparent',
              }}
              type='text'
              onClick={() => {
                setIsFirstSelected(false)
                setIsTokenModalOpen(true)
              }}
              LeadingIcon={
                toAsset ? <CircleImage src={toAsset.logoURI} alt='thena token logo' width={20} height={20} /> : null
              }
              TrailingIcon={<ChevronDownIcon className={cn(isTokenModalOpen && 'rotate-180')} />}
              placeholder={toAsset?.symbol || t('Select Asset')}
              readOnly
            />
          </div>
        </div>
        <div className='flex flex-col gap-3'>
          <TextHeading>{t('Pool Type')}</TextHeading>
          <Selector data={poolTypesData} />
        </div>
      </div>
      <div className={cn('mt-auto inline-flex w-full flex-col', isModal && 'px-3 pt-3 lg:px-6')}>
        <EmphasisButton
          onClick={() => {
            if (!fromAsset || !toAsset) {
              warnToast('Select Asset')
              return
            }
            setCurrentStep(1)
          }}
        >
          {t('Continue')}
        </EmphasisButton>
      </div>
      <TokenModal
        popup={isTokenModalOpen}
        setPopup={setIsTokenModalOpen}
        selectedAsset={isFirstSelected ? fromAsset : toAsset}
        setSelectedAsset={item => {
          if (isFirstSelected) {
            setFromAddress(item.address)
          } else {
            setToAddress(item.address)
          }
        }}
        otherAsset={isFirstSelected ? toAsset : fromAsset}
        setOtherAsset={item => {
          if (isFirstSelected) {
            setToAddress(item.address)
          } else {
            setFromAddress(item.address)
          }
        }}
      />
    </>
  )
}
