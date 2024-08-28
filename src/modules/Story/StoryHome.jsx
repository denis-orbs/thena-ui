'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { useTHEStory } from '@/context/THEStoryContext'
import useWallet from '@/lib/wallets/useWallet'
import { ChevronRightIcon, LogoTextIcon } from '@/svgs'

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

  const [isMuted, setIsMuted] = useState(true)

  const settingSound = () => {
    if (videoRef.current) {
      setIsMuted(prev => !prev)
    }
  }

  const handleScroll = () => {
    window.scrollBy({
      top: registerFormRef.current.getBoundingClientRect().top - 200,
      left: 0,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {isUpcoming ? (
        <div className='w-full'>
          {/* Banner */}
          {!isRegistered && (
            <Banner handleScroll={handleScroll} isMuted={isMuted} videoRef={videoRef} settingSound={settingSound} />
          )}

          <div className='mb-5 flex justify-center' ref={registerFormRef}>
            <StoryRegister isRegistered={isRegistered} />
          </div>
          <Box className='mx-auto bg-neutral-900 max-sm:max-w-[413px] lg:w-[610px]'>
            <p className='mb-5 font-archia text-[26px] font-semibold md:text-3xl md:tracking-wide'>
              {t('First Chapter Available in')}
            </p>
            <Countdown timestamp={campaignStartsAt} />
          </Box>
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
              <span className='inline-block align-middle'>
                <LogoTextIcon className='w-90 ml-1 mr-0 h-[18px] lg:h-[20px] lg:w-[100px]' />
              </span>
              <span className='ml-[-8px]'>!&nbsp;</span>
              {t('Over 8 epic weeks')}
            </p>
          </div>
          {isRegistered && (
            <div className='mx-auto max-w-[850px]'>
              <Chapters chapters={chapters} isLoading={isLoadingChapterTasks} />
              <div className='mt-6 flex w-full justify-center'>
                <PrimaryButton className='h-auto w-full md:w-[420px]'>
                  {t('View BNB Chain')}
                  <ChevronRightIcon className='h-4 w-4 text-white' />
                </PrimaryButton>
              </div>

              <div className='h- mt-[124px] flex max-w-[813px] flex-col justify-center'>
                <p className='text-center font-archia text-[31px] font-semibold lg:text-[70px]'>{t('Unlock Over')}</p>
                <p className='mb-5 text-center font-archia text-[31px] font-semibold lg:text-[70px]'>
                  {t('$30,000 in Rewards')}
                </p>
                <p className='mb-8 text-center text-[16px] lg:text-[20px]'>
                  {t('Embark on an 8-week adventure where each chapter unlocks')}
                  <span className='font-semibold text-[#F0B90B]'>&nbsp;{t('BNB Chain’s 4th anniversary')}&nbsp;</span>
                  {t('and join the journey with more than $30,000 in rewards')}
                </p>
                <div className='mx-auto'>
                  <PrimaryButton className='h-11 w-[174px]'>{t('Start Your Chapter')}</PrimaryButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default StoryHome
