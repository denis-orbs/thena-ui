'use client'

import React from 'react'

import { useTHEStory } from '@/context/THEStoryContext'
import StoryHome from '@/modules/Story/StoryHome'

function StoryPage() {
  const { isRegistered, isUpcoming } = useTHEStory()

  return (
    <div className='relative'>
      <div
        className={`absolute h-full w-full bg-cover opacity-10 ${
          isUpcoming
            ? 'bg-[url("/images/story/background-teaser.png")]'
            : isRegistered
              ? 'bg-[url("/images/story/background-landing.png")]'
              : ''
        }`}
      />
      <section className={`layout-container relative ${!isRegistered ? 'layout-top' : 'mt-[128px] lg:mt-[176px]'}`}>
        <StoryHome isRegistered={isRegistered} isUpcoming={isUpcoming} />
      </section>
    </div>
  )
}

export default StoryPage
