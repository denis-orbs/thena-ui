import React, { useCallback, useMemo } from 'react'
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
  const filterTime = useCallback(
    time => {
      if (!showTimeSelect || (!minDate && !maxDate)) return true
      const currentDate = new Date(time)
      if (minDate && currentDate.toDateString() === new Date(minDate).toDateString()) {
        return currentDate.getTime() >= new Date(minDate).getTime()
      }
      if (maxDate && currentDate.toDateString() === new Date(maxDate).toDateString()) {
        return currentDate.getTime() <= new Date(maxDate).getTime()
      }
      return true
    },
    [minDate, maxDate, showTimeSelect],
  )

  const popperContainer = useMemo(
    () =>
      ({ children }) =>
        createPortal(children, document.body),
    [],
  )

  return (
    <div className={cn('relative flex items-center', className)}>
      <ReactDatePicker
        className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-[48px] text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
        popperContainer={popperContainer}
        popperClassName='z-1000!'
        selected={selectedDate}
        dateFormat={dateFormat}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        placeHolder='Choose date'
        showTimeSelect={showTimeSelect}
        filterTime={filterTime}
        timeFormat='HH:mm:ss'
        calendarStartDay={1}
        {...rest}
      />
      <CalendarIcon className='absolute top-[14px] left-4 h-5 w-5' />
    </div>
  )
}

export default React.memo(DateInput)
