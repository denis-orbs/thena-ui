'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { Neutral } from '@/components/alert'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { usePoolWithoutGauge } from '@/hooks/usePoolWithoutGauge'
import { useGaugeAdd } from '@/hooks/useProtocols'
import useWallet from '@/hooks/useWallet'
import { cn } from '@/lib/utils'
import PairModal from '@/modules/PairModal'
import { ArrowLeftIcon, ChevronDownIcon } from '@/svgs'

export default function GaugePage() {
  const t = useTranslations()

  const [isOpen, setIsOpen] = useState(false)
  const { push } = useRouter()
  const { account } = useWallet()
  const [selected, setSelected] = useState(null)
  const { onGaugeAdd, pending } = useGaugeAdd()
  const poolsWithoutGauge = usePoolWithoutGauge()
  const { pairs = [] } = usePairs()

  const weightedPoolWithoutGauge = useMemo(
    () => pairs.filter(p => p && p.type === PAIR_TYPES.WEIGHTED && p.gauge.address === zeroAddress),
    [pairs],
  )

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-4'>
        <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => push('/protocols')}>
          {t('Back')}
        </TextButton>
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
                  {selected.type === PAIR_TYPES.WEIGHTED ? (
                    <ThreeIconGroup
                      className='*:not-first:-ml-2'
                      classNames={{
                        image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                      }}
                      logo1={selected?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                      logo2={selected?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                      extendNumber={(selected?.tokens?.length || 2) - 2}
                    />
                  ) : (
                    <IconGroup
                      className='*:not-first:-ml-2'
                      classNames={{
                        image: 'outline-2 w-8 h-8',
                      }}
                      logo1={selected.token0.logoURI}
                      logo2={selected.token1.logoURI}
                    />
                  )}
                  <div className='flex items-end gap-2'>
                    <TextHeading>{selected.symbol}</TextHeading>
                    <Paragraph className='text-sm'>{t(selected.title)}</Paragraph>
                  </div>
                </div>
              ) : (
                <p className='text-neutral-400'>{t('Select Pair')}</p>
              )}
              <ChevronDownIcon
                className={cn(
                  'transfrom h-5 w-5 transition-all duration-150 ease-out',
                  isOpen ? 'rotate-180' : 'rotate-0',
                )}
              />
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

      <PairModal
        popup={isOpen}
        setPopup={setIsOpen}
        setSelected={setSelected}
        pools={poolsWithoutGauge.concat(weightedPoolWithoutGauge)}
      />
    </div>
  )
}
