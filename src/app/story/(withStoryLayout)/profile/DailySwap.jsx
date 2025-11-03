import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

import ArrowForwardSmallIcon from '~/svgs/arrow-forward-small.svg'
import CheckPurpleLargeIcon from '~/svgs/check-purple-large.svg'
import StarLineLargeIcon from '~/svgs/star-line-large.svg'

const BASE_DAILY_SWAP_POINT = 10

export function DailySwap({ dailySwaps, userSwaps }) {
  const t = useTranslations()
  // eslint-disable-next-line newline-per-chained-call
  const currentDate = dayjs().utc().hour(0).minute(0).second(0)

  const nextIndexSwap = useMemo(() => {
    if (!userSwaps.lastSwap || typeof userSwaps?.day !== 'number') return 0

    return userSwaps.day + 1
  }, [userSwaps])

  const canSwapToday = useMemo(() => {
    if (!userSwaps.lastSwap) return true

    const lastSwap = dayjs(userSwaps.lastSwap).utc()
    return lastSwap.isBefore(currentDate)
  }, [userSwaps, currentDate])
  return (
    <div className='border-gradient-secondary flex flex-col gap-4 rounded-xl p-px'>
      <Box>
        <div className='mb-3 flex flex-col justify-between lg:flex-row'>
          <div>
            <TextHeading className='font-archia block text-3xl font-semibold'>{t('Daily Swap')}</TextHeading>
            <TextSubHeading className='mt-2 block text-base text-neutral-300'>
              {t('Daily Swap description')}
            </TextSubHeading>
          </div>
          <Link href='/swap'>
            <PrimaryButton className='my-3 h-fit w-full lg:my-0 lg:w-auto'>
              <span className='mr-1'>{t('Swap now')}</span>
              <ArrowForwardSmallIcon className='inline-block h-4 w-4' />
            </PrimaryButton>
          </Link>
        </div>
        <div className='grid grid-cols-1 gap-[10px] lg:grid-cols-7 lg:gap-3 xl:gap-5'>
          {dailySwaps.map(task => (
            <div key={task.id}>
              <div
                className={cn(
                  'hover:border-primary-600 relative flex flex-row items-center justify-between rounded-xl border-2 border-neutral-800 bg-neutral-800 px-[19px] py-4 pb-4 lg:flex-col lg:justify-center lg:px-3 lg:py-3 lg:pb-5 xl:pb-7',
                  typeof userSwaps?.day === 'number' && task.index <= userSwaps?.day
                    ? 'border-primary-600 mb-[10px] lg:mb-0'
                    : '',
                  task.index === nextIndexSwap && canSwapToday ? 'mb-[10px] lg:mb-0' : '',
                )}
              >
                <p className='font-archia text-[22px] leading-7'>
                  {`${t.rich('Day [dayNumber]', {
                    dayNumber: task.index + 1,
                  })}`}
                </p>
                <hr className='my-2 hidden w-full border-neutral-600 lg:block xl:my-4' />
                <div className='flex flex-row items-center justify-between lg:flex-col lg:justify-center'>
                  {typeof userSwaps?.day === 'number' && task.index <= userSwaps?.day ? (
                    <CheckPurpleLargeIcon className='order-2 h-6 w-6 lg:order-1 lg:mt-1 lg:h-[50px] lg:w-[50px] xl:mt-3 xl:h-[60px] xl:w-[60px]' />
                  ) : (
                    <StarLineLargeIcon className='order-2 h-6 w-6 lg:order-1 lg:mt-1 lg:h-[50px] lg:w-[50px] xl:mt-3 xl:h-[60px] xl:w-[60px]' />
                  )}
                  <p className='order-1 mt-2 text-[18px] leading-7 lg:order-2'>
                    {`+${task.rewardAmount?.[0]} ${t('PTS')}`}
                  </p>
                  {task.rewardAmount[0] !== BASE_DAILY_SWAP_POINT && (
                    <div className='absolute top-[-2px] right-[-2px] w-max rounded-tr-xl rounded-bl-xl bg-[rgba(220,0,212,1)] px-[5px] text-xs leading-5 font-semibold lg:text-sm lg:leading-5 xl:text-base xl:leading-7'>
                      {task.rewardAmount[0] / BASE_DAILY_SWAP_POINT}X
                    </div>
                  )}

                  {typeof userSwaps?.day === 'number' && task.index <= userSwaps?.day && (
                    <div
                      className='bg-primary-800 absolute bottom-1 left-1/2 rounded-lg px-3 py-[5px] text-center leading-5 font-medium tracking-wider lg:bottom-0 lg:text-xs xl:text-[15px]'
                      style={{
                        transform: 'translate(-50%, 50%)',
                      }}
                    >
                      {t('Completed').toUpperCase()}
                    </div>
                  )}

                  {task.index === nextIndexSwap && canSwapToday && (
                    <Link href='/swap'>
                      <div
                        className='absolute bottom-1 left-1/2 w-max rounded-lg border border-[#4F375A] bg-neutral-800 px-3 py-[5px] text-center leading-5 font-medium tracking-wider lg:bottom-0 lg:text-xs xl:text-[15px]'
                        style={{
                          transform: 'translate(-50%, 50%)',
                        }}
                      >
                        {t('Swap now').toUpperCase()}
                      </div>
                    </Link>
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
