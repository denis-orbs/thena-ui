import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { isoDateToTimeStampSeconds } from '@/lib/utils'
import { Countdown } from '@/modules/Countdown'

import { ChapterProcess } from './ChapterProcess'
import { ChapterTabNavigator } from './ChapterTabNavigator'

export function WeeklyTasks({ chapters, selectedChapterIndex, setSelectedChapterIndex }) {
  const t = useTranslations()

  const nextAvailableChapterTimeStamp = useMemo(() => {
    const nextChapter = chapters.find(chapter => !chapter.available)
    const lastAvailableChapter = [...chapters].reverse().find(chapter => chapter.available)
    if (nextChapter) {
      try {
        return isoDateToTimeStampSeconds(nextChapter.startTimestamp)
      } catch (error) {
        console.log(error)
      }
    } else if (lastAvailableChapter) {
      try {
        return isoDateToTimeStampSeconds(lastAvailableChapter.endTimestamp)
      } catch (error) {
        console.log(error)
      }
    }
    return 0
  }, [chapters])

  const currentChapter = useMemo(
    () => chapters.find(c => c.index === selectedChapterIndex),
    [chapters, selectedChapterIndex],
  )

  const preChapterIndex = useMemo(() => {
    const index = selectedChapterIndex - 1
    const chapter = chapters.find(c => c.index === index)

    if (chapter) return index
    return undefined
  }, [selectedChapterIndex, chapters])

  const nextChapterIndex = useMemo(() => {
    const index = selectedChapterIndex + 1
    const chapter = chapters.find(c => c.index === index)

    if (chapter?.available) return index
    return undefined
  }, [chapters, selectedChapterIndex])

  const [numberCompletedChapters, numberAvailableChapters] = useMemo(
    () => [
      chapters.filter(chapter => chapter.isCompleted).length,
      chapters.filter(chapter => chapter.available).length,
    ],
    [chapters],
  )

  const hardChapters = [
    {
      id: '1',
      index: 1,
      name: 'Enter ARENA',
      startTimestamp: '2024-09-02T12:00:00.000000Z',
      endTimestamp: '2024-09-09T12:00:00.000000Z',
      tasks: [
        {
          actionHandle: 'arena/thena-id/mint',
          chapter: 1,
          id: '0000000',
          index: 0,
          name: 'Mint thena ID',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [0, 1],
          type: 'Main',
          isCompleted: false,
        },
        {
          actionHandle: 'arena/trading-competitions/0xf53a5053c09d9215b58da77a48aba3e66f355864-1',
          chapter: 1,
          id: '0000001',
          index: 1,
          name: 'Register for a BSC TC',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Main',
          isCompleted: false,
        },
        {
          actionHandle: 'tweet',
          chapter: 1,
          id: '0000002',
          index: 2,
          name: 'Tweet with hashtag StoryofTHENA',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Main',
          isCompleted: false,
        },
        {
          actionHandle: 'swap',
          chapter: null,
          id: '2000001',
          index: 0,
          name: 'Daily Swap-in',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Side',
          isCompleted: false,
        },
        {
          actionHandle: 'story/referral',
          chapter: null,
          id: '2000002',
          index: 1,
          name: 'Refer your friends',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Side',
          isCompleted: false,
        },
      ],
      isCompleted: false,
      available: false,
    },
    {
      id: '2',
      index: 2,
      name: 'Concentrating on Liquidity',
      startTimestamp: '2024-09-02T12:00:00.000000Z',
      endTimestamp: '2024-09-09T12:00:00.000000Z',
      tasks: [
        {
          actionHandle: 'swap',
          chapter: 2,
          id: '0000003',
          index: 0,
          name: 'Swap THE',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Main',
          isCompleted: false,
        },
        {
          actionHandle: 'pools/0x51bd5e6d3da9064d59bcaa5a76776560ab42ceb8',
          chapter: 2,
          id: '0000004',
          index: 1,
          name: 'Stake into THE/BNB (ICHI)',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Main',
          isCompleted: false,
        },
        {
          actionHandle: 'swap',
          chapter: null,
          id: '2000001',
          index: 0,
          name: 'Daily Swap-in',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Side',
          isCompleted: false,
        },
        {
          actionHandle: 'story/referral',
          chapter: null,
          id: '2000002',
          index: 1,
          name: 'Refer your friends',
          rewardType: ['Point', 'Fragment'],
          rewardAmount: [10, 0],
          type: 'Side',
          isCompleted: false,
        },
      ],
      isCompleted: false,
      available: false,
    },
  ]

  return (
    <div className='mt-[63px]'>
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Weekly Tasks')}</TextHeading>
      <TextSubHeading className=' mt-2 block  text-base font-normal leading-5 text-gray-400 lg:max-w-[60%]'>
        {t('Weekly task description')}
      </TextSubHeading>
      <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          <ChapterTabNavigator
            chapters={hardChapters}
            selectedChapterIndex={selectedChapterIndex}
            setSelectedChapterIndex={setSelectedChapterIndex}
          />
        </div>
      </div>
      <div className='mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          {currentChapter && (
            <ChapterProcess
              chapter={currentChapter}
              preChapterIndex={preChapterIndex}
              nextChapterIndex={nextChapterIndex}
              setSelectedChapterIndex={setSelectedChapterIndex}
              numberCompletedChapters={numberCompletedChapters}
              numberAvailableChapters={numberAvailableChapters}
            />
          )}
        </div>
        <div className='col-span-12 lg:col-span-5'>
          {Boolean(nextAvailableChapterTimeStamp) && (
            <div className='rounded-lg bg-neutral-900 px-6 py-6'>
              <h2 className='mb-6 font-archia'>{t('Next Chapter Available in')}</h2>
              <Countdown timestamp={nextAvailableChapterTimeStamp} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
