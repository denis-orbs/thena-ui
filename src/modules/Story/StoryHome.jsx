import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { CountDownNextChapter } from '@/app/story/(withStoryLayout)/dashboard/CountDownNextChapter'
import Box from '@/components/box'
import { OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import useWallet from '@/lib/wallets/useWallet'
import { ChevronRightIcon, ExpandIcon, LogoTextIcon } from '@/svgs'

import { fetchCampaignChapter, useFetchChaptersAndTasks } from '.'
import Chapters from './Chapters'
import StoryRegister from './StoryRegister'

function StoryHome({ isUpcoming, isRegistered }) {
  const t = useTranslations()

  const { account } = useWallet()
  const { campaignChapters: chapters, isLoading: isLoadingChapterTasks } = useFetchChaptersAndTasks(
    account?.toLowerCase(),
  )

  const [timeStartFirstChapter, setTimeStartFirstChapter] = useState(null)

  const fetFirstCampaignChapter = useCallback(async () => {
    const { startTimestamp } = await fetchCampaignChapter(1)
    setTimeStartFirstChapter(startTimestamp)
  }, [])

  useEffect(() => {
    fetFirstCampaignChapter()
  }, [fetFirstCampaignChapter])

  return (
    <>
      {isUpcoming ? (
        <div className='w-full'>
          {/* Banner */}
          <div className='h-auto w-auto rounded-[20px] bg-[#382F411F] px-2 pt-2 md:px-[15px] md:pt-[15px]'>
            <div className='relative mb-24 lg:mb-40'>
              <Image
                src='/images/story/story-banner.png'
                alt='Story banner'
                width={1410}
                height={793}
                className='w-full rounded-[10px]'
              />
              <OutlinedButton className='absolute right-4 top-5 border-none p-2 md:hidden'>
                <ExpandIcon className='h-4 w-4' />
              </OutlinedButton>
              <div className='absolute bottom-[-30px] left-0 w-full p-0 text-center font-archia text-[30px] font-semibold text-white lg:bottom-0 lg:px-4 lg:pb-9 lg:text-[72px]'>
                {t('Get Ready for THE Story of THENA')}
              </div>
            </div>
          </div>

          <div className='mb-5 flex justify-center'>
            <StoryRegister isRegistered={isRegistered} isUpcoming={isUpcoming} />
          </div>
          <Box className='mx-auto bg-neutral-900 max-sm:max-w-[413px] lg:w-[610px]'>
            <p className='mb-4 font-archia text-[26px] font-semibold md:text-3xl md:tracking-wide'>
              {t('First Chapter Available in')}
            </p>
            <CountDownNextChapter targetDate={timeStartFirstChapter} />
          </Box>
        </div>
      ) : (
        <div className='w-full'>
          <div className='z-10 mb-[115px]'>
            <div className='mb-9 flex justify-center'>
              <StoryRegister isRegistered={isRegistered} isUpcoming={isUpcoming} />
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
