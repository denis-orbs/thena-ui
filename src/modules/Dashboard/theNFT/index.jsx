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
  const { apr } = useTheNftInfo()
  const { stakedIds, walletIds, pendingReward, userLoading } = useTheNftAccountInfo()
  const { data: yourNfts, isLoading } = useSWR(['thenft image info', [...walletIds, ...stakedIds].length], url =>
    fetchNftInfo(url, [...walletIds, ...stakedIds]),
  )
  const { onHarvest, pending } = useNftFeesClaim()
  // const { onRoyaltyClaim, pending: royaltyPending } = useNftRoyaltyClaim()
  const t = useTranslations()
  return (
    <div className='flex h-full flex-col gap-4 rounded-xl bg-neutral-900 py-4'>
      <TextHeading className='px-4 font-archia text-xl font-semibold'>theNFT</TextHeading>
      <div className='flex h-full flex-col justify-between gap-4'>
        {!isLoading && (!yourNfts || (yourNfts || []).length <= 0) ? (
          <div className='my-16 flex flex-col gap-2 text-center'>
            <TextHeading>{t('You have no theNFT in your collection')}</TextHeading>
            <Paragraph className='text-sm'>{t('Start Passive Income')}</Paragraph>
          </div>
        ) : isLoading ? (
          <Skeleton className='h-[140px] w-full md:h-[170px]' />
        ) : (
          <div className='relative flex w-full justify-center overflow-hidden pb-4'>
            <div
              className={cn(
                '-ml-[10%] flex w-[120%] gap-4 bg-neutral-800 py-2',
                yourNfts.length < 3 && 'ml-0 w-[100%] justify-center',
              )}
            >
              {yourNfts.slice(0, 3).map((nft, idx) => (
                <div key={`thenft-${nft.id}-${idx}`} className='w-1/3 flex-shrink-0'>
                  <NextImage className='h-auto w-full rounded-[36px] object-cover' src={nft.image} alt={nft.name} />
                </div>
              ))}
            </div>
          </div>
        )}
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
        <div className='grid grid-cols-2 gap-2 px-4'>
          <EmphasisButton onClick={() => push('/dashboard/thenft')}>{t('View')}</EmphasisButton>
          <EmphasisButton
            disabled={isInvalidAmount(pendingReward) || pending}
            onClick={() => {
              onHarvest()
            }}
          >
            {t('Claim')}
          </EmphasisButton>
        </div>
      </div>
    </div>
  )
}

export default TheNFT
