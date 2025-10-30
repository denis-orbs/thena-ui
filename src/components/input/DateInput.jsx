import React from 'react'
import ReactDatePicker from 'react-datepicker'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'
import { CalendarIcon } from '@/svgs'

function DateInput({
  className,
  selectedDate,
  minDate,
  maxDate,
  onChange,
  showTimeSelect = false,
  dateFormat = 'yyyy/MM/dd',
  ...rest
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <ReactDatePicker
        className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-[48px] text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
        popperContainer={({ children }) => createPortal(children, document.body)}
        popperClassName='!z-[1000]'
        selected={selectedDate}
        dateFormat={dateFormat}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        placeHolder='Choose date'
        showTimeSelect={showTimeSelect}
        timeFormat='HH:mm:ss'
        calendarStartDay={1}
        {...rest}
      />
      <CalendarIcon className='absolute top-[14px] left-4 h-5 w-5' />
    </div>
  )
}

export default DateInput
