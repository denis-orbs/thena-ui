import Image from 'next/image'

import StoryRegister from './StoryRegister'

function StoryHome({ isUpcoming, isRegistered }) {
  return (
    <>
      {isUpcoming ? (
        // TODO: add background
        <div>
          {/* Banner */}
          <div className='relative mb-24 lg:mb-40'>
            <Image
              src='/images/story/story-banner.png'
              alt='Story banner'
              width={1410}
              height={793}
              className='w-full'
            />
            {/* TOOD: Change font size, change text */}
            <div className='absolute bottom-0 left-0 w-full px-4 pb-6 text-white lg:left-[10%] lg:w-4/5 lg:pb-9'>
              Test text - change it later
            </div>
          </div>

          <div className='flex justify-center'>
            <StoryRegister isRegistered={isRegistered} />
          </div>
        </div>
      ) : (
        // TODO: add background
        <div>
          <div className='flex justify-center'>
            <StoryRegister isRegistered={isRegistered} />
          </div>

          {/* TODO: Add components */}
          <p>Add components</p>
        </div>
      )}
    </>
  )
}

export default StoryHome
