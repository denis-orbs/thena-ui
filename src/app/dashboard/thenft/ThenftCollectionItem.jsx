'use client'

import { useTranslations } from 'next-intl'
import useSWR from 'swr'

import { GreenBadge, NeutralBadge } from '@/components/badges/Badge'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'
import { fetchNfts } from '@/lib/api'

async function fetchThenftMetadata([, nftId]) {
  try {
    return await fetchNfts(nftId)
  } catch {
    return { image: '', name: '' }
  }
}

export default function ThenftCollectionItem({ nftId, isStaked }) {
  const t = useTranslations()
  const { data: meta, isLoading } = useSWR(['thenft metadata', nftId], fetchThenftMetadata)

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4 rounded-xl bg-neutral-900 p-4 pb-6'>
        <div className='relative'>
          <Skeleton className='aspect-square w-full min-w-[200px] rounded-lg' />
          <div className='absolute top-2 right-1'>
            {isStaked ? <GreenBadge>{t('Staked')}</GreenBadge> : <NeutralBadge>{t('Not Staked')}</NeutralBadge>}
          </div>
        </div>
        <div className='flex flex-col gap-2 px-3'>
          <Skeleton className='h-7 w-3/4 max-w-[180px] rounded-md' />
        </div>
      </div>
    )
  }

  const image = meta?.image ?? ''
  const name = meta?.name ?? ''

  return (
    <div className='flex flex-col gap-4 rounded-xl bg-neutral-900 p-4 pb-6'>
      <div className='relative'>
        {image ? (
          <NextImage
            className='w-full min-w-[200px] rounded-lg'
            src={image.replace('ipfs.io', 'ipfs.filebase.io')}
            alt={`theNFT image ${name || nftId}`}
          />
        ) : (
          <div className='flex aspect-square w-full min-w-[200px] items-center justify-center rounded-lg bg-neutral-800 text-sm text-neutral-400'>
            {`#${nftId}`}
          </div>
        )}
        <div className='absolute top-2 right-1'>
          {isStaked ? <GreenBadge>{t('Staked')}</GreenBadge> : <NeutralBadge>{t('Not Staked')}</NeutralBadge>}
        </div>
      </div>
      <div className='flex flex-col gap-2 px-3'>
        <TextHeading className='text-base leading-tight lg:text-2xl'>{name || `#${nftId}`}</TextHeading>
      </div>
    </div>
  )
}
