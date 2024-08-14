import { useTranslations } from 'next-intl'
import React from 'react'

import { SecondaryButton } from '@/components/buttons/Button'
import ChevronRightIcon from '@/modules/Story/ChevronRightIcon'
import StartIcon from '@/modules/Story/StartIcon'

export default function InviteYourFriends() {
  const t = useTranslations()
  return (
    <div className='col-span-12 flex h-[178px] w-[589.2px] flex-col justify-between gap-10 px-10 lg:col-span-6'>
      <p className='text-[40px] font-semibold text-neutral-50'>{t('Invite Your Friends')}</p>
      <p className='leading-6 text-neutral-300'>
        {t(
          'Description text Description text Description text Description text Description text Description text Description text.',
        )}
      </p>
      <div className='row-span-1'>
        <p className='mt-2 flex items-center'>
          {`+ ${t('Points')}`}
          <StartIcon className='ml-4' />
        </p>
      </div>
      <SecondaryButton type='submit' className='h-[44px] w-[124px] bg-[#DF08D4] text-neutral-100'>
        {t('Start')}
        <ChevronRightIcon />
      </SecondaryButton>
    </div>
  )
}
