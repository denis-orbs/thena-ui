import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import { NewTextHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useClaimTheNFT } from '@/hooks/useClaimTheNFT'
import { useTheNftAccountInfo, useTheNftInfo } from '@/hooks/useTheNft'
import { fetchNfts } from '@/lib/api'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'
import { ExternalIcon } from '@/svgs'

import SectionDivider from '../SectionDivider'

const fetchNftInfo = async (url, nftIds) => {
  if (!nftIds || nftIds.length === 0) return
  const res = await Promise.all(nftIds.map(ele => fetchNfts(ele)))
  return res.map((ele, idx) => ({
    ...ele,
    id: nftIds[idx],
  }))
}

function InfoBlock({ title, value, isLoading }) {
  return (
    <div className='flex flex-col text-center'>
      <TextSubHeading className='text-sm font-normal'>{title}</TextSubHeading>
      {isLoading ? (
        <Skeleton className='h-9 w-[100px]' />
      ) : (
        value && <TextHeading className='font-archia text-3xl font-semibold text-primary-300'>{value}</TextHeading>
      )}
    </div>
  )
}

function TheNFT() {
  const t = useTranslations()
  const { push } = useRouter()
  const { apr, lastEarnings, floorPrice } = useTheNftInfo()
  const { onClaim, pending: pendingClaim } = useClaimTheNFT()
  const {
    stakedIds,
    walletIds,
    pendingReward,
    pendingAmount,
    claimable,
    claimableUSD,
    isOriginal,
    userLoading,
    mutate,
  } = useTheNftAccountInfo()

  const { data: yourNfts, isLoading } = useSWR(['thenft image info', [...walletIds, ...stakedIds].length], url =>
    fetchNftInfo(url, [...walletIds, ...stakedIds]),
  )

  const hasNfts = useMemo(() => yourNfts?.length > 0, [yourNfts])

  const handleClaim = useCallback(
    (original, feesClaimAble) => {
      onClaim(
        {
          isOriginal: original,
          royaltyClaimable: !claimable.isZero(),
          feesClaimAble,
        },
        mutate,
      )
    },
    [onClaim, mutate, claimable],
  )

  return (
    <>
      <div className='flex h-full w-full flex-col gap-2 rounded-xl bg-neutral-900 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col px-4'>
            <NewTextHeading className='text-xl md:text-xl'>theNFT</NewTextHeading>
            {hasNfts && <TextSubHeading className='text-sm'>{`${t('Last Epoch Earnings')}`}</TextSubHeading>}
          </div>
          {hasNfts && (
            <TextSubHeading className='pr-4 font-archia text-4xl font-semibold text-neutral-500'>
              ${formatAmount(lastEarnings)}
            </TextSubHeading>
          )}
        </div>

        <div className='flex h-full flex-col justify-between gap-2'>
          {isLoading ? (
            <Skeleton className='h-[140px] w-full md:h-[180px]' />
          ) : hasNfts ? (
            <div className='relative flex w-full justify-center overflow-hidden bg-neutral-800 md:h-[224px]'>
              <div
                className={cn(
                  'grid gap-2',
                  yourNfts.length === 1 && 'grid-cols-1',
                  yourNfts.length === 2 && 'grid-cols-2',
                  yourNfts.length >= 3 && 'grid-cols-3',
                )}
              >
                {yourNfts.slice(0, 3).map((nft, idx) => (
                  <NextImage
                    key={`thenft-${nft.id}-${idx}`}
                    className='h-full w-full object-cover'
                    src={nft.image.replace('ipfs.io', 'w3s.link')}
                    alt={nft.name}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className='text-center'>
              <div className="flex h-[140px] flex-col items-center justify-center gap-2 bg-[url('/images/theNFT-default.png')] bg-cover bg-center bg-no-repeat md:h-[188px]">
                <div className='flex flex-col gap-1.5'>
                  <TextHeading className='text-gradient-primary-b font-archia text-5xl font-semibold'>
                    ${formatAmount(lastEarnings)}
                  </TextHeading>
                  <NewTextHeading className='text-xl !leading-6 md:text-xl'>{t('Last Epoch Earnings')}</NewTextHeading>
                </div>
              </div>
              <Paragraph className='mt-2 block px-4 !text-sm font-normal text-neutral-500'>
                {t('TheNFT benefits earn')}
              </Paragraph>
            </div>
          )}
          <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-2 px-4'>
              <InfoBlock
                title={hasNfts ? t('Claimable Fees') : t('Floor Price')}
                value={
                  userLoading ? null : hasNfts ? `$${formatAmount(pendingReward)}` : `$${formatAmount(floorPrice)}`
                }
                isLoading={userLoading}
              />
              {isOriginal && !claimable.isZero() ? (
                <InfoBlock
                  title={t('Claim Royalties')}
                  value={userLoading ? null : `$${formatAmount(claimableUSD)}`}
                  isLoading={userLoading}
                />
              ) : (
                <InfoBlock
                  title={t('Floor Price APR')}
                  value={userLoading ? null : apr ? `${formatAmount(apr)}%` : null}
                  isLoading={userLoading}
                />
              )}
            </div>

            <div className='grid grid-cols-2 gap-2 px-4'>
              {hasNfts ? (
                <>
                  <EmphasisButton className='text-sm max-md:h-8' onClick={() => push('/dashboard/thenft')}>
                    {t('View')}
                  </EmphasisButton>
                  {(!isInvalidAmount(pendingAmount) || !claimable.isZero()) && (
                    <EmphasisButton
                      className='text-sm max-md:h-8'
                      disabled={pendingClaim}
                      onClick={() => handleClaim(isOriginal, !isInvalidAmount(pendingAmount))}
                    >
                      {t('Claim')}
                    </EmphasisButton>
                  )}
                </>
              ) : (
                <>
                  <Link className='w-full' href='https://docs.thena.fi/thena/thenft-collection' target='_blank'>
                    <EmphasisButton className='w-full text-nowrap text-sm max-md:h-8'>
                      {t('Learn more')}
                      <ExternalIcon className='size-4 stroke-neutral-100 md:size-5' />
                    </EmphasisButton>
                  </Link>

                  {isOriginal && !isInvalidAmount(claimable) ? (
                    <EmphasisButton
                      disabled={pendingClaim}
                      className='text-nowrap text-sm max-md:h-8'
                      onClick={() => handleClaim(true, false)}
                    >
                      {t('Claim')}
                    </EmphasisButton>
                  ) : (
                    <Link className='w-full' href='https://element.market/collections/thenian' target='_blank'>
                      <EmphasisButton className='w-full text-sm max-md:h-8'>
                        {t('Buy one')}
                        <ExternalIcon className='size-4 stroke-neutral-100 md:size-5' />
                      </EmphasisButton>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <SectionDivider />
    </>
  )
}

export default TheNFT
