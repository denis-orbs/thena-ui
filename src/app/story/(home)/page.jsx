'use client'

import React from 'react'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { useTHEStory } from '@/context/THEStoryContext'
import StoryHome from '@/modules/Story/StoryHome'

function StoryPage() {
  const { isRegistered, isUpcoming } = useTHEStory()

  return (
    <div className='relative'>
      <div
        className={`absolute h-full w-full bg-cover opacity-10 ${
          isUpcoming && !isRegistered
            ? 'bg-[url("/images/story/background-teaser.png")]'
            : 'bg-[url("/images/story/background-landing.png")]'
        }`}
      />
      <section
        className={`layout-container relative !pb-0 ${!isRegistered ? 'layout-top' : 'mt-[128px] lg:mt-[176px]'}`}
      >
        <Box className='mb-[30px] gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='block text-center text-neutral-100'>
            THE Story has ended. We are now preparing the final rewards and the price distribution will be announced at
            a later stage.
          </TextHeading>
        </Box>
        <StoryHome isRegistered={isRegistered} isUpcoming={isUpcoming} />
      </section>
    </div>
  )
}

export default StoryPage
