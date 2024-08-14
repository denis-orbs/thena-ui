import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { cn } from '@/lib/utils'
import { StarLineLargeIcon } from '@/svgs'

export function DailyCheckin() {
  const dailyCheckIns = [
    {
      id: 1,
      index: 1,
      pts: 10,
      ratio: 1,
      checked: true,
    },
    {
      id: 2,
      index: 2,
      pts: 10,
      ratio: 1,
      checked: true,
    },
    {
      id: 3,
      index: 3,
      pts: 15,
      ratio: 1.5,
      checked: true,
    },
    {
      id: 4,
      index: 4,
      pts: 15,
      ratio: 1.5,
      checked: false,
    },
    {
      id: 5,
      index: 5,
      pts: 20,
      ratio: 2,
      checked: false,
    },
    {
      id: 6,
      index: 6,
      pts: 20,
      ratio: 2,
      checked: false,
    },
    {
      id: 7,
      index: 7,
      pts: 30,
      ratio: 3,
      checked: false,
    },
  ]

  const t = useTranslations()

  return (
    <Box className='space-y-4'>
      <p className='m-0 font-archia text-3xl font-semibold leading-9'>{t('Daily Check-In')}</p>
      <p className='!mt-2 text-lg leading-5'>{t('Daily Check-In description')}</p>
      <div className='grid grid-cols-2 gap-5 lg:grid-cols-7'>
        {dailyCheckIns.map(checkIn => (
          <div key={checkIn.id}>
            <div
              className={cn(
                'relative flex flex-col items-center rounded-xl border-2 border-neutral-800 bg-neutral-800 py-3 hover:border-purple',
                checkIn.checked ? 'border-purple' : '',
              )}
            >
              <p className='font-archia text-[22px] leading-7'>{`${t('Day')} ${checkIn.index}`}</p>
              <StarLineLargeIcon className='mt-3 h-[60px] w-[60px]' />
              <p className='text-[18px] leading-7'>{`+${checkIn.ratio} ${t('PTS')}`}</p>
              {checkIn.ratio !== 1 && (
                <div className='absolute right-[-2px] top-[-2px] rounded-xl bg-[rgba(220,0,212,1)] px-[5px] text-base font-semibold leading-7'>
                  {checkIn.ratio}X
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Box>
  )
}
