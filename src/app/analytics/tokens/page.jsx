'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import PercentBadge from '@/components/badges/PercentBadge'
import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Spinner from '@/components/spinner'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useTokens } from '@/context/tokensContext'
import { formatAmount } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import TokensTable from './TokensTable'

export default function AnalyticsTokensPage() {
  const [searchText, setSearchText] = useState('')
  const { push } = useRouter()
  const { tokens, isLoading } = useTokens()
  const t = useTranslations()

  const filteredTokens = useMemo(
    () => (tokens ? tokens.filter(token => token.symbol.toLowerCase().includes(searchText.toLowerCase())) : []),
    [tokens, searchText],
  )
  const topMovers = useMemo(
    () => (tokens ? tokens.sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange)).slice(0, 4) : []),
    [tokens],
  )
  if (isLoading || !tokens) {
    return (
      <div className='flex w-full items-center'>
        <Spinner />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-4'>
        <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => push('/analytics')}>
          {t('Back')}
        </TextButton>
        <h2>{t('Top Movers')}</h2>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
          {topMovers.map(asset => (
            <Box className='flex items-start justify-between' key={`asset-${asset.address}`}>
              <div className='flex items-center gap-3'>
                <CircleImage className='h-8 w-8' src={asset.logoURI} alt='thena logo' />
                <div className='flex flex-col'>
                  <TextHeading className='text-lg'>{asset.symbol}</TextHeading>
                  <TextSubHeading>${formatAmount(asset.price)}</TextSubHeading>
                </div>
              </div>
              <PercentBadge value={asset.priceChange} />
            </Box>
          ))}
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <TextHeading className='text-xl'>{t('Assets')}</TextHeading>
          <SearchInput val={searchText} setVal={setSearchText} />
        </div>
        <TokensTable data={filteredTokens} />
      </div>
    </div>
  )
}
