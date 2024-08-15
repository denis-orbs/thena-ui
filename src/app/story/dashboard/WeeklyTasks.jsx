import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { Lock2Icon } from '@/svgs'

import { ChapterProcess } from './ChapterProcess'
import { CountDownNextChapter } from './CountDownNextChapter'

export function WeeklyTasks() {
  const t = useTranslations()
  const chapters = [
    {
      id: 1,
      index: 1,
      title: 'Enter ARENA',
      available: true,
      tasks: [
        {
          id: 1,
          index: 1,
          title: 'Mint thena ID',
          completed: true,
          reward: {
            amount: 1,
            type: 'diamond',
          },
        },
        {
          id: 2,
          index: 2,
          title: 'Register for a BNB Chain-sponsored trading competition',
          completed: false,
          reward: {
            amount: 10,
            type: 'star',
          },
        },
        {
          id: 3,
          index: 3,
          title: 'Join Xspace',
          completed: false,
          reward: {
            amount: 10,
            type: 'star',
          },
        },
      ],
    },
    {
      id: 2,
      index: 2,
      title: 'Concentrating on Liquidity',
      available: false,
      tasks: [
        {
          id: 3,
          index: 3,
          title: 'Swap THE with any token',
          completed: false,
        },
        {
          id: 4,
          index: 4,
          title: 'Stake into THE/BNB (any CL version)',
          completed: false,
        },
      ],
    },
    {
      id: 3,
      index: 3,
    },
    {
      id: 4,
      index: 4,
    },
    {
      id: 5,
      index: 5,
    },
    {
      id: 6,
      index: 6,
    },
  ]
  const [selectedChapter, setSelectedChapter] = useState(chapters[0])

  return (
    <div className='mt-[63px]'>
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Weekly Tasks')}</TextHeading>
      <TextSubHeading className='mt-2  block text-base font-normal leading-5 text-gray-400'>
        {t('Weekly task description')}
      </TextSubHeading>
      <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          <div className='mt-5 grid grid-cols-2 gap-[14px] lg:grid-cols-6'>
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                type='button'
                className={cn(
                  'rounded-xl border-[1px] border-neutral-900 bg-neutral-900  py-[13px] text-[15px] font-medium leading-[35px]',
                  chapter.id === selectedChapter.id && 'border-purple',
                  !chapter.available ? 'cursor-not-allowed' : 'hover:border-purple cursor-pointer',
                )}
                disabled={!chapter.available}
                onClick={() => {
                  if (chapter.available) {
                    setSelectedChapter(chapter)
                  }
                }}
              >
                <div className='flex flex-row items-center justify-center '>
                  {!chapter.available && <Lock2Icon className='mr-1 h-5 w-5' />}
                  <span className={!chapter.available ? 'opacity-40' : ''}>{`${t('Chapter')} ${index + 1}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          <ChapterProcess chapter={selectedChapter} />
        </div>
        <div className='col-span-12 lg:col-span-5'>
          <div className='rounded-lg bg-neutral-900 px-6 py-6'>
            <h2 className='font-archia'>{t('Next Chapter Available in')}</h2>
            <p className='text-lg font-normal leading-5'>{t('Next Chapter description')}</p>
            <CountDownNextChapter />
          </div>
        </div>
      </div>
    </div>
  )
}
