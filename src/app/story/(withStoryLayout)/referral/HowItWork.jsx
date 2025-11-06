import { useTranslations } from 'next-intl'

import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'

export function HowItWork() {
  const t = useTranslations()
  return (
    <div>
      <p className='text-[30px] font-semibold'>{t('How it Works')}</p>
      <div className='grid grid-cols-1 gap-y-12 md:grid-cols-4'>
        <HowItWorksItem
          className='h-12 w-12'
          icon='/svgs/send.svg'
          title={t('Send Invitation')}
          description={t('Send Invitation Description')}
        />
        <HowItWorksItem
          className='h-12 w-12'
          icon='/svgs/register.svg'
          title={t('Registration')}
          description={t('Registration Description')}
        />
        <HowItWorksItem
          className='h-12 w-12'
          icon='/svgs/task-checked.svg'
          title={t('1 Weekly Task')}
          description={t('1 Weekly Task Description')}
        />
        <HowItWorksItem
          className='h-12 w-12'
          icon='/svgs/star-white.svg'
          title={t('Receive 10 Points')}
          description={t('Receive 10 Points Description')}
        />
      </div>
    </div>
  )
}
