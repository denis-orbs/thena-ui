import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { ArrowLeftIcon, EditIcon } from '@/svgs'

export function TokenAndInitialSeedItem({ item }) {
  const t = useTranslations()
  return (
    <div className='flex flex-row justify-between p-2'>
      <div className='flex flex-row items-center gap-[10px]'>
        <Image width={28} height={28} className='rounded-full' src={item.token.logoURI || UNKNOWN_LOGO} />
        <div className='flex flex-col gap-1'>
          <span>
            {item.token.symbol} <span className='text-neutral-400'>({item.allocate}%)</span>
          </span>
          <Paragraph>
            {t('Initial weight')}: {item.allocate}%
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

function PoolDetails({ poolSymbol, setPoolSymbol, poolName, setPoolName, poolFee, setPoolFee, openModal, isOpen }) {
  const t = useTranslations()

  const [fee, setFee] = useState(poolFee)
  const [symbol, setSymbol] = useState(poolSymbol)
  const [name, setName] = useState(poolName)

  const isCustomFee = useMemo(() => poolFee !== null && poolFee !== 0.1 && poolFee !== 0.3 && poolFee !== 1, [poolFee])
  const poolRange = useMemo(
    () => [
      {
        label: '0,1%',
        active: fee === 0.1,
        onClickHandler: () => setFee(0.1),
      },
      {
        label: '0,3%',
        active: fee === 0.3,
        onClickHandler: () => setFee(0.3),
      },
      {
        label: '1,00%',
        active: fee === 1.0,
        onClickHandler: () => setFee(1.0),
      },
    ],
    [fee],
  )

  const handleSave = useCallback(() => {
    setPoolSymbol(symbol)
    setPoolFee(fee)
    setPoolName(name)
  }, [fee, name, setPoolFee, setPoolName, setPoolSymbol, symbol])

  return (
    <Modal isOpen={isOpen} closeModal={() => openModal(false)} showIconX width={508} title={t('Pool Details')}>
      <ModalBody>
        <div>
          <div className='flex  flex-col gap-6'>
            <div className='flex flex-col gap-3'>
              <label>{t('Pool Symbol')}</label>
              <Input type='text' val={symbol} onChange={e => setSymbol(e.target.value)} />
            </div>
            <div className='flex flex-col gap-3'>
              <label>{t('Pool Name')}</label>
              <Input type='text' val={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className='flex flex-col'>
              <TextHeading>{t('Pool Fee')}</TextHeading>
              <Paragraph>{t('Set Pool Fees description')}</Paragraph>
              <div className='mt-4 flex flex-row justify-between'>
                <Selection className='!h-11' data={poolRange} />
                <Input
                  type='number'
                  val={fee}
                  onChange={e => {
                    setFee(e.target.value)
                  }}
                  className={cn('h-11 w-[112px]', isCustomFee ? 'bg-neutral-700 font-medium text-neutral-200' : '')}
                  placeholder='Custom'
                  suffix='%'
                  classNames={{ input: 'pr-7' }}
                />
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className='grid w-full grid-cols-2 justify-between gap-4'>
          <EmphasisButton onClick={() => openModal(false)}>{t('Cancel')}</EmphasisButton>
          <PrimaryButton onClick={handleSave}>{t('Save changes')}</PrimaryButton>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default function Preview({ tokensAndWeights, setCurrentStep, fees, setFees, initialPoolSymbol }) {
  const t = useTranslations()
  const [showPreview, setShowPreview] = useState(false)
  const [poolSymbol, setPoolSymbol] = useState(initialPoolSymbol)
  const [poolName, setPoolName] = useState(initialPoolSymbol)
  const total = tokensAndWeights.reduce((sum, curr) => sum + curr.token.price, 0)
  const [editStates, setEditStates] = useState({
    editSymbol: false,
    editName: false,
    editFee: false,
  })

  const toggleEdit = type => {
    setEditStates(prevStates => ({
      ...prevStates,
      [type]: !prevStates[type],
    }))
  }
  return (
    <Box className='flex flex-col gap-3'>
      <div className='flex h-11 flex-row'>
        <TextButton onClick={() => setCurrentStep(prev => prev - 1)} LeadingIcon={ArrowLeftIcon} />
        <TextHeading className='font-archia text-3xl font-semibold'>{t('Preview New Weighted Pool')}</TextHeading>
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
          <div className='flex flex-row items-center rounded-full bg-neutral-600 px-2 py-1'>
            <span className={editStates.editSymbol ? 'hidden' : ''}>{poolSymbol}</span>
            {editStates.editSymbol && (
              <Input
                type='text'
                val={poolSymbol}
                classNames={{ input: 'bg-transparent border-none' }}
                onChange={e => {
                  setPoolSymbol(e.target.value)
                }}
                onBlur={() => toggleEdit('editSymbol')}
                className={cn('border-none bg-transparent', editStates.editSymbol ? '' : 'hidden')}
                autoFocus
              />
            )}
            <TextButton
              className={editStates.editSymbol ? 'hidden' : ''}
              LeadingIcon={EditIcon}
              onClick={() => toggleEdit('editSymbol')}
            />
          </div>
        </div>
        <div className='flex flex-row items-center justify-between'>
          <Paragraph>{t('Pool Name')}:</Paragraph>
          <div className='flex flex-row items-center rounded-full bg-neutral-600 px-2 py-1'>
            <span className={editStates.editName ? 'hidden' : ''}>{poolName}</span>
            {editStates.editName && (
              <Input
                type='text'
                val={poolName}
                classNames={{ input: 'bg-transparent border-none' }}
                onChange={e => {
                  setPoolName(e.target.value)
                }}
                onBlur={() => toggleEdit('editName')}
                className={cn('border-none bg-transparent', editStates.editName ? '' : 'hidden')}
                autoFocus
              />
            )}
            <TextButton
              className={editStates.editName ? 'hidden' : ''}
              LeadingIcon={EditIcon}
              onClick={() => toggleEdit('editName')}
            />
          </div>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Pool Type')}:</Paragraph>
          <Paragraph>Weighted</Paragraph>
        </div>
        <div className='flex flex-row items-center justify-between'>
          <Paragraph>{t('Pool Fee')}:</Paragraph>
          <div className='flex flex-row items-center gap-2'>
            {/* <Paragraph>{fees}%</Paragraph>
            <TextButton LeadingIcon={EditIcon} onClick={() => toggleEdit('editFee')} /> */}
            <span className={editStates.editFee ? 'hidden' : ''}>{fees}</span>
            {editStates.editFee && (
              <Input
                type='number'
                val={fees}
                classNames={{ input: 'border-none' }}
                onChange={e => {
                  setFees(e.target.value)
                }}
                onBlur={() => toggleEdit('editFee')}
                className={cn('border-none', editStates.editFee ? '' : 'hidden')}
                autoFocus
              />
            )}
            <TextButton
              className={editStates.editFee ? 'hidden' : ''}
              LeadingIcon={EditIcon}
              onClick={() => toggleEdit('editFee')}
            />
          </div>
        </div>
      </div>
      <PrimaryButton className='w-full' onClick={() => setShowPreview(true)}>
        {t('Confirm')}
      </PrimaryButton>
      <PoolDetails
        poolSymbol={poolSymbol}
        setPoolSymbol={setPoolSymbol}
        poolName={poolName}
        setPoolFee={setFees}
        poolFee={fees}
        setPoolName={setPoolName}
        isOpen={showPreview}
        openModal={() => setShowPreview(false)}
      />
    </Box>
  )
}
