import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'
import { ArrowLeftIcon, EditIcon } from '@/svgs'

function TokenAndInitialSeedItem({ item }) {
  const t = useTranslations()
  return (
    <div className='flex flex-row justify-between p-2'>
      <div className='flex flex-row items-center gap-[10px]'>
        <Image width={28} height={28} className='rounded-full' src={item.token.logoURI} />
        <div className='flex flex-col gap-1'>
          <span>
            {item.token.symbol} <span className='text-neutral-400'>({item.allocate}%)</span>
          </span>
          <Paragraph>
            {t('Initial weight')}: {item.allocate}
          </Paragraph>
        </div>
      </div>
      <div className='flex flex-col'>
        <TextHeading>{item.amount}</TextHeading>
        <TextSubHeading>${formatAmount(item.amount * (item.token?.price || 0))}</TextSubHeading>
      </div>
    </div>
  )
}

function PoolDetails(/* { item } */) {
  const t = useTranslations()
  const [poolFee, setPoolFee] = useState()
  const poolRange = useMemo(
    () => [
      {
        label: '0,1%',
        active: poolFee === 0.1,
        onClickHandler: () => setPoolFee(0.1),
      },
      {
        label: '0,3%',
        active: poolFee === 0.3,
        onClickHandler: () => setPoolFee(0.3),
      },
      {
        label: '1,00%',
        active: poolFee === 1.0,
        onClickHandler: () => setPoolFee(1.0),
      },
    ],
    [poolFee],
  )
  return (
    <div>
      <div className='flex  flex-col gap-6'>
        <div className='flex flex-col gap-3'>
          <label>{t('Pool Symbol')}</label>
          <Input val='TWP-THE1-BNB1-USDT1-ETH1' />
        </div>
        <div className='flex flex-col gap-3'>
          <label>{t('Pool Name')}</label>
          <Input val='TWP-THE1-BNB1-USDT1-ETH1' />
        </div>
        <div className='flex flex-col'>
          <TextHeading>{t('Pool Fee')}</TextHeading>
          <Paragraph>{t('Set Pool Fees description')}</Paragraph>
          <div className='mt-4 flex flex-row justify-between'>
            <Selection className='!h-11' data={poolRange} />
            <Input className='h-11 w-[112px]' placeholder='Custom' suffix='%' classNames={{ input: 'pr-7' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Preview({ tokensAndWeights, setCurrentStep }) {
  const t = useTranslations()
  const [showPreview, setShowPreview] = useState(false)
  const total = 40000
  return (
    <Box className='flex flex-col gap-3'>
      <div className='flex h-11 flex-row'>
        <TextButton onClick={() => setCurrentStep(prev => prev - 1)} LeadingIcon={ArrowLeftIcon} />
        <TextHeading className='font-archia text-3xl'>{t('Preview New Weighted Pool')}</TextHeading>
      </div>
      <TextHeading>{t('Tokens and Initial Seed Liquidity')}</TextHeading>
      <div className='flex flex-col divide-y divide-neutral-700'>
        {tokensAndWeights.map(item => (
          <TokenAndInitialSeedItem item={item} />
        ))}
        <div className='flex flex-row justify-between pt-4'>
          <TextHeading>{t('Total')}</TextHeading>
          <TextHeading>${formatAmount(total)}</TextHeading>
        </div>
      </div>
      <div className='mb-6 flex flex-col gap-2 rounded-xl bg-neutral-800 p-4'>
        <TextHeading className='mb-4'>{t('Summary')}</TextHeading>
        <div className='flex flex-row items-center justify-between'>
          <Paragraph>{t('Pool Symbol')}:</Paragraph>
          <div className='flex flex-row items-center rounded-full bg-neutral-600 p-1'>
            <span>TWP-THE1-BNB1-USDT1-ETH1</span>
            <TextButton LeadingIcon={EditIcon} />
          </div>
        </div>
        <div className='flex flex-row items-center justify-between'>
          <Paragraph>{t('Pool Name')}:</Paragraph>
          <div className='flex flex-row items-center rounded-full bg-neutral-600 p-1'>
            <span>TWP-THE1-BNB1-USDT1-ETH1</span>
            <TextButton LeadingIcon={EditIcon} />
          </div>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Pool Type')}:</Paragraph>
          <Paragraph>Weighted</Paragraph>
        </div>
        <div className='flex flex-row items-center justify-between'>
          <Paragraph>{t('Pool Fee')}:</Paragraph>
          <div className='flex flex-row items-center gap-2'>
            <Paragraph>0,3%</Paragraph>
            <TextButton LeadingIcon={EditIcon} />
          </div>
        </div>
      </div>
      <PrimaryButton className='w-full' onClick={() => setShowPreview(true)}>
        {t('Confirm')}
      </PrimaryButton>
      <Modal
        isOpen={showPreview}
        closeModal={() => setShowPreview(false)}
        showIconX
        width={508}
        title={t('Pool Details')}
      >
        <ModalBody>
          <PoolDetails />
        </ModalBody>
        <ModalFooter>
          <div className='grid w-full grid-cols-2 justify-between gap-4'>
            <EmphasisButton onClick={() => setShowPreview(false)}>{t('Cancel')}</EmphasisButton>
            <PrimaryButton>{t('Save changes')}</PrimaryButton>
          </div>
        </ModalFooter>
      </Modal>
    </Box>
  )
}
