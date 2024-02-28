import React from 'react'
import ReactDatePicker from 'react-datepicker'

import { cn } from '@/lib/utils'
import { CalendarIcon } from '@/svgs'

function DateInput({ className, selectedDate, minDate, maxDate, onChange }) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <ReactDatePicker
        className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-[48px] text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
        selected={selectedDate}
        dateFormat='yyyy/MM/dd'
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        placeHolder='Choose date'
      />
      <CalendarIcon className='absolute left-4 top-[14px] h-5 w-5' />
    </div>
  )
}

export default DateInput
