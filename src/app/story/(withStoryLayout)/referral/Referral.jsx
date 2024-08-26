import { useTranslations } from 'next-intl'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { StarLineSmallIcon } from '@/svgs'

import { HowItWork } from './HowItWork'
import { ReferralHistory } from './ReferralHistory'
import { ShareReferralLink } from './ShareReferralLink'

export function Referral() {
  const t = useTranslations()
  return (
    <div>
      <div className='mt-[10px]'>
        <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Invite Friends')}</TextHeading>
        <TextSubHeading className='mt-2  block text-base font-normal leading-5 text-gray-400'>
          {t('Invite Friends description')}
        </TextSubHeading>
      </div>
      <div className='mt-6 grid grid-cols-6 gap-6'>
        <div className='col-span-3 rounded-xl bg-neutral-900 p-6 lg:col-span-2'>
          <TextHeading className='block text-2xl'>5</TextHeading>
          <TextSubHeading className='mt-2 text-base font-normal leading-5 text-gray-400'>
            {t('Registered Referrals')}
          </TextSubHeading>
        </div>
        <div className='col-span-3 rounded-xl bg-neutral-900 p-6 lg:col-span-2'>
          <TextHeading className='block text-2xl'>3</TextHeading>
          <TextSubHeading className='mt-2 text-base font-normal leading-5 text-gray-400'>
            {t('Successful Referrals')}
          </TextSubHeading>
        </div>
        <div className='col-span-6 rounded-xl bg-neutral-900 p-6 lg:col-span-2'>
          <TextHeading className='block text-2xl'>
            <StarLineSmallIcon className='inline-block h-5 w-5' />
            30
          </TextHeading>
          <TextSubHeading className='mt-2 text-base font-normal leading-5 text-gray-400'>
            {t('Your Earnings')}
          </TextSubHeading>
        </div>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12'>
        <div className='lg:col-span-7'>
          <ReferralHistory />
        </div>
        <div className='lg:col-span-5'>
          <ShareReferralLink />
        </div>
      </div>
      <div className='mt-16'>
        <HowItWork />
      </div>
    </div>
  )
}
