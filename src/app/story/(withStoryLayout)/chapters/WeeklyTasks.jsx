import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { isoDateToTimeStampSeconds } from '@/lib/utils'
import { Countdown } from '@/modules/Countdown'
import { ChevronRightIcon } from '@/svgs'

import { ChapterProcess } from './ChapterProcess'
import { ChapterTabNavigator } from './ChapterTabNavigator'

export function WeeklyTasks({ chapters, selectedChapterIndex, setSelectedChapterIndex }) {
  const t = useTranslations()

  const nextAvailableChapterTimeStamp = useMemo(() => {
    const nextChapter = chapters.find(chapter => !chapter.available)
    const availableChapters = chapters.filter(chapter => chapter.available).sort((c1, c2) => c1.index - c2.index)
    const lastAvailableChapter = availableChapters?.[availableChapters.length - 1]?.index ?? 1

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
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Weekly Tasks')}</TextHeading>
      <TextSubHeading className=' mt-2 block  text-base font-normal leading-5 text-gray-400 lg:max-w-[60%]'>
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
          {Boolean(nextAvailableChapterTimeStamp) && (
            <>
              <div className='rounded-lg bg-neutral-900 px-6 py-6'>
                <h2 className='mb-6 font-archia'>{t('Next Chapter Available in')}</h2>
                <Countdown timestamp={nextAvailableChapterTimeStamp} />
              </div>
              {isViewBNBChainButton && (
                <Link
                  href='https://dappbay.bnbchain.org/campaign/join-bnb-chain-4-year-ecosystem-celebration-with-$300K-in-rewards'
                  className='w-full'
                  target='_blank'
                >
                  <PrimaryButton className='mt-4 w-full lg:mt-9'>
                    <div className=' flex items-center justify-between'>
                      <span className='mr-1 text-left'>{t('View BNB Chain')}</span>
                      <ChevronRightIcon className='size-4' />
                    </div>
                  </PrimaryButton>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
