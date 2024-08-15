import { useTranslations } from 'use-intl'

import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { CopyIcon, ShareIcon } from '@/svgs'

export function ShareReferralLink() {
  const t = useTranslations()

  return (
    <div className='rounded-xl bg-gradient-to-b from-gradient-secondary-start to-gradient-secondary-end p-[1px]'>
      <div className='rounded-xl bg-neutral-900 p-6'>
        <TextHeading className='font-archia text-3xl font-semibold'>{t('Share Your Referral Link')}</TextHeading>
        <TextSubHeading className='mt-2  block text-base font-normal leading-5 text-gray-400'>
          {t('Share Your Referral Link Description')}
        </TextSubHeading>
        <p className='mt-6 text-lg font-medium'>{t('Your Referral Code')}</p>
        <div className='mt-2 flex cursor-text items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'>
          <span>https://thena.fi/invite?ref=4X0JEX</span>
          <CopyIcon className='inline-block h-6 w-6 cursor-pointer' />
        </div>
        <PrimaryButton className='mt-6 flex w-full items-center justify-center'>
          <ShareIcon className='inline-block h-4 w-4' />
          <span className='text-base font-medium'>{t('Share')}</span>
        </PrimaryButton>
      </div>
    </div>
  )
}
