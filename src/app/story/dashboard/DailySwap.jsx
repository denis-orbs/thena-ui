import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { cn } from '@/lib/utils'
import { ArrowForwardSmallIcon, CheckPurpleLargeIcon, StarLineLargeIcon } from '@/svgs'

export function DailySwap() {
  const dailySwap = [
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
      <div className='flex justify-between'>
        <div>
          <p className='m-0 font-archia text-3xl font-semibold leading-9'>{t('Daily Swap')}</p>
          <p className='!mt-2 text-base leading-5 text-gray-400'>{t('Daily Swap description')}</p>
        </div>
        <a href='./'>
          <div className='rounded-lg bg-fuchsia-600 px-5 py-2 text-center leading-5 lg:mt-0 lg:px-4 lg:py-2.5 lg:text-base'>
            <span className='mr-1 '>{t('Swap now')}</span>
            <ArrowForwardSmallIcon className='inline-block h-4 w-4' />
          </div>
        </a>
      </div>
      <div className='grid grid-cols-2 gap-5 lg:grid-cols-7'>
        {dailySwap.map(swap => (
          <div key={swap.id}>
            <div
              className={cn(
                'relative flex flex-col items-center rounded-xl border-2 border-neutral-800 bg-neutral-800 px-[19px] py-3 hover:border-purple',
                swap.checked ? 'border-purple' : '',
              )}
            >
              <p className='font-archia text-[22px] leading-7'>{`${t('Day')} ${swap.index}`}</p>
              <hr className='my-4 w-full border-neutral-600' />
              {swap.checked ? (
                <CheckPurpleLargeIcon className='mt-3 h-[60px] w-[60px]' />
              ) : (
                <StarLineLargeIcon className='mt-3 h-[60px] w-[60px]' />
              )}
              <p className='text-[18px] leading-7'>{`+${swap.pts} ${t('PTS')}`}</p>
              {swap.ratio !== 1 && (
                <div className='absolute right-[-2px] top-[-2px] rounded-bl-xl rounded-tr-xl bg-[rgba(220,0,212,1)] px-[5px] text-base font-semibold leading-7'>
                  {swap.ratio}X
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Box>
  )
}
