'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import CircleImage from '@/components/image/CircleImage'
import Spinner from '@/components/spinner'
import { Paragraph, TextHeading } from '@/components/typography'
import { SCAN_URLS } from '@/constant'
import { useTokens } from '@/context/tokensContext'
import { formatAmount, goScan } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { ArrowLeftIcon, ExternalIcon } from '@/svgs'

import TokenChart from './TokenChart'
import TokenPairs from './TokenPairs'

export default function TokenDetailPage({ params }) {
  const { address } = params
  const { push } = useRouter()
  const { networkId } = useChainSettings()
  const { tokens, isLoading } = useTokens()
  const t = useTranslations()

  const token = useMemo(
    () => (tokens ? tokens.find(ele => ele.address.includes(address.toLowerCase())) : undefined),
    [tokens, address],
  )

  if (isLoading || !tokens || !token) {
    return (
      <div className='flex w-full items-center'>
        <Spinner />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4'>
          <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => push('/analytics')}>
            {t('Analytics')}
          </TextButton>
          <div className='flex flex-col items-start  justify-between gap-4 lg:flex-row lg:items-end'>
            <div className='flex w-full items-center gap-4'>
              <CircleImage className='h-[48px] w-[48px] lg:h-[56px] lg:w-[56px]' src={token.logoURI} alt='' />
              <div className='flex w-full flex-col gap-0.5 lg:gap-2'>
                <div className='flex items-center justify-between gap-3 lg:justify-start'>
                  <TextHeading className='text-xl leading-normal lg:text-3xl'>{token.symbol}</TextHeading>
                </div>
                <div className='flex w-full justify-between'>
                  <div className='flex items-center gap-0.5'>
                    <Paragraph className='text-sm'>{token.name}</Paragraph>
                  </div>
                  <TextIconButton
                    className='lg:hidden'
                    Icon={ExternalIcon}
                    onClick={() => {
                      goScan(networkId, token.address)
                    }}
                  />
                </div>
              </div>
            </div>
            <div className='flex w-full justify-end gap-2'>
              <TextIconButton
                className='hidden lg:flex'
                Icon={ExternalIcon}
                onClick={() => {
                  window.open(`${SCAN_URLS[networkId]}/address/${token.address}`, '_blank')
                }}
              />
              <SecondaryButton>{t('Add Liquidity')}</SecondaryButton>
              <PrimaryButton>{t('Swap')}</PrimaryButton>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Box className='flex justify-between'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <TextHeading className='text-2xl'>${formatAmount(token.liquidity)}</TextHeading>
              </div>
              <Paragraph>{t('TVL')}</Paragraph>
            </div>
          </Box>
          <Box className='flex justify-between'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <TextHeading className='text-2xl'>${formatAmount(token.volume)}</TextHeading>
              </div>
              <Paragraph>{t('Volume (24h)')}</Paragraph>
            </div>
          </Box>
          <Box className='flex justify-between'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <TextHeading className='text-2xl'>${formatAmount(token.price)}</TextHeading>
              </div>
              <Paragraph>{t('Price')}</Paragraph>
            </div>
          </Box>
        </div>
        <TokenChart token={token} />
        <TokenPairs token={token} />
      </div>
    </div>
  )
}
