/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Input from '@/components/input'
import { DateTimePickerCustom } from '@/components/input/DateTimePickerCustom'
import { TC_PARTICIPANTS, TC_TIMESTAMP } from '@/constant'
import { errorToast } from '@/lib/notify'
import { MinusIcon, PlusIcon } from '@/svgs'

import LabelTooltip from '../../components/label/LabelTooltip'

const { MIN_REG, MAX_REG, MIN_TS, MAX_TS } = TC_TIMESTAMP

function Time({ data, setData }) {
  const getIsoString = useCallback(timestamp => {
    const curTimeStamp = new Date().getTime()
    const finalTS = timestamp || curTimeStamp
    const finalDate = new Date(finalTS)
    return finalDate
  }, [])

  const [minReg, setMinReg] = useState(undefined)
  const [maxReg, setMaxReg] = useState(undefined)
  const [minTs, setMinTs] = useState(undefined)
  const [maxTs, setMaxTs] = useState(undefined)
  const [minStartTime, setMinStartTime] = useState(undefined)

  const regStartTime = useMemo(
    () => getIsoString(data.timestamp.registrationStart),
    [data.timestamp.registrationStart, getIsoString],
  )

  const regEndTime = useMemo(
    () => getIsoString(data.timestamp.registrationEnd),
    [data.timestamp.registrationEnd, getIsoString],
  )

  const tsStartTime = useMemo(
    () => getIsoString(data.timestamp.startTimestamp),
    [data.timestamp.startTimestamp, getIsoString],
  )

  const tsEndTime = useMemo(
    () => getIsoString(data.timestamp.endTimestamp),
    [data.timestamp.endTimestamp, getIsoString],
  )

  useEffect(() => {
    const minTimestamp = new Date(regStartTime).getTime() + MIN_REG
    if (new Date(regEndTime).getTime() < minTimestamp) {
      setData({
        ...data,
        timestamp: {
          ...data.timestamp,
          registrationEnd: minTimestamp,
        },
      })
    }
    setMinReg(getIsoString(minTimestamp))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regStartTime])

  useEffect(() => {
    const maxTimestamp = new Date(regStartTime).getTime() + MAX_REG
    if (new Date(regEndTime).getTime() > maxTimestamp) {
      setData({
        ...data,
        timestamp: {
          ...data.timestamp,
          registrationEnd: maxTimestamp,
        },
      })
    }
    setMaxReg(getIsoString(maxTimestamp))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regStartTime])

  useEffect(() => {
    const check = new Date(tsStartTime).getTime() < new Date(regEndTime).getTime()
    if (check) {
      setData({
        ...data,
        timestamp: {
          ...data.timestamp,
          startTimestamp: new Date(regEndTime).getTime() + 30 * 60 * 1000,
        },
      })
    }
    setMinStartTime(getIsoString(regEndTime))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regEndTime])

  useEffect(() => {
    const minTimestamp = new Date(tsStartTime).getTime() + MIN_TS
    if (new Date(tsEndTime).getTime() < minTimestamp) {
      setData({
        ...data,
        timestamp: {
          ...data.timestamp,
          endTimestamp: minTimestamp,
        },
      })
    }
    setMinTs(getIsoString(minTimestamp))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tsStartTime])

  useEffect(() => {
    const maxTimestamp = new Date(tsStartTime).getTime() + MAX_TS
    if (new Date(tsEndTime).getTime() > maxTimestamp) {
      setData({
        ...data,
        timestamp: {
          ...data.timestamp,
          endTimestamp: maxTimestamp,
        },
      })
    }
    setMaxTs(getIsoString(maxTimestamp))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tsStartTime])

  const handleParticipants = val => {
    if (val === '') {
      setData({
        ...data,
        maxParticipants: '',
      })
    } else {
      setData({
        ...data,
        maxParticipants: parseInt(val, 10) > TC_PARTICIPANTS.MAX ? TC_PARTICIPANTS.MAX : parseInt(val, 10),
      })
    }
  }

  return (
    <>
      <div className='mb-3 max-w-full md:mt-5 md:flex md:max-w-[50%] md:gap-6'>
        <div className='w-full'>
          <LabelTooltip
            label='Max Participants'
            showInfoIcon
            tooltip='Max Participants Tooltip'
            id='trading-competition-max-participants'
            required
          />
          <Input
            type='number'
            max={TC_PARTICIPANTS.MAX}
            min={TC_PARTICIPANTS.MIN}
            value={data.maxParticipants}
            onChange={e => handleParticipants(e.target.value)}
            TrailingButton={
              <div className='absolute top-2.5 right-3 flex items-center gap-3'>
                <button
                  onClick={() => {
                    handleParticipants(data.maxParticipants - 1)
                  }}
                  disabled={data.maxParticipants <= TC_PARTICIPANTS.MIN}
                  className='flex h-8 w-8 flex-col items-center justify-center rounded-[3px] bg-white/5 disabled:cursor-not-allowed disabled:bg-white/[0.02]'
                  type='button'
                  aria-label='minus-participants'
                >
                  <MinusIcon className='h-[18px] w-[18px] stroke-white' />
                </button>
                <button
                  onClick={() => {
                    handleParticipants(data.maxParticipants + 1)
                  }}
                  disabled={data.maxParticipants >= TC_PARTICIPANTS.MAX}
                  className='flex h-8 w-8 flex-col items-center justify-center rounded-[3px] bg-white/5 disabled:cursor-not-allowed disabled:bg-white/[0.02]'
                  type='button'
                  aria-label='plus-participants'
                >
                  <PlusIcon className='h-[18px] w-[18px] stroke-white' />
                </button>
              </div>
            }
          />
        </div>
      </div>
      <div className='mt-4 flex w-full flex-col items-center gap-4 md:mt-5 md:flex-row md:gap-6'>
        <div className='w-full'>
          <LabelTooltip label='Registration Start Time' />
          <DateTimePickerCustom
            title='Registration Start Time'
            selectedDate={regStartTime}
            onChange={date => {
              const newDate = new Date(date).getTime()
              const curDate = new Date().getTime()
              const res = Math.max(newDate, curDate)
              setData({
                ...data,
                timestamp: {
                  ...data.timestamp,
                  registrationStart: res,
                },
              })
            }}
            minDate={getIsoString()}
            showTimeSelect
            dateFormat='YYYY/MM/DD hh:mm A'
          />
        </div>
        <div className='w-full'>
          <LabelTooltip label='Registration End Time' />
          <DateTimePickerCustom
            title='Registration End Time'
            selectedDate={regEndTime}
            onChange={date => {
              const newDate = new Date(date).getTime()
              const minDate = new Date(minReg).getTime()
              const maxDate = new Date(maxReg).getTime()
              const res = Math.min(Math.max(newDate, minDate), maxDate)
              setData({
                ...data,
                timestamp: {
                  ...data.timestamp,
                  registrationEnd: res,
                },
              })
            }}
            minDate={minReg}
            maxDate={maxReg}
            showTimeSelect
            dateFormat='YYYY/MM/DD hh:mm A'
          />
        </div>
      </div>
      <div className='mt-4 flex w-full flex-col items-center gap-4 md:mt-5 md:flex-row md:gap-6'>
        <div className='w-full'>
          <LabelTooltip label='Competition Start Time' />
          <DateTimePickerCustom
            title='Competition Start Time'
            selectedDate={tsStartTime}
            onChange={date => {
              const newDate = new Date(date).getTime()
              if (newDate <= data.timestamp.registrationEnd) {
                errorToast('Competition Start Time must be greater than Registration End Time')
                return
              }
              const res = Math.max(newDate, data.timestamp.registrationEnd)
              setData(() => ({
                ...data,
                timestamp: {
                  ...data.timestamp,
                  startTimestamp: res,
                },
              }))
            }}
            minDate={minStartTime}
            showTimeSelect
            dateFormat='YYYY/MM/DD hh:mm A'
          />
        </div>
        <div className='w-full'>
          <LabelTooltip label='Competition End Time' />
          <DateTimePickerCustom
            title='Competition End Time'
            selectedDate={tsEndTime}
            onChange={date => {
              const newDate = new Date(date).getTime()
              const minDate = new Date(minTs).getTime()
              const maxDate = new Date(maxTs).getTime()
              const res = Math.min(Math.max(newDate, minDate), maxDate)
              setData({
                ...data,
                timestamp: {
                  ...data.timestamp,
                  endTimestamp: res,
                },
              })
            }}
            minDate={minTs}
            maxDate={maxTs}
            dateFormat='YYYY/MM/DD hh:mm A'
            showTimeSelect
          />
        </div>
      </div>
    </>
  )
}

export default Time
