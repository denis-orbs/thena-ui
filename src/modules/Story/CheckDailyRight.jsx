import React from 'react'

import StartIcon from './StartIcon'

export default function CheckDailyRight() {
  return (
    <div className='col-span-12 pl-20 lg:col-span-6'>
      <div className='relative h-[246px] w-[321px] gap-3'>
        <div className='absolute right-0 top-0 row-span-1 h-[199px] w-[238px] rounded-[12px] border-[2px] border-[#0D090F] bg-[#281B2E] p-3 text-center'>
          <p className='text-center text-[31px] font-semibold text-neutral-50'>Day 5</p>
          <div className='relative inset-0 flex items-center justify-center'>
            <StartIcon width={88} height={88} />
          </div>
          <p className='text-center text-[23px] text-neutral-50'>+30 PTS</p>
        </div>
        <div className='absolute inset-0 z-10 row-span-1 m-auto h-[199px] w-[238px] items-center justify-center rounded-[12px] border-[2px] border-[#0D090F] bg-[#281B2E] p-3'>
          <p className='text-center text-[31px] font-semibold text-neutral-50'>Day 6</p>
          <div className='relative inset-0 flex items-center justify-center'>
            <StartIcon width={88} height={88} />
          </div>
          <p className='text-center text-[23px] text-neutral-50'>+30 PTS</p>
        </div>
        <div className='absolute bottom-0 left-0 z-20 row-span-1 h-[199px] w-[238px] rounded-[12px] border-[2px] border-[#0D090F] bg-[#281B2E] p-3'>
          <p className='text-center text-[31px] font-semibold text-neutral-50'>Day 7</p>
          <div className='relative inset-0 flex items-center justify-center'>
            <StartIcon width={88} height={88} />
          </div>
          <p className='text-center text-[23px] text-neutral-50'>+30 PTS</p>
        </div>
      </div>
    </div>
  )
}
