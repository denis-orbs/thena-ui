import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { CountDownNextChapter } from '@/app/story/(withStoryLayout)/dashboard/CountDownNextChapter'
import Box from '@/components/box'
import { OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { ChevronRightIcon, ExpandIcon } from '@/svgs'

import Chapters from './Chapters'
import StoryRegister from './StoryRegister'

function StoryHome({ isUpcoming, isRegistered }) {
  const t = useTranslations()
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
            <StoryRegister isRegistered={isRegistered} />
          </div>
          <Box className='mx-auto bg-neutral-900 max-sm:max-w-[413px] lg:w-[610px]'>
            <p className='mb-4 font-archia text-[26px] font-semibold md:text-3xl md:tracking-wide'>
              {t('First Chapter Available in')}
            </p>
            <CountDownNextChapter />
          </Box>
        </div>
      ) : (
        <div className='w-full'>
          <div className='z-10 mb-[115px]'>
            <div className='mb-9 flex justify-center'>
              <StoryRegister isRegistered={isRegistered} />
            </div>

            <p className='mx-auto mb-5 max-w-[743px] text-center font-archia text-[36px] font-semibold md:text-[72px]'>
              {t('THE Story of THENA')}
            </p>
            <p className='mx-auto max-w-[743px] text-center text-[20px] text-[#D1D0D2]'>
              {t('Embark on The Story of THENA')}
            </p>
          </div>
          {isRegistered && (
            <div className='mx-auto max-w-[850px]'>
              <Chapters showCountDownNextChapter />
              <div className='mt-6 flex w-full justify-center'>
                <PrimaryButton className='h-auto w-full md:w-[420px]'>
                  {t('View BNB Chain')}
                  <ChevronRightIcon className='h-4 w-4 text-white' />
                </PrimaryButton>
              </div>

              <div className='h- mt-[124px] flex max-w-[813px] flex-col justify-center'>
                <p className='mb-5 text-center font-archia text-[31px] font-semibold lg:text-[70px]'>
                  {t('Unlock Over $30,000 in Rewards')}
                </p>
                <p className='mb-8 text-center text-[16px] lg:text-[20px]'>
                  {t('Dive into The Story of THENA and stand a chance to win big1')}
                  <span className='text-[16px] text-[#F0B90B] lg:text-[20px]'>&nbsp;{t('BNB Chain')}.</span>
                  {t('Dive into The Story of THENA and stand a chance to win big2')}
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
