import React from 'react'
import { useTranslations } from 'use-intl'

import CheckIcon from '@/modules/Story/CheckIcon'
import ProgressBar from '@/modules/Story/ProgressBar'

export default function CompleteWeeklyTasksRight() {
  const t = useTranslations()

  return (
    <div className='col-span-12 lg:col-span-6'>
      <div className='relative h-[328px] w-[576px]'>
        <div
          style={{
            borderWidth: '1px',
            borderImageSource: 'linear-gradient(180deg, rgba(220, 0, 212, 0.5) 0%, rgba(142, 66, 255, 0) 100%)',
            borderImageSlice: 1,
            borderRadius: '12px',
          }}
          className='absolute left-0 top-0 z-10 row-span-1 h-[273px] w-[460px] gap-4 rounded-[12px] border bg-[#1A121E] p-6 pt-5'
        >
          <div className='mb-4 justify-between gap-2 border-b-[1px] border-[#35243D] pb-4'>
            <div className='col-span-12 text-center'>{t('1 / 2 tasks completed')}</div>
            <ProgressBar process='50%' />
          </div>
          <div className='mb-4 justify-between pb-4'>
            <p className='uppercase text-gradient'>{t('Chapter 1')}</p>
            <p className='text-[35px] font-semibold'>{t('Enter ARENA')}</p>
            <ul className='grid-span-12 grid list-disc space-y-1 pl-8 text-[#D1D0D2]'>
              <li className='col-span-11'>{t('Join one of the BNB Chain sponsored trading competitions')}</li>
              <div className='clo-span-1'>
                <CheckIcon />
              </div>
              <li className='col-span-12'>{t('Mint .thena ID')}</li>
            </ul>
          </div>
        </div>
        <div
          style={{
            borderWidth: '1px',
            borderImageSource: 'linear-gradient(180deg, rgba(220, 0, 212, 0.5) 0%, rgba(142, 66, 255, 0) 100%)',
            borderImageSlice: 1,
            borderRadius: '12px',
          }}
          className='absolute bottom-0 right-0 h-[273px] w-[460px] gap-4 rounded-[12px] border bg-[#1A121E] p-6 pt-5'
        >
          <div className='mb-4 justify-between gap-2 border-b-[1px] border-[#35243D] pb-4'>
            <div className='col-span-12 text-center'>{t('1 / 2 tasks completed')}</div>
            <ProgressBar process='0' />
          </div>
          <div className='mb-4 justify-between pb-4'>
            <p className='uppercase text-gradient'>{t('Chapter 2')}</p>
            <p className='text-[35px] font-semibold'>{t('Concentrating on Liquidity')}</p>
            <ul className='grid-span-12 grid list-disc space-y-1 pl-8 text-[#D1D0D2]'>
              <li className='col-span-12'>{t('Swap THE with any token')}</li>
              <li className='col-span-12'>{t('Stake into THE/BNB (any CL version)')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
