import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'
import useSWR from 'swr'

import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useNftFeesClaim, useTheNftAccountInfo, useTheNftInfo } from '@/hooks/useTheNft'
import { fetchNfts } from '@/lib/api'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'

const fetchNftInfo = async (url, nftIds) => {
  if (!nftIds || nftIds.length === 0) return
  const res = await Promise.all(nftIds.map(ele => fetchNfts(ele)))
  return res.map((ele, idx) => ({
    ...ele,
    id: nftIds[idx],
  }))
}

function TheNFT() {
  const { push } = useRouter()
  // const [isManageOpen, setIsManageOpen] = useState(false)
  const { apr, lastEarnings } = useTheNftInfo()
  const { stakedIds, walletIds, pendingReward, userLoading } = useTheNftAccountInfo()
  const { data: yourNfts, isLoading } = useSWR(['thenft image info', [...walletIds, ...stakedIds].length], url =>
    fetchNftInfo(url, [...walletIds, ...stakedIds]),
  )
  const { onHarvest, pending } = useNftFeesClaim()
  // const { onRoyaltyClaim, pending: royaltyPending } = useNftRoyaltyClaim()
  const t = useTranslations()
  return (
    <div className='flex h-full flex-col gap-4 rounded-xl bg-neutral-900 py-4'>
      <div className='flex items-center justify-between'>
        <TextHeading className='px-4 font-archia text-xl font-semibold'>theNFT</TextHeading>
        {yourNfts?.length > 3 && (
          <Paragraph className='px-4 text-sm text-neutral-500'>
            {t('You own [number]', { number: yourNfts?.length })}
          </Paragraph>
        )}
      </div>
      <div className='flex h-full flex-col justify-between gap-4'>
        {!isLoading && (!yourNfts || (yourNfts || []).length <= 0) ? (
          <div className='mx-4 flex h-[140px] flex-col gap-2 bg-neutral-800 text-center md:h-[182px]' />
        ) : isLoading ? (
          <Skeleton className='h-[140px] w-full md:h-[180px]' />
        ) : (
          <div className='relative flex h-[140px] w-full justify-center overflow-hidden bg-neutral-800 md:h-[180px]'>
            <div
              className={cn(
                'grid gap-2',
                yourNfts.length === 1 && 'grids-cols-1',
                yourNfts.length === 2 && 'grid-cols-2',
                yourNfts.length >= 3 && 'grid-cols-3',
              )}
            >
              {yourNfts.slice(0, 3).map((nft, idx) => (
                <NextImage
                  key={`thenft-${nft.id}-${idx}`}
                  className='h-full w-full object-cover'
                  src={nft.image}
                  alt={nft.name}
                />
              ))}
            </div>
          </div>
        )}
        <TextSubHeading className='px-4 text-sm'>
          {`${t('Last Epoch Earnings')} $${formatAmount(lastEarnings)}`}
        </TextSubHeading>
        <div className='flex justify-between px-4'>
          <div className='flex flex-col gap-2'>
            <TextSubHeading className='text-sm'>{t('Claimable Fees')}</TextSubHeading>
            {userLoading ? (
              <Skeleton className='h-9 w-[100px]' />
            ) : (
              <TextHeading className='font-archia text-3xl font-semibold text-primary-300'>
                ${formatAmount(pendingReward)}
              </TextHeading>
            )}
          </div>
          <div className='flex flex-col gap-2'>
            <TextSubHeading className='text-sm'>{t('Floor Price APR')}</TextSubHeading>
            {userLoading ? (
              <Skeleton className='h-9 w-[100px]' />
            ) : (
              <TextHeading className='font-archia text-3xl font-semibold text-primary-300'>
                {apr ? `${formatAmount(apr)}%` : null}
              </TextHeading>
            )}
          </div>
        </div>
        <div className={cn('grid grid-cols-2 gap-2 px-4', isInvalidAmount(pendingReward) && 'grid-cols-1')}>
          <EmphasisButton onClick={() => push('/dashboard/thenft')}>{t('View')}</EmphasisButton>
          {!isInvalidAmount(pendingReward) && (
            <EmphasisButton
              disabled={pending}
              onClick={() => {
                onHarvest()
              }}
            >
              {t('Claim')}
            </EmphasisButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default TheNFT
