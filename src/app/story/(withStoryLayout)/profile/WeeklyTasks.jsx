import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import ChevronRightIcon from '@/icons/ChevronRightIcon'
import { Countdown } from '@/modules/Countdown'
import { isoDateToTimeStampSeconds } from '@/utils/utils'

import { ChapterProcess } from './ChapterProcess'
import { ChapterTabNavigator } from './ChapterTabNavigator'

export function WeeklyTasks({ chapters, selectedChapterIndex, setSelectedChapterIndex }) {
  const t = useTranslations()
  const currentActiveChapter = useMemo(() => {
    const currentTime = new Date()
    return chapters.find(chapter => {
      const startTime = new Date(chapter?.startTimestamp ?? 0)
      const endTime = new Date(chapter?.endTimestamp ?? 0)

      return currentTime >= startTime && currentTime <= endTime
    })
  }, [chapters])

  const countDownTimeStamp = useMemo(() => {
    if (currentActiveChapter) {
      return isoDateToTimeStampSeconds(currentActiveChapter.endTimestamp)
    }

    const nextChapter = chapters.find(chapter => !chapter.available)

    if (nextChapter) {
      try {
        return isoDateToTimeStampSeconds(nextChapter.startTimestamp)
      } catch (error) {
        console.log(error)
      }
    }
    return 0
  }, [chapters, currentActiveChapter])

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
      chapters.filter(chapter => chapter.available && chapter.isCompleted).length,
      chapters.filter(chapter => chapter.available).length,
    ],
    [chapters],
  )

  const isViewBNBChainButton = useMemo(() => {
    const currentTime = new Date()
    const endChapter2 = new Date(chapters?.[1]?.endTimestamp ?? 0)
    return currentTime < endChapter2
  }, [chapters])

  return (
    <div className='mt-[63px]'>
      <TextHeading className='font-archia block text-3xl font-semibold'>{t('Weekly Tasks')}</TextHeading>
      <TextSubHeading className='mt-2 block text-base text-neutral-300 lg:max-w-[60%]'>
        {t('Weekly task description')}
      </TextSubHeading>
      <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          <ChapterTabNavigator
            chapters={chapters}
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
          {countDownTimeStamp ? (
            <>
              <div className='rounded-lg bg-neutral-900 px-6 py-6'>
                <h2 className='font-archia mb-6 text-[26px] leading-[26px] lg:text-[30px] lg:leading-6'>
                  {currentActiveChapter && t('Current Chapter Ends in')}
                  {!currentActiveChapter && countDownTimeStamp && t('Next Chapter Available in')}
                </h2>
                {countDownTimeStamp && <Countdown timestamp={countDownTimeStamp} />}
              </div>
              {isViewBNBChainButton && (
                <Link
                  href='https://dappbay.bnbchain.org/campaign/join-bnb-chain-4-year-ecosystem-celebration-with-$300K-in-rewards'
                  className='w-full'
                  target='_blank'
                >
                  <PrimaryButton className='mt-4 w-full lg:mt-9'>
                    <div className='flex items-center justify-between'>
                      <span className='mr-1 text-left'>{t('View BNB Chain')}</span>
                      <ChevronRightIcon />
                    </div>
                  </PrimaryButton>
                </Link>
              )}
            </>
          ) : (
            <div className='rounded-lg bg-neutral-900 p-6'>
              <h2>
                {t('Next Chapter Available in')}: <span className='text-primary-600'>TBA</span>
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
