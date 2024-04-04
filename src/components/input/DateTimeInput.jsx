import Image from 'next/image'

import './style-date-time-input.css'

import { cn } from '@/lib/utils'

function DateTimeInput({ className, ...rest }) {
  return (
    <div className={cn('', className)}>
      <div className='relative flex h-[50px] w-full cursor-pointer items-center rounded-lg border border-neutral-700 bg-neutral-700 pl-4 text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'>
        <Image width={24} height={24} alt='' src='/svgs/clock.svg' />
        <input
          type='datetime-local'
          className='datetime-local-input w-full border-none bg-transparent pl-[6px] text-lg font-light leading-10 text-white placeholder-[#757384] focus:outline-none'
          {...rest}
        />
      </div>
    </div>
  )
}

export default DateTimeInput
