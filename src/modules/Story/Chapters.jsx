import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { ChapterProcess } from '@/app/story/(withStoryLayout)/dashboard/ChapterProcess'
import { cn } from '@/lib/utils'
import { ChapterUnlockIcon, Lock2Icon } from '@/svgs'

export default function Chapters({ className, onSetSelectedChapter }) {
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
    <div className={className}>
      <div className='mb-5 grid grid-cols-6 gap-[14px]'>
        {chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            type='button'
            className={cn(
              'rounded-xl border-[1px] border-neutral-900 bg-neutral-900  py-[13px] text-[15px] font-medium leading-[35px]',
              chapter.id === selectedChapter.id && 'border-purple',
              !chapter.available ? 'cursor-not-allowed' : 'cursor-pointer hover:border-purple',
            )}
            disabled={!chapter.available}
            onClick={() => {
              if (chapter.available) {
                setSelectedChapter(chapter)
                onSetSelectedChapter(chapter)
              }
            }}
          >
            <div className='flex flex-row items-center justify-center '>
              {chapter.available ? (
                <ChapterUnlockIcon className='mr-1 h-5 w-5' />
              ) : (
                <Lock2Icon className='mr-1 h-5 w-5' />
              )}
              <span className={!chapter.available ? 'opacity-40' : ''}>{`${t('Chapter')} ${index + 1}`}</span>
            </div>
          </div>
        ))}
      </div>
      <ChapterProcess chapter={selectedChapter} />
    </div>
  )
}
