import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { cn } from '@/lib/utils'
import { ArrowForwardSmallIcon, CheckPurpleLargeIcon, StarLineLargeIcon } from '@/svgs'

export function DailySwap({ dailySwaps }) {
  const t = useTranslations()

  return (
    <div className='border-gradient-secondary space-y-4 rounded-xl p-[1px]'>
      <Box>
        <div className='flex flex-col justify-between lg:flex-row '>
          <div>
            <p className='m-0 font-archia text-3xl font-semibold leading-9'>{t('Daily Swap')}</p>
            <p className='!mt-2 text-base leading-5 text-gray-400'>{t('Daily Swap description')}</p>
          </div>
          <PrimaryButton className='my-3 w-full lg:my-0 lg:w-auto'>
            <span className='mr-1 '>{t('Swap now')}</span>
            <ArrowForwardSmallIcon className='inline-block h-4 w-4' />
          </PrimaryButton>
        </div>
        <div className='grid grid-cols-2 gap-5 lg:grid-cols-7'>
          {dailySwaps.map(swap => (
            <div key={swap.id}>
              <div
                className={cn(
                  'relative flex flex-col items-center rounded-xl border-2 border-neutral-800 bg-neutral-800 px-[19px] py-3 hover:border-purple',
                  swap.isCompleted ? 'border-purple' : '',
                )}
              >
                <p className='font-archia text-[22px] leading-7'>{`${t('Day')} ${swap.index + 1}`}</p>
                <hr className='my-4 w-full border-neutral-600' />
                {swap.isCompleted ? (
                  <CheckPurpleLargeIcon className='mt-3 h-[60px] w-[60px]' />
                ) : (
                  <StarLineLargeIcon className='mt-3 h-[60px] w-[60px]' />
                )}
                <p className='text-[18px] leading-7'>{`+${swap.rewardAmount?.[0]} ${t('PTS')}`}</p>
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
    </div>
  )
}
