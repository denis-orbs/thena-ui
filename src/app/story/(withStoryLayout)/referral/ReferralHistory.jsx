import { useTranslations } from 'use-intl'

import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

import { RewardIconTooltip } from '../chapters/RewardIconTooltip'
import { REFERRAL_REWARD, RewardType } from '../../constant'

const isSmallScreen = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 1024
  }
  return false
}

export function ReferralHistory({ referralHistory }) {
  const t = useTranslations()

  return (
    <div className='border-gradient-secondary rounded-xl p-[1px]'>
      <div className='rounded-xl bg-neutral-900'>
        <div className='p-4 lg:p-6'>
          <TextHeading className='font-archia text-3xl font-semibold'>{t('Referral History')}</TextHeading>
        </div>
        {isSmallScreen() ? (
          <div className='max-h-[550px] w-full gap-y-3 overflow-auto px-4 pb-4 font-medium lg:px-6 lg:pb-6'>
            {referralHistory.map(referral => (
              <div key={referral.id} className='mt-4 rounded-xl bg-neutral-800 p-4'>
                <div>
                  <p className='mb-2'>{t('Registered Referral')}</p>
                  <span className='break-all'>{referral.invitedWallet}</span>
                </div>
                <div className='mt-4 flex justify-between'>
                  <div>
                    <p className='mb-2'>{t('Successful Referral')}</p>
                    {referral.isSuccess ? (
                      <div className='text-success-700'>{t('Yes')}</div>
                    ) : (
                      <div className='text-error-700'>{t('No')}</div>
                    )}
                  </div>

                  <div>
                    <p className='mb-2'>{t('Reward')}</p>
                    {referral.isSuccess ? (
                      <div className='flex items-center'>
                        {`+${REFERRAL_REWARD}`}{' '}
                        <RewardIconTooltip
                          rewardType={RewardType.Point}
                          id={`referral-${referral.id}`}
                          iconSize={6}
                          className='ml-1'
                        />
                      </div>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className=' w-full'>
            <div className='grid grid-cols-12 px-11 py-4'>
              <div className='col-span-6 md:col-span-8'>{t('Registered Referrals')}</div>
              <div className='col-span-4 md:col-span-3'>{t('Successful Referrals')}</div>
              <div className='col-span-2 md:col-span-1'>{t('Rewards')}</div>
            </div>
            <div className='max-h-[430px] overflow-auto px-6 py-4'>
              {referralHistory.map((referral, index) => (
                <div className='mb-3 grid grid-cols-12 rounded-xl bg-neutral-800 px-5 py-6' key={index}>
                  <div className='col-span-6 overflow-hidden text-ellipsis break-all pr-1 md:col-span-8'>
                    {referral.invitedWallet}
                  </div>
                  <div
                    className={cn(
                      'col-span-4 md:col-span-3',
                      referral.isSuccess ? 'text-success-700' : 'text-error-700',
                    )}
                  >
                    {referral.isSuccess ? t('Yes') : t('No')}
                  </div>
                  <div className='col-span-2 md:col-span-1'>
                    {referral.isSuccess ? (
                      <div className='flex items-center'>
                        {`+${REFERRAL_REWARD}`}
                        <RewardIconTooltip
                          rewardType={RewardType.Point}
                          id={`referral-${referral.id}`}
                          iconSize={6}
                          className='ml-1'
                        />
                      </div>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
