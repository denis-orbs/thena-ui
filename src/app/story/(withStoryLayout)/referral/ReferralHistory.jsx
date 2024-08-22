import { useTranslations } from 'use-intl'

import { TextHeading } from '@/components/typography'
import { StarLineSmallIcon } from '@/svgs'

export function ReferralHistory() {
  const t = useTranslations()

  const referralHistory = [
    {
      walletId: '0xcbf6dbf1522ce32e45f15efb5549352b211f8303',
      isSuccessful: true,
      rewardAmount: 10,
    },
    {
      walletId: '0xCBF6Dbf1522ce32E45f15efb5549352B211F8307',
      isSuccessful: false,
      rewardAmount: 0,
    },
    {
      walletId: '0xcbf6dbf1522ce32e45f15efb5549352b211f8303',
      isSuccessful: true,
      rewardAmount: 10,
    },
    {
      walletId: '0xcbf6dbf1522ce32e45f15efb5549352b211f8303',
      isSuccessful: false,
      rewardAmount: 0,
    },
    {
      walletId: '0xcbf6dbf1522ce32e45f15efb5549352b211f8303',
      isSuccessful: true,
      rewardAmount: 10,
    },
  ]

  return (
    <div className='border-gradient-secondary rounded-xl p-[1px]'>
      <div className='rounded-xl bg-neutral-900 p-6'>
        <div>
          <TextHeading className='font-archia text-3xl font-semibold'>{t('Referral History')}</TextHeading>
        </div>
        <div className='w-full'>
          <div className='grid grid-cols-12 px-5 py-4'>
            <div className='col-span-6 md:col-span-8'>{t('Wallet ID')}</div>
            <div className='col-span-4 md:col-span-3'>{t('Successful Referrals')}</div>
            <div className='col-span-2 md:col-span-1'>{t('Rewards')}</div>
          </div>
          {referralHistory.map((referral, index) => (
            <div className='mb-3 grid grid-cols-12 rounded-xl bg-neutral-800 px-5 py-6' key={index}>
              <div className='col-span-6 overflow-hidden text-ellipsis whitespace-nowrap md:col-span-8'>
                {referral.walletId}
              </div>
              <div className='col-span-4 md:col-span-3'>{referral.isSuccessful ? t('Yes') : t('No')}</div>
              <div className='col-span-2 md:col-span-1'>
                {referral.rewardAmount ? (
                  <div className='flex items-center'>
                    {`+${referral.rewardAmount}`} <StarLineSmallIcon className='inline-block h-6 w-6' />
                  </div>
                ) : (
                  '-'
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
