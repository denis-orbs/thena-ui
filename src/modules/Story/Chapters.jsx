import React, { useState } from 'react'

import Loading from '@/app/loading'
import { ChapterProcess } from '@/app/story/(withStoryLayout)/dashboard/ChapterProcess'
import { ChapterTabNavigator } from '@/app/story/(withStoryLayout)/dashboard/ChapterTabNavigator'

export default function Chapters({ chapters, isLoading }) {
  const [selectedChapter, setSelectedChapter] = useState(chapters[0])

  if (isLoading && !selectedChapter) {
    return <Loading />
  }

  return (
    <>
      {selectedChapter && (
        <>
          <div className='mb-5 mt-5 grid grid-cols-12 gap-8'>
            <div className='col-span-12'>
              <ChapterTabNavigator
                chapters={chapters}
                selectedChapter={selectedChapter}
                setSelectedChapter={setSelectedChapter}
              />
            </div>
          </div>
          <ChapterProcess chapter={selectedChapter} />
        </>
      )}
    </>
  )
}
