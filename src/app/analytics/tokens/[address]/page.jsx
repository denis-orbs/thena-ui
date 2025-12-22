'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import CircleImage from '@/components/image/CircleImage'
import Modal from '@/components/modal'
import Spinner from '@/components/spinner'
import { Paragraph, TextHeading } from '@/components/typography'
import { SCAN_URLS } from '@/constant'
import { CHAIN_ID } from '@/constant/contracts'
import { useTokens } from '@/context/tokensContext'
import { useBackURL } from '@/hooks/useBackURL'
import { useChainSettings } from '@/state/settings/hooks'
import { formatAmount, goScan } from '@/utils/utils'

import ExternalIcon from '~/svgs/external.svg'

import TokenChart from './TokenChart'
import TokenPairs from './TokenPairs'

export default function TokenDetailPage({ params }) {
  const { address } = params
  const { networkId } = useChainSettings()
  const { tokens, isLoading } = useTokens()
  const t = useTranslations()
  const { push } = useRouter()
  const backUrl = useBackURL()
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)

  const token = useMemo(
    () => (tokens ? tokens.find(ele => ele.address.includes(address.toLowerCase())) : undefined),
    [tokens, address],
  )

  // Map networkId to chain name for creditLink
  const chainName = useMemo(() => {
    if (networkId === CHAIN_ID.BSC) return 'BSC'
    if (networkId === CHAIN_ID.OPBNB) return 'OPBNB'
    return 'BSC' // default to BSC
  }, [networkId])

  // Generate creditLink URL
  const analyticsUrl = useMemo(() => {
    if (!token) return ''
    const urlParams = new URLSearchParams({
      chain: chainName,
      address: token.address,
      model: 'dark',
      platform: 'thena.fi',
    })
    return `https://app.creditlink.info/tokenAnalyse?${urlParams.toString()}`
  }, [token, chainName])

  if (isLoading || !tokens || !token) {
    return (
      <div className='flex w-full items-center'>
        <Spinner />
      </div>
    )
  }

  return (
    <LayoutWithBackButton backUrl={backUrl}>
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end'>
              <div className='flex h-16 w-full items-center gap-6'>
                <CircleImage className='h-[48px] w-[48px]' src={token.logoURI} alt='' />
                <div className='flex w-full flex-col gap-0.5 xl:gap-1'>
                  <div className='flex items-center justify-between gap-3 lg:justify-start'>
                    <TextHeading className='text-xl leading-normal xl:text-4xl xl:leading-10'>
                      {token.symbol}
                    </TextHeading>
                    <TextIconButton
                      className='hidden lg:flex'
                      Icon={ExternalIcon}
                      onClick={() => {
                        window.open(`${SCAN_URLS[networkId]}/address/${token.address}`, '_blank')
                      }}
                    />
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
                {/* <TextIconButton
                  className='hidden lg:flex'
                  Icon={ExternalIcon}
                  onClick={() => {
                    window.open(`${SCAN_URLS[networkId]}/address/${token.address}`, '_blank')
                  }}
                /> */}
                <EmphasisButton onClick={() => setShowAnalyticsModal(true)}>
                  {t('Generate Token Analytics')}
                </EmphasisButton>
                <PrimaryButton
                  onClick={() => {
                    push(`/swap?inputCurrency=BNB&outputCurrency=${token.address}&swapType=1`)
                  }}
                >
                  {t('Swap')}
                </PrimaryButton>
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

      {/* Token Analytics Modal CreditLink */}
      <Modal
        width={1200}
        styles={{
          largeScreen: {
            overflow: 'hidden',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
          mediumScreen: {
            overflow: 'hidden',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
          smallScreen: {
            overflow: 'hidden',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        isOpen={showAnalyticsModal}
        closeModal={() => setShowAnalyticsModal(false)}
        title={t('Token Analytics')}
      >
        <div className='relative flex flex-1 overflow-hidden pl-2.5'>
          <iframe src={analyticsUrl} title='Token Analytics' className='h-full w-full border-0' />
          <div className='pointer-events-none absolute top-0 right-0 h-full w-[15px] bg-[#1A121E]' />
        </div>
      </Modal>
    </LayoutWithBackButton>
  )
}
