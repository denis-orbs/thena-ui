/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Input from '@/components/input'
import DateInput from '@/components/input/DateInput'
import { TC_PARTICIPANTS, TC_TIMESTAMP } from '@/constant'
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

  const handleParticipants = val => {
    if (val === '') {
      setData({
        ...data,
        maxParticipants: '',
      })
    } else {
      setData({
        ...data,
        maxParticipants: parseInt(val, 10) > 1000 ? 1000 : parseInt(val, 10),
      })
    }
  }

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
          startTimestamp: new Date(regEndTime).getTime(),
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

  return (
    <>
      <div className='max-w-[100%] md:mt-5 md:flex md:max-w-[50%] md:space-x-6 md:space-y-0'>
        <div className='w-full'>
          <LabelTooltip
            label='Max Participants'
            showInfoIcon
            tooltip='Select how many participants you would like to have in your trading competition.'
            id='trading-competition-max-participants'
          />
          <Input
            type='number'
            max={TC_PARTICIPANTS.MAX}
            min={TC_PARTICIPANTS.MIN}
            value={data.maxParticipants}
            onChange={e => handleParticipants(e.target.value)}
            TrailingButton={
              <div className='absolute right-3 top-2.5 flex items-center space-x-3'>
                <button
                  onClick={() => {
                    handleParticipants(data.maxParticipants - 1)
                  }}
                  disabled={data.maxParticipants <= TC_PARTICIPANTS.MIN}
                  className='flex h-8 w-8 flex-col items-center justify-center rounded-[3px] bg-white bg-opacity-[0.05] disabled:cursor-not-allowed disabled:bg-opacity-[0.02]'
                  type='button'
                >
                  <MinusIcon className='h-[18px] w-[18px] stroke-white' />
                </button>
                <button
                  onClick={() => {
                    handleParticipants(data.maxParticipants + 1)
                  }}
                  disabled={data.maxParticipants >= TC_PARTICIPANTS.MAX}
                  className='flex h-8 w-8 flex-col items-center justify-center rounded-[3px] bg-white bg-opacity-[0.05] disabled:cursor-not-allowed disabled:bg-opacity-[0.02]'
                  type='button'
                >
                  <PlusIcon className='h-[18px] w-[18px] stroke-white' />
                </button>
              </div>
            }
          />
        </div>
      </div>
      <div className='mt-4 w-full items-center space-y-4 md:mt-5 md:flex md:space-x-6 md:space-y-0'>
        <div className='w-full'>
          <LabelTooltip label='Registration Start Time' />
          <DateInput
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
            dateFormat='yyyy/MM/dd hh:mm aa'
          />
        </div>
        <div className='w-full'>
          <LabelTooltip label='Registration End Time' />
          <DateInput
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
            dateFormat='yyyy/MM/dd hh:mm aa'
          />
        </div>
      </div>
      <div className='mt-4 w-full items-center space-y-4 md:mt-5 md:flex md:space-x-6 md:space-y-0'>
        <div className='w-full'>
          <LabelTooltip label='Competition Start Time' />
          <DateInput
            selectedDate={tsStartTime}
            onChange={date => {
              const newDate = new Date(date).getTime()
              const regEndDate = new Date(regEndTime).getTime()
              const res = Math.max(newDate, regEndDate)
              setData({
                ...data,
                timestamp: {
                  ...data.timestamp,
                  startTimestamp: res,
                },
              })
            }}
            minDate={minStartTime}
            showTimeSelect
            dateFormat='yyyy/MM/dd hh:mm aa'
          />
        </div>
        <div className='w-full'>
          <LabelTooltip label='Competition End Time' />
          <DateInput
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
            dateFormat='yyyy/MM/dd hh:mm aa'
            showTimeSelect
          />
        </div>
      </div>
    </>
  )
}

export default Time
