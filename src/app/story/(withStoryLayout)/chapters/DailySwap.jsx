import Link from 'next/link'
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
        <div className='mb-3 flex flex-col justify-between  lg:flex-row'>
          <div>
            <p className='m-0 font-archia text-3xl font-semibold leading-9'>{t('Daily Swap')}</p>
            <p className='!mt-2 text-base leading-5 text-gray-400'>{t('Daily Swap description')}</p>
          </div>
          <Link href='/swap'>
            <PrimaryButton className='my-3 h-fit w-full lg:my-0 lg:w-auto'>
              <span className='mr-1 '>{t('Swap now')}</span>
              <ArrowForwardSmallIcon className='inline-block h-4 w-4' />
            </PrimaryButton>
          </Link>
        </div>
        <div className='grid grid-cols-1 gap-[10px] lg:grid-cols-7 lg:gap-5'>
          {dailySwaps.map(swap => (
            <div key={swap.id}>
              <div
                className={cn(
                  'relative flex flex-row items-center justify-between rounded-xl border-2 border-neutral-800 bg-neutral-800 px-[19px] py-4 hover:border-primary-600 lg:flex-col lg:justify-center lg:py-3',
                  swap.isCompleted ? 'border-primary-600' : '',
                )}
              >
                <p className='font-archia text-[22px] leading-7'>{`${t('Day')} ${swap.index + 1}`}</p>
                <hr className='my-4 hidden w-full border-neutral-600 lg:block' />
                <div className='flex flex-row items-center justify-between lg:flex-col lg:justify-center'>
                  {swap.isCompleted ? (
                    <CheckPurpleLargeIcon className='order-2 h-6 w-6 lg:order-1 lg:mt-3 lg:h-[60px] lg:w-[60px]' />
                  ) : (
                    <StarLineLargeIcon className='order-2 h-6 w-6 lg:order-1 lg:mt-3 lg:h-[60px] lg:w-[60px]' />
                  )}
                  <p className='order-1 text-[18px] leading-7 lg:order-2'>{`+${swap.rewardAmount?.[0]} ${t('PTS')}`}</p>
                  {swap.ratio !== 1 && (
                    <div className='absolute right-[-2px] top-[-2px] rounded-bl-xl rounded-tr-xl bg-[rgba(220,0,212,1)] px-[5px] text-xs font-semibold leading-5 lg:text-base lg:font-semibold lg:leading-7'>
                      {swap.ratio}X
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Box>
    </div>
  )
}
