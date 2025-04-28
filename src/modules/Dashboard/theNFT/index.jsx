import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'
import useSWR from 'swr'

import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useClaimTheNFT } from '@/hooks/useClaimTheNFT'
import { useTheNftAccountInfo, useTheNftInfo } from '@/hooks/useTheNft'
import { fetchNfts } from '@/lib/api'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'
import { ExternalIcon } from '@/svgs'

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
  const { apr, lastEarnings, floorPrice, totalSupply } = useTheNftInfo()

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

  const t = useTranslations()
  return (
    <div className='flex h-full flex-col gap-2 rounded-xl bg-neutral-900 py-4'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col px-4'>
          <TextHeading className='font-archia text-xl font-semibold'>theNFT</TextHeading>
          {(yourNfts || (yourNfts || []).length > 0) && (
            <TextSubHeading className='text-sm'>{`${t('Last Epoch Earnings')}`}</TextSubHeading>
          )}
        </div>
        {(yourNfts || (yourNfts || []).length > 0) && (
          <TextSubHeading className='pr-4 font-archia text-4xl font-semibold text-neutral-500'>
            ${formatAmount(lastEarnings)}
          </TextSubHeading>
        )}
      </div>
      <div className='flex h-full flex-col justify-between gap-2'>
        {!isLoading && (!yourNfts || (yourNfts || []).length <= 0) ? (
          <div className='space-y-2 text-center'>
            <div className="flex h-[140px] flex-col items-center justify-center gap-2 bg-[url('/images/theNFT-default.png')] bg-cover bg-center bg-no-repeat text-center md:h-[188px]">
              <div className='flex flex-col gap-1.5'>
                <TextHeading className='font-archia text-5xl font-semibold text-primary-600'>
                  ${formatAmount(lastEarnings)}
                </TextHeading>
                <TextSubHeading className='text-sm text-neutral-50'>{t('Last Epoch Earnings')}</TextSubHeading>
              </div>
            </div>
            <Paragraph className='text-center text-sm font-normal text-neutral-500'>
              {t('Original minters [totalSupply]', { totalSupply: formatAmount(totalSupply) })}
            </Paragraph>
          </div>
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
        {stakedIds.length > 0 && (
          <div className='-mt-2 text-center'>
            <TextHeading className='text-xl text-neutral-500'>
              {`${t('Staked')} ${formatAmount(stakedIds.length)}`}
            </TextHeading>
          </div>
        )}
        <div className='grid grid-cols-2 px-4'>
          <div className='flex flex-col gap-2 text-center'>
            <TextSubHeading className='text-sm font-normal'>
              {t(yourNfts && yourNfts.length > 0 ? 'Claimable Fees' : 'Floor Price')}
            </TextSubHeading>
            {userLoading ? (
              <Skeleton className='h-9 w-[100px]' />
            ) : (
              <>
                {yourNfts && yourNfts.length > 0 ? (
                  <TextHeading className='font-archia text-3xl font-semibold text-primary-300'>
                    ${formatAmount(pendingReward)}
                  </TextHeading>
                ) : (
                  <TextHeading className='font-archia text-3xl font-semibold text-primary-300'>
                    ${formatAmount(floorPrice)}
                  </TextHeading>
                )}
              </>
            )}
          </div>
          {isOriginal && !claimable.isZero() ? (
            <div className='flex flex-col gap-2 text-center'>
              <TextSubHeading className='text-sm font-normal'>{t('Claim Royalties')}</TextSubHeading>
              {userLoading ? (
                <Skeleton className='h-9 w-[100px]' />
              ) : (
                <TextHeading className='font-archia text-3xl font-semibold text-primary-300'>
                  {`$${formatAmount(claimableUSD)}`}
                </TextHeading>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-2 text-center'>
              <TextSubHeading className='text-sm font-normal'>{t('Floor Price APR')}</TextSubHeading>
              {userLoading ? (
                <Skeleton className='h-9 w-[100px]' />
              ) : (
                <TextHeading className='font-archia text-3xl font-semibold text-primary-300'>
                  {apr ? `${formatAmount(apr)}%` : null}
                </TextHeading>
              )}
            </div>
          )}
        </div>
        <div className={cn('grid grid-cols-2 gap-2 px-4')}>
          {yourNfts && yourNfts.length > 0 ? (
            <>
              <EmphasisButton onClick={() => push('/dashboard/thenft')}>{t('View')}</EmphasisButton>
              {(!isInvalidAmount(pendingAmount) || !claimable.isZero()) && (
                <EmphasisButton
                  disabled={pendingClaim}
                  onClick={() => {
                    onClaim(
                      {
                        isOriginal,
                        royaltyClaimable: !claimable.isZero(),
                        feesClaimAble: !isInvalidAmount(pendingAmount),
                      },
                      mutate(),
                    )
                  }}
                >
                  {t('Claim')}
                </EmphasisButton>
              )}
            </>
          ) : (
            <>
              <EmphasisButton onClick={() => window.open('https://docs.thena.fi/thena/thenft-collection', '_blank')}>
                {t('Learn more')}
                <ExternalIcon className='size-5 stroke-neutral-100' />
              </EmphasisButton>
              {isOriginal ? (
                <>
                  {!isInvalidAmount(claimable) && (
                    <EmphasisButton
                      disabled={pendingClaim}
                      onClick={() => {
                        onClaim(
                          {
                            isOriginal: true,
                            royaltyClaimable: !claimable.isZero(),
                            feesClaimAble: false,
                          },
                          mutate,
                        )
                      }}
                    >
                      {t('Claim')}
                    </EmphasisButton>
                  )}
                </>
              ) : (
                <EmphasisButton
                  onClick={() => {
                    window.open('https://element.market/collections/thenian', '_blank')
                  }}
                >
                  {t('Buy one')} <ExternalIcon className='size-5 stroke-neutral-100' />
                </EmphasisButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TheNFT
