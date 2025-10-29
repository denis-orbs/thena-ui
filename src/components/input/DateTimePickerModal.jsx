'use client'

import dayjs from 'dayjs'
import React, { useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { createPortal } from 'react-dom'

import 'react-datepicker/dist/react-datepicker.css'

import { cn } from '@/lib/utils'
import { CalendarIcon } from '@/svgs'

import { EmphasisButton, PrimaryButton } from '../buttons/Button'
import Modal, { ModalBody, ModalFooter } from '../modal'

export function DateTimePickerModal({
  title = 'Select Date & Time',
  selectedDate,
  minDate,
  maxDate,
  dateFormat = 'YYYY/MM/DD HH:mm',
  onChange,
  disabled,
  disablePast = true,
  ...rest
}) {
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [tempDate, setTempDate] = useState(selectedDate ? dayjs(selectedDate).toDate() : new Date())

  const handleSave = () => {
    onChange?.(tempDate)
    setIsOpenModal(false)
  }

  const now = new Date()
  const effectiveMin = disablePast && !minDate ? now : minDate

  return (
    <>
      <div className='relative flex items-center'>
        <div
          className={cn(
            'w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-[48px] text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500',
            disabled && 'cursor-not-allowed opacity-70',
          )}
          onClick={() => !disabled && setIsOpenModal(true)}
        >
          {dayjs(selectedDate).format(dateFormat)}
        </div>
        <CalendarIcon className='absolute top-[14px] left-4 h-5 w-5 text-neutral-400' />
      </div>

      {!disabled && isOpenModal && (
        <Modal
          isOpen={isOpenModal}
          closeModal={() => setIsOpenModal(false)}
          width={400}
          title={title}
          fontSizeTitle='text-xl lg:text-2xl'
        >
          <ModalBody>
            <div className='mt-4 flex w-full flex-col items-center justify-center'>
              <ReactDatePicker
                className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-center text-neutral-50 placeholder-neutral-400 focus:border-neutral-500'
                popperContainer={({ children }) => createPortal(children, document.body)}
                popperClassName='!z-[1000]'
                selected={tempDate}
                onChange={setTempDate}
                showTimeSelect
                timeFormat='HH:mm'
                timeIntervals={5}
                dateFormat='yyyy/MM/dd HH:mm'
                minDate={effectiveMin}
                maxDate={maxDate}
                calendarStartDay={1}
                {...rest}
              />
            </div>
          </ModalBody>
          <ModalFooter className='flex flex-row justify-center gap-4'>
            <EmphasisButton
              className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'
              onClick={() => setIsOpenModal(false)}
            >
              Cancel
            </EmphasisButton>
            <PrimaryButton className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3' onClick={handleSave}>
              Done
            </PrimaryButton>
          </ModalFooter>
        </Modal>
      )}
    </>
  )
}
