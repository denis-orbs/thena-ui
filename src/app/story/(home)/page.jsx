'use client'

import React, { useEffect, useState } from 'react'

import StoryHome from '@/modules/Story/StoryHome'

function StoryPage() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [isUpcoming, setIsUpcoming] = useState(false)

  useEffect(() => {
    setIsRegistered(false)
    setIsUpcoming(true)
  }, [])

  return (
    <div className='relative'>
      <div
        className={`absolute h-full w-full bg-cover  opacity-[0.17] ${
          isRegistered && !isUpcoming
            ? 'bg-[url("/images/story/background.png")]'
            : 'bg-[url("/images/story/background2.png")]'
        }`}
      />
      <section className='layout-container relative mt-[128px] lg:mt-[176px]'>
        <StoryHome isRegistered={isRegistered} isUpcoming={isUpcoming} />
      </section>
    </div>
  )
}

export default StoryPage
