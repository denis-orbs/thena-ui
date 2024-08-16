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
    <>
      <StoryHome isRegistered={isRegistered} isUpcoming={isUpcoming} />
    </>
  )
}

export default StoryPage
