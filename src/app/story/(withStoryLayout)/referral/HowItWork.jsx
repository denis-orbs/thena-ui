import { useTranslations } from 'next-intl'

import { ExchangeIcon } from '@/svgs'

export function HowItWork() {
  const t = useTranslations()
  return (
    <div>
      <p className='text-[30px] font-semibold'>{t('How it Works')}</p>
      <div className='grid grid-cols-2 md:grid-cols-4 md:gap-[10]'>
        {/* TODO: Use HowItWorksItem */}
        <div className='flex max-w-[330px] flex-col items-center justify-center p-6'>
          <ExchangeIcon className='h-12 w-12' />
          <p className='mb-1 text-center text-[16px] font-medium text-neutral-50'>{t('Send Invitation')}</p>
          <p className='text-center text-[14px] font-medium text-neutral-300'>{t('Send Invitation Description')}</p>
        </div>
        <div className='flex max-w-[330px] flex-col items-center justify-center p-6'>
          <ExchangeIcon className='h-12 w-12' />
          <p className='mb-1 text-center text-[16px] font-medium text-neutral-50'>{t('Registration')}</p>
          <p className='text-center text-[14px] font-medium text-neutral-300'>{t('Registration Description')}</p>
        </div>
        <div className='flex max-w-[330px] flex-col items-center justify-center p-6'>
          <ExchangeIcon className='h-12 w-12' />
          <p className='mb-1 text-center text-[16px] font-medium text-neutral-50'>{t('1 Weekly Task')}</p>
          <p className='text-center text-[14px] font-medium text-neutral-300'>{t('1 Weekly Task Description')}</p>
        </div>
        <div className='flex max-w-[330px] flex-col items-center justify-center p-6'>
          <ExchangeIcon className='h-12 w-12' />
          <p className='mb-1 text-center text-[16px] font-medium text-neutral-50'>{t('Receive 10 Points')}</p>
          <p className='text-center text-[14px] font-medium text-neutral-300'>{t('Receive 10 Points Description')}</p>
        </div>
      </div>
    </div>
  )
}
