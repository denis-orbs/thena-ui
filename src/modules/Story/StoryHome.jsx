import Image from 'next/image'
import { useTranslations } from 'next-intl'

import StoryRegister from './StoryRegister'

function StoryHome({ isUpcoming, isRegistered }) {
  const t = useTranslations()
  return (
    <>
      {isUpcoming ? (
        // TODO: add background
        <div>
          {/* Banner */}
          <div className='h-auto w-auto rounded-[20px] bg-[#382F411F] px-[15px] pt-[15px]'>
            <div className='relative mb-24 lg:mb-40'>
              <Image
                src='/images/story/story-banner.png'
                alt='Story banner'
                width={1410}
                height={793}
                className='w-full rounded-[10px]'
              />
              {/* TOOD: Change font size, change text */}
              <div className='absolute bottom-0 left-0 w-full px-4 pb-6 text-center text-[36px] font-semibold text-white md:text-[72px] lg:left-[10%] lg:w-4/5 lg:pb-9'>
                {t('Get Ready for THE Story of THENA')}
              </div>
            </div>
          </div>

          <div className='flex justify-center'>
            <StoryRegister isRegistered={isRegistered} />
          </div>
        </div>
      ) : (
        // TODO: add background
        <div>
          <div className='mb-9 flex justify-center'>
            <StoryRegister isRegistered={isRegistered} />
          </div>

          {/* TODO: Add components */}
          <p className='mx-auto mb-5 max-w-[743px] text-center text-[36px] font-semibold md:text-[72px]'>
            {t('THE Story of THENA')}
          </p>
          <p className='mx-auto max-w-[743px] text-center text-[20px] text-[#D1D0D2]'>
            {t('Embark on The Story of THENA')}
          </p>
        </div>
      )}
    </>
  )
}

export default StoryHome
