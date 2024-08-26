import { useTranslations } from 'use-intl'

import { TextHeading } from '@/components/typography'
import { StarLineSmallIcon } from '@/svgs'

import { REFERRAL_REWARD } from '../../constant'

export function ReferralHistory({ referralHistory }) {
  const t = useTranslations()

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
                {referral.invitedWallet}
              </div>
              <div className='col-span-4 md:col-span-3'>{referral.isSuccess ? t('Yes') : t('No')}</div>
              <div className='col-span-2 md:col-span-1'>
                {referral.isSuccess ? (
                  <div className='flex items-center'>
                    {`+${REFERRAL_REWARD}`} <StarLineSmallIcon className='inline-block h-6 w-6' />
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
