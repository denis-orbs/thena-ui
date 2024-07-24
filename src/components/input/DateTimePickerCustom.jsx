import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { createPortal } from 'react-dom'

import { CalendarIcon } from '@/svgs'

import { EmphasisButton, PrimaryButton } from '../buttons/Button'
import Modal, { ModalBody, ModalFooter } from '../modal'

const STEP = {
  DATE: 'date',
  TIME: 'time',
}
function DateTimePickerModal({ onChange, value, isOpen, closeModal, title, minDate, maxDate, ...rest }) {
  const t = useTranslations()
  const [step, setStep] = useState(STEP.DATE)
  const [dateValue, setDateValue] = useState(value)

  const filterPassedTime = useCallback(date => {
    const currentDate = new Date()
    const selectedDate = new Date(date)

    return currentDate.getTime() < selectedDate.getTime()
  }, [])

  const renderComponent = useCallback(() => {
    if (step === STEP.DATE) {
      return (
        <div className='flex w-full flex-col items-center justify-center'>
          <ReactDatePicker
            className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-[48px] text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
            popperContainer={({ children }) => createPortal(children, document.body)}
            popperClassName='z-[1000]'
            selected={new Date(dateValue)}
            onChange={date => {
              setDateValue(date)
            }}
            inline
            dateFormat='yyyy/MM/dd'
            minDate={minDate}
            maxDate={maxDate}
            {...rest}
          />
        </div>
      )
    }
    if (step === STEP.TIME) {
      return (
        <div className='flex w-full flex-col items-center justify-center'>
          <ReactDatePicker
            className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-[48px] text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
            popperContainer={({ children }) => createPortal(children, document.body)}
            popperClassName='z-[1000]'
            selected={new Date(dateValue)}
            onChange={time => {
              setDateValue(time)
            }}
            showTimeSelect
            showTimeSelectOnly
            inline
            filterTime={filterPassedTime}
            dateFormat='h:mm aa'
            minDate={minDate}
            maxDate={maxDate}
            {...rest}
          />
        </div>
      )
    }
  }, [filterPassedTime, maxDate, minDate, rest, step, dateValue])

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} width={400} title={title} fontSizeTitle='text-xl lg:text-2xl'>
      <ModalBody>
        <div className='mt-5 flex w-full flex-col items-center justify-center'>
          <div className='w-full'>{renderComponent()}</div>
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-row justify-center gap-4'>
        <EmphasisButton className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3' onClick={() => closeModal()}>
          {t('Cancel')}
        </EmphasisButton>
        {step === STEP.TIME ? (
          <PrimaryButton
            className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'
            onClick={() => {
              onChange(dateValue)
              closeModal()
            }}
          >
            {t('Done')}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'
            onClick={() => {
              if (step === STEP.TIME) {
                closeModal()
              } else {
                setStep(STEP.TIME)
              }
            }}
          >
            {t('Next')}
          </PrimaryButton>
        )}
      </ModalFooter>
    </Modal>
  )
}

export function DateTimePickerCustom({ title, selectedDate, minDate, maxDate, dateFormat, onChange, ...rest }) {
  const [isOpenModal, setIsOpenModal] = useState(false)

  const onOpenModal = useCallback(() => setIsOpenModal(true), [])

  return (
    <>
      <div className='relative flex items-center'>
        <div
          className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-[48px] text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
          onClick={() => onOpenModal()}
        >
          {dayjs(selectedDate).format(dateFormat)}
        </div>
        <CalendarIcon className='absolute left-4 top-[14px] h-5 w-5' />
      </div>
      {isOpenModal && (
        <DateTimePickerModal
          value={selectedDate}
          isOpen={isOpenModal}
          closeModal={() => setIsOpenModal(false)}
          minDate={minDate}
          maxDate={maxDate}
          rest={rest}
          title={title}
          onChange={onChange}
        />
      )}
    </>
  )
}
