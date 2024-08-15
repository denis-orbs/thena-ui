import { useTranslations } from 'next-intl'
import React from 'react'

import { SecondaryButton } from '@/components/buttons/Button'
import ChevronRightIcon from '@/modules/Story/ChevronRightIcon'
import DiamondIcon from '@/modules/Story/DiamondIcon'
import StartIcon from '@/modules/Story/StartIcon'

export default function CompleteWeeklyTasksLeft() {
  const t = useTranslations()

  return (
    <div className='col-span-12 lg:col-span-6'>
      <div className='col-span-12 my-auto flex h-[178px] w-[589.2px] flex-col justify-between gap-10 lg:col-span-6'>
        <p className='text-[40px] font-semibold text-neutral-50'>{t('Complete Weekly Tasks')}</p>
        <p className='leading-6 text-neutral-300'>
          {t(
            'Description text Description text Description text Description text Description text Description text Description text.',
          )}
        </p>
        <div className='row-span-1'>
          <p className='flex items-center'>
            {`+ ${t('Fragments')}`}
            <DiamondIcon className='ml-4' />
          </p>
          <p className='mt-2 flex items-center'>
            {`+ ${t('Points')}`}
            <StartIcon className='ml-4' />
          </p>
        </div>

        <SecondaryButton type='submit' className='h-[44px] w-[124px] bg-[#DF08D4] text-neutral-100'>
          Start
          <ChevronRightIcon />
        </SecondaryButton>
      </div>
    </div>
  )
}
