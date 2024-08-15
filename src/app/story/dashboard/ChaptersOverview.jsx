import { useTranslations } from 'next-intl'

import { TextHeading } from '@/components/typography'

import { ChapterOverviewProcess } from './ChapterOverviewProcess'

export function ChaptersOverview() {
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
          title: 'Mint .thena ID',
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
      title: 'Coming Soon...',
    },
    {
      id: 4,
      index: 4,
      title: 'Coming Soon...',
    },
    {
      id: 5,
      index: 5,
      title: 'Coming Soon...',
    },
    {
      id: 6,
      index: 6,
      title: 'Coming Soon...',
    },
  ]

  return (
    <div className='mt-[70px]'>
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>
        {t('All Chapters Overview')}
      </TextHeading>
      <div className='mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12'>
        {chapters.map(chapter => (
          <ChapterOverviewProcess chapter={chapter} key={chapter.id} />
        ))}
      </div>
    </div>
  )
}
