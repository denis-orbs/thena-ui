import { TimeClock } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { createPortal } from 'react-dom'

import { ArrowLeftIcon, CalendarIcon } from '@/svgs'

import Input from '.'
import { EmphasisButton, PrimaryButton, TextButton } from '../buttons/Button'
import Modal, { ModalBody, ModalFooter } from '../modal'
import { TextHeading } from '../typography'

const STEP = {
  DATE: 'date',
  TIME: 'time',
}

function formatAMPM(date, type = 'hours') {
  const newDate = new Date(date)
  let hours = newDate.getHours()
  hours %= 12
  hours = hours ? (hours < 10 ? `0${hours}` : hours) : 12
  if (type === 'hours') {
    return hours
  }
  let minutes = newDate.getMinutes()
  minutes = minutes < 10 ? `0${minutes}` : minutes
  return minutes
}

function DateTimePickerModal({ onChange, value, isOpen, closeModal, title, minDate, maxDate, ...rest }) {
  const t = useTranslations()
  const [step, setStep] = useState(STEP.DATE)
  const [dateValue, setDateValue] = useState(value)
  const [typeTime, setTypeTime] = useState('am')
  const [hours, setHours] = useState(formatAMPM(value, 'hours'))
  const [minutes, setMinutes] = useState(formatAMPM(value, 'minutes'))
  const [view, setView] = useState('hours')

  useEffect(() => {
    if (new Date(dateValue).getHours() < 12) {
      setTypeTime('am')
    } else {
      setTypeTime('pm')
    }
  }, [dateValue])

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
        <div className=''>
          <TextButton
            onClick={() => {
              setStep(STEP.DATE)
              setView('hours')
            }}
            className='mb-3 p-0 hover:bg-transparent'
            LeadingIcon={ArrowLeftIcon}
          >
            {t('Back')}
          </TextButton>
          <div className='mb-2 flex flex-row items-center justify-center gap-3'>
            <Input
              className='h-[80px] w-[80px]'
              classNames={{
                input: 'p-2 h-[80px] text-5xl text-center focus:bg-primary-600',
              }}
              placeholder='00'
              min='0'
              max='11'
              val={hours}
              onChange={e => {
                setHours(e.target.value)
              }}
              onKeyPress={e => {
                const key = e.which || e.keyCode
                if (key && (key <= 47 || key >= 58) && key !== 8) {
                  e.preventDefault()
                }
              }}
              onFocus={() => {
                setView('hours')
              }}
              onBlur={e => {
                const newValue = e.target.value
                let newDateValue
                if (!newValue || Number(newValue) > 12) {
                  newDateValue = dayjs(dateValue)
                    .clone()
                    .hour(typeTime === 'am' ? 0 : 12)
                } else {
                  newDateValue = dayjs(dateValue)
                    .clone()
                    .hour(typeTime === 'am' ? Number(newValue) : Number(newValue) + 12)
                }
                if (minDate && dayjs(newDateValue).isBefore(dayjs(minDate))) {
                  newDateValue = dayjs(minDate)
                } else if (maxDate && dayjs(newDateValue).isAfter(dayjs(maxDate))) {
                  newDateValue = dayjs(maxDate)
                }
                setDateValue(newDateValue)
                setHours(formatAMPM(newDateValue, 'hours'))
                setView('hours')
              }}
            />
            <TextHeading className='text-5xl'>:</TextHeading>
            <Input
              className='h-[80px] w-[80px]'
              classNames={{
                input: 'p-2 h-[80px] text-5xl text-center focus:bg-primary-600',
              }}
              placeholder='00'
              min={0}
              max={59}
              val={minutes}
              onChange={e => {
                setMinutes(e.target.value)
              }}
              onFocus={() => {
                setView('minutes')
              }}
              onKeyPress={e => {
                const key = e.which || e.keyCode
                if (key && (key <= 47 || key >= 58) && key !== 8) {
                  e.preventDefault()
                }
              }}
              onBlur={e => {
                const newValue = e.target.value
                let newDateValue
                if (!newValue || Number(newValue) > 59) {
                  newDateValue = dayjs(dateValue)
                    .clone()
                    .minute(!newValue ? 0 : 59)
                } else {
                  newDateValue = dayjs(dateValue).clone().minute(Number(newValue))
                }
                if (minDate && dayjs(newDateValue).isBefore(dayjs(minDate))) {
                  newDateValue = dayjs(minDate)
                } else if (maxDate && dayjs(newDateValue).isAfter(dayjs(maxDate))) {
                  newDateValue = dayjs(maxDate)
                }
                setDateValue(newDateValue)
                setMinutes(formatAMPM(newDateValue, 'minutes'))
                setView('minutes')
              }}
            />
          </div>
          <TimeClock
            sx={{
              '& .MuiClock-squareMask': {
                background: '#ffe3fe',
              },
              '& .MuiButtonBase-root': {
                color: 'white',
                background: '#35243d',
              },
              '& .Mui-selected': {
                color: 'white',
                background: '#dc00d4',
              },
              '& .MuiClockPointer-root, .MuiClock-pin, .MuiClockPointer-thumb': {
                background: '#dc00d4',
              },
              '& .MuiClockPointer-thumb': {
                border: '16px solid #dc00d4',
              },
            }}
            className='bg-transparent'
            disablePast
            ampmInClock
            disableIgnoringDatePartForTimeValidation
            minutesStep={1}
            minTime={minDate ? dayjs(minDate) : undefined}
            maxTime={maxDate ? dayjs(maxDate) : undefined}
            value={dayjs(dateValue)}
            onChange={newValue => {
              let newDateValue = newValue
              if (minDate && dayjs(newDateValue).isBefore(dayjs(minDate))) {
                newDateValue = dayjs(minDate)
              } else if (maxDate && dayjs(newDateValue).isAfter(dayjs(maxDate))) {
                newDateValue = dayjs(maxDate)
              }
              setDateValue(newDateValue)
              setHours(formatAMPM(newDateValue, 'hours'))
              setMinutes(formatAMPM(newDateValue, 'minutes'))
              if (view === 'hours') {
                setView('minutes')
              }
            }}
            view={view}
          />
        </div>
      )
    }
  }, [step, dateValue, minDate, maxDate, rest, t, hours, minutes, view, typeTime])

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} width={400} title={title} fontSizeTitle='text-xl lg:text-2xl'>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      </LocalizationProvider>
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
