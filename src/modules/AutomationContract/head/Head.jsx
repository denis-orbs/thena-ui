import React from 'react'

import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'

import AutomationButton from '../AutomationButton'

function Head({ veTHE }) {
  return (
    <div className='mt-4 flex flex-col justify-between gap-4 lg:flex-row'>
      {veTHE ? (
        <TextHeading className='font-archia text-3xl lg:text-[40px]'>{`veTHE Automation - ID ${veTHE.id}`}</TextHeading>
      ) : (
        <Skeleton className='h-8 w-44' />
      )}
      <div className='lg:w-[212px]'>
        <AutomationButton veTHE={veTHE} isDetail />
      </div>
    </div>
  )
}

export default Head
