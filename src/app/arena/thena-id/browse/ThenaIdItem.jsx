'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import ImageThenaId from '@/components/image/ImageThenaId'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { formatAmount } from '@/lib/utils'

function ThenaIdItem({ item }) {
  const t = useTranslations()
  const assets = useAssets()

  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets?.find(asset => asset.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  return (
    <Link
      href={`/arena/thena-id/browse/${encodeURIComponent(item.name)}`}
      className='rounded-[10px] hover:border-2 hover:border-neutral-400'
    >
      <div key={item.name} className='rounded-lg'>
        <div className='rounded-t-lg bg-neutral-300'>
          <ImageThenaId name={item.name} className='rounded-t-lg' />
        </div>

        <Box className='rounded-t-none rounded-b-lg p-3 lg:p-3'>
          <TextHeading className='mb-4 block truncate text-sm'>{item.name}.thena</TextHeading>
          {item.owner ? (
            <div className='flex flex-row flex-wrap items-center overflow-hidden'>
              <TextSubHeading className='mr-1 block text-base'>{t('Owned By')}</TextSubHeading>
              <UserProfileCard user={item.owner} enableFollow={false} showVerified={item.owner.isVerified} />
            </div>
          ) : (
            <div className='flex items-center justify-start space-x-2'>
              <TextHeading>
                {t('Mint For')} {formatAmount(item.cost)} {USDTAsset?.symbol}
              </TextHeading>
              {USDTAsset?.logoURI && (
                <Image
                  alt='token'
                  src={`${USDTAsset.logoURI ?? ''}`}
                  className='shrink-0'
                  width={24}
                  height={24}
                  loading='lazy'
                />
              )}
            </div>
          )}
        </Box>
      </div>
    </Link>
  )
}

export default ThenaIdItem
