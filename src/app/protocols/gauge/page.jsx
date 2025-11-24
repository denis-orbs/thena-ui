'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { Neutral } from '@/components/alert'
import BackButton from '@/components/buttons/BackButton'
import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { usePoolWithoutGauge } from '@/hooks/usePoolWithoutGauge'
import { useGaugeAdd } from '@/hooks/useProtocols'
import useWallet from '@/hooks/useWallet'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import PairModal from '@/modules/PairModal'

export default function GaugePage() {
  const t = useTranslations()

  const [isOpen, setIsOpen] = useState(false)
  const { account } = useWallet()
  const [selected, setSelected] = useState(null)
  const { onGaugeAdd, pending } = useGaugeAdd()
  const poolsWithoutGauge = usePoolWithoutGauge()

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-4'>
        <BackButton href='/protocols' />
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        <div className='flex flex-col gap-4 rounded-xl bg-neutral-900 p-5'>
          <h2>{t('Add Gauge')}</h2>
          <div className='flex flex-col gap-2'>
            <TextHeading>{t('Pair')}</TextHeading>
            <div
              className='flex cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
              onClick={() => setIsOpen(!isOpen)}
            >
              {selected ? (
                <div className='flex items-center gap-3'>
                  <IconGroup
                    className='*:not-first:-ml-2'
                    classNames={{
                      image: 'outline-2 w-8 h-8',
                    }}
                    logo1={selected.token0.logoURI}
                    logo2={selected.token1.logoURI}
                  />
                  <div className='flex items-end gap-2'>
                    <TextHeading>{selected.symbol}</TextHeading>
                    <Paragraph className='text-sm'>{t(selected.title)}</Paragraph>
                  </div>
                </div>
              ) : (
                <p className='text-neutral-400'>{t('Select Pair')}</p>
              )}
              <ChevronDownIcon isRevert={isOpen} />
            </div>
          </div>

          {account ? (
            <PrimaryButton
              disabled={pending}
              onClick={() => {
                onGaugeAdd(selected, () => {
                  setSelected(null)
                })
              }}
            >
              {t('Confirm Gauge')}
            </PrimaryButton>
          ) : (
            <ConnectButton />
          )}
        </div>

        <Neutral className='flex flex-col items-start gap-2'>
          <TextHeading className='text-xl'>{t('What are Gauges')}</TextHeading>
          <Paragraph>{t('Gauges Description')}</Paragraph>
        </Neutral>
      </div>

      <PairModal popup={isOpen} setPopup={setIsOpen} setSelected={setSelected} pools={poolsWithoutGauge} />
    </div>
  )
}
