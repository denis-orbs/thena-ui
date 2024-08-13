import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import LockIcon from '~/svgs/lock.svg'

import { CountDownNextChapter } from './CountDownNextChapter'
import { WeekProcess } from './WeekProcess'

export function Process() {
  const t = useTranslations()
  const weeks = [
    {
      id: 1,
      index: 1,
      avaiable: true,
      taskComleted: 2,
      totalTasks: 14,
      chapters: [
        {
          id: 1,
          index: 1,
          title: 'Enter ARENA',
          tasks: [
            {
              id: 1,
              index: 1,
              title: 'Join one of the BNB Chain sponsored trading competitions',
              completed: true,
            },
            {
              id: 1,
              index: 2,
              title: 'Mint .thena ID',
              completed: true,
            },
          ],
        },
        {
          id: 2,
          index: 2,
          title: 'Concentrating on Liquidity',
          tasks: [
            {
              id: 1,
              index: 1,
              title: 'Swap THE with any token',
              completed: false,
            },
            {
              id: 1,
              index: 2,
              title: 'Stake into THE/BNB (any CL version)',
              completed: false,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      index: 2,
      avaiable: true,
      taskComleted: 2,
      totalTasks: 14,
      chapters: [
        {
          id: 1,
          index: 1,
          title: 'Concentrating on Liquidity',
          tasks: [
            {
              id: 1,
              index: 1,
              title: 'Swap THE with any token',
              completed: false,
            },
            {
              id: 1,
              index: 2,
              title: 'Stake into THE/BNB (any CL version)',
              completed: false,
            },
          ],
        },
      ],
    },
    {
      id: 3,
      index: 1,
      avaiable: false,
      taskComleted: 2,
      totalTasks: 14,
      chapters: [
        {
          id: 1,
          index: 1,
          title: '',
          tasks: [
            {
              id: 1,
              index: 1,
              title: '',
              completed: true,
            },
          ],
        },
      ],
    },
  ]
  const [selectedWeek, setSelectedWeek] = useState(weeks[0])

  return (
    <div>
      <div className='flex flex-row'>
        {weeks.map((week, index) => (
          <div
            key={week.id}
            type='button'
            className={cn(
              'mr-2 gap-2',
              'rounded-lg px-4 py-2.5',
              'rounded px-3 py-2 text-xs',
              'lg:rounded-lg lg:px-4 lg:py-2.5 lg:text-base',
              'font-medium text-neutral-200',
              'outline outline-2 outline-offset-4 outline-transparent',
              'transition-all duration-150 ease-out',
              'disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500',
              week.id === selectedWeek.id && 'bg-neutral-800',
              !week.avaiable
                ? 'cursor-not-allowed bg-neutral-900'
                : 'cursor-pointer hover:bg-neutral-800 hover:text-neutral-100 active:outline-focus ',
            )}
            disabled={!week.avaiable}
            onClick={() => {
              if (week.avaiable) {
                setSelectedWeek(week)
              }
            }}
          >
            <div className='flex  flex-row'>
              {!week.avaiable && <LockIcon className='mr-1 h-5 w-5' />}
              {`${t('Week')} ${index + 1}`}
            </div>
          </div>
        ))}
      </div>
      <div className='mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-8'>
          <WeekProcess week={selectedWeek} />
        </div>
        <div className='col-span-12 lg:col-span-4'>
          <div className='rounded-lg bg-neutral-900 px-4 py-6'>
            <h2>{t('Next Chapter Available in')}</h2>
            <CountDownNextChapter />
          </div>
        </div>
      </div>
    </div>
  )
}
