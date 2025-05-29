import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CustomTooltip from '@/components/tooltip'
import { TextHeading } from '@/components/typography'
import { useTHEStory } from '@/context/THEStoryContext'

// FIXME remove mock data
const minted = false

const TOTAL_FRAGMENTS = 4
export function RewardFragments() {
  const t = useTranslations()
  const { campaignParticipantInfo: userInfo } = useTHEStory()

  return (
    <div className='border-gradient-secondary w-full rounded-xl p-px lg:col-span-4'>
      <div className='rounded-xl bg-neutral-900'>
        <div className='p-4 lg:bg-[url("/images/test-2.png")] lg:bg-cover lg:bg-center lg:p-8'>
          <TextHeading>{t('Mint Your NFT')}</TextHeading>
          <div className='flex flex-col items-center justify-center'>
            <div className=''>
              <Image
                alt='reward-nft'
                className='my-8 h-auto w-full lg:w-[320px]'
                src='/images/NFT.png'
                width={961}
                height={961}
              />
            </div>

            <span>{`${t('Fragments Required')}: ${userInfo.totalFragments}/${TOTAL_FRAGMENTS}`}</span>
          </div>

          <div className='4 mt-3 mb-6 inline-block h-3 w-full rounded-md bg-neutral-500'>
            <div
              style={{
                width: `${(userInfo.totalFragments * 100) / TOTAL_FRAGMENTS}%`,
              }}
              className='block h-full rounded-md bg-linear-to-r from-[#B386FF] to-[#FF86FA]'
            />
          </div>

          <div className='border-primary-700 flex flex-col items-center justify-between gap-4 rounded-xl border bg-neutral-800 p-4 lg:flex-row lg:gap-0 lg:p-6'>
            {userInfo.totalFragments !== TOTAL_FRAGMENTS && (
              <>
                <TextHeading className='font-archia text-2xl font-semibold'>{t('Mint an NFT')}</TextHeading>
                <EmphasisButton className='w-full px-8 lg:w-auto' disabled>
                  {t('Fragments missing')}
                </EmphasisButton>
              </>
            )}

            {userInfo.totalFragments === TOTAL_FRAGMENTS && !minted && (
              <>
                <TextHeading className='font-archia text-2xl font-semibold'>{t('You Won an NFT')}</TextHeading>
                <CustomTooltip id='disabled-reward' className='rounded-md py-2!' place='top'>
                  <TextHeading className='text-xs'>
                    The rewards for THE Story will be announced at a later time.
                  </TextHeading>
                </CustomTooltip>
                <PrimaryButton className='w-full px-8 lg:w-auto' disabled data-tooltip-id='disabled-reward'>
                  {t('Mint now')}
                </PrimaryButton>
              </>
            )}

            {userInfo.totalFragments === TOTAL_FRAGMENTS && minted && (
              <>
                <TextHeading className='font-archia text-2xl font-semibold'>{t('You Minted a New NFT')}</TextHeading>
                <EmphasisButton className='w-full px-8 lg:w-auto' disabled>
                  {t('Minted')}
                </EmphasisButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
