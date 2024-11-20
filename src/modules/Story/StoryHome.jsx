'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { useTHEStory } from '@/context/THEStoryContext'
import useWallet from '@/hooks/useWallet'
import { isoDateToTimeStampSeconds } from '@/lib/utils'
import { ChevronRightIcon, LogoTextIcon, LogoWithTextIcon } from '@/svgs'

import { useFetchChaptersAndTasks } from '.'
import Banner from './Banner'
import Chapters from './Chapters'
import StoryRegister from './StoryRegister'
import { Countdown } from '../Countdown'

function StoryHome({ isUpcoming, isRegistered }) {
  const t = useTranslations()

  const videoRef = useRef(null)
  const registerFormRef = useRef(null)

  const { account } = useWallet()
  const { campaignStartsAt } = useTHEStory()
  const { campaignChapters: chapters, isLoading: isLoadingChapterTasks } = useFetchChaptersAndTasks(
    account?.toLowerCase(),
  )

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

  const [isMuted, setIsMuted] = useState(true)

  const settingSound = () => {
    if (videoRef.current) {
      setIsMuted(prev => !prev)
    }
  }

  const handleScroll = () => {
    window.scrollBy({
      top: registerFormRef.current.getBoundingClientRect().top - 170,
      left: 0,
      behavior: 'smooth',
    })
  }

  const isViewBNBChainButton = useMemo(() => {
    const currentTime = new Date()
    const endChapter2 = new Date(chapters?.[1]?.endTimestamp ?? 0)
    return currentTime < endChapter2
  }, [chapters])

  return (
    <>
      {isUpcoming ? (
        <div className='w-full'>
          {/* Banner */}
          {!isRegistered && (
            <Banner handleScroll={handleScroll} isMuted={isMuted} videoRef={videoRef} settingSound={settingSound} />
          )}

          <div className='flex flex-col justify-center gap-6 lg:flex-row lg:gap-8'>
            <div className='mx-auto max-w-xl text-center lg:mx-0 lg:mt-10 lg:w-[45%]'>
              <div className='mb-5 flex flex-wrap items-center justify-center gap-2'>
                <p className='font-archia text-[36px] font-semibold md:text-[72px]'>THE Story of</p>
                <div className='flex justify-center'>
                  <LogoWithTextIcon className=' w-[152px] md:w-[268px]' />
                </div>
              </div>
              <p className='leading-[1.3] text-[#D1D0D2] lg:text-[18px]'>
                {t('Embark on The Story of THENA')}
                {'! '}
                {t('Over 8 epic weeks')}
              </p>
            </div>

            <div>
              <div className='mb-5 flex justify-center' ref={registerFormRef}>
                <StoryRegister isRegistered={isRegistered} />
              </div>
              <Box className='mx-auto bg-neutral-900 max-sm:max-w-[413px] md:w-[610px]'>
                <p className='mb-5 font-archia text-[26px] font-semibold md:text-3xl md:tracking-wide'>
                  {t('First Chapter Available in')}
                </p>
                <Countdown timestamp={campaignStartsAt} />
              </Box>
            </div>
          </div>
        </div>
      ) : (
        <div className='w-full'>
          <div className='z-10 mb-[115px]'>
            <div className='mb-9 flex justify-center' ref={registerFormRef}>
              <StoryRegister isRegistered={isRegistered} />
            </div>

            <p className='mx-auto mb-5 max-w-[743px] text-center font-archia text-[36px] font-semibold md:text-[72px]'>
              {t('THE Story of THENA')}
            </p>
            <p className='mx-auto max-w-[743px] text-center text-[20px] leading-none text-[#D1D0D2]'>
              {t('Embark on The Story of THENA')}
              <span className='inline-block align-bottom'>
                <LogoTextIcon className='ml-1 mr-2 h-[20px] w-[90px]' />
              </span>
              <span className='lg:ml-[-8px]'>!&nbsp;</span>
              {t('Over 8 epic weeks')}
            </p>
          </div>
          {isRegistered && (
            <div className='mx-auto max-w-[850px]'>
              <Chapters chapters={chapters} isLoading={isLoadingChapterTasks} />
              {countDownTimeStamp ? (
                <>
                  <div className='mt-4 rounded-lg bg-transparent px-6 py-6'>
                    <h2 className='mb-6 text-center font-archia text-[26px] leading-[26px] lg:text-[30px] lg:leading-6'>
                      {currentActiveChapter && t('Current Chapter Ends in')}
                      {!currentActiveChapter && countDownTimeStamp && t('Next Chapter Available in')}
                    </h2>
                    {countDownTimeStamp && <Countdown timestamp={countDownTimeStamp} />}
                  </div>
                </>
              ) : (
                <div className='mt-4 rounded-lg bg-transparent px-6 py-6'>
                  <h2 className='mb-6 text-center font-archia text-[26px] leading-[26px] lg:text-[30px] lg:leading-6'>
                    {t('Next Chapter Available in')}: <span className='text-primary-600'>TBA</span>
                  </h2>
                </div>
              )}
              {isViewBNBChainButton && (
                <div className='mt-6 flex w-full justify-center'>
                  <Link
                    href='https://dappbay.bnbchain.org/campaign/join-bnb-chain-4-year-ecosystem-celebration-with-$300K-in-rewards'
                    target='_blank'
                  >
                    <PrimaryButton className='h-auto w-full md:w-[420px]'>
                      {t('View BNB Chain')}
                      <ChevronRightIcon className='h-4 w-4 text-white' />
                    </PrimaryButton>
                  </Link>
                </div>
              )}

              <div className='mx-auto mt-16 flex max-w-[813px] flex-col justify-center xl:mt-28'>
                <p className='text-center font-archia text-[31px] font-semibold lg:text-[70px]'>{t('Unlock Over')}</p>
                <p className='mb-5 text-center font-archia text-[31px] font-semibold lg:text-[70px]'>
                  {t('$30,000 in Rewards')}
                </p>
                <p className='mb-8 text-center text-[16px] lg:text-[20px]'>
                  {t('Embark on an 8-week adventure where each chapter unlocks')}
                  <span className='font-semibold text-[#F0B90B]'>&nbsp;{t('BNB Chain’s 4th anniversary')}&nbsp;</span>
                  {t('and join the journey with more than $30,000 in rewards')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default StoryHome
