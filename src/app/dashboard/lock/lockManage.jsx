'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import DateInput from '@/components/input/DateInput'
import { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { PERIOD_LEVELS } from '@/constant'
import { useMutateAssets } from '@/context/assetsContext'
import { useExtendLock, useIncreaseLock } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import { formatAmount, isInvalidAmount } from '@/lib/utils'

const week = 86400 * 7 * 1000
const minTimeStamp = 86400 * 14 * 1000
const maxTimeStamp = 86400 * 730 * 1000
const maxTimes = Math.floor((new Date().getTime() + maxTimeStamp) / week) * week
const maxDate = new Date(maxTimes)

export default function LockManage({ selected, theAsset, updateVeTHEs }) {
  const [isExtend, setIsExtend] = useState(true)
  const [amount, setAmount] = useState('')
  const [periodLevel, setPeriodLevel] = useState(0)

  const mutateAssets = useMutateAssets()
  const { onExtend, pending: extendPending } = useExtendLock()
  const { onIncreaseAmount, pending: increasePending } = useIncreaseLock()

  const periods = useMemo(
    () =>
      PERIOD_LEVELS.map((level, idx) => ({
        label: level.label,
        active: periodLevel === idx,
        onClickHandler: () => setPeriodLevel(idx),
      })),
    [periodLevel, setPeriodLevel],
  )

  const minDate = useMemo(() => new Date(Math.min(selected.lockedEnd * 1000 + minTimeStamp, maxTimes)), [selected])
  const [selectedDate, setSelectedDate] = useState(minDate)
  const lockSelections = useMemo(
    () => [
      {
        label: 'Extend',
        active: isExtend,
        onClickHandler: () => {
          setIsExtend(true)
        },
      },
      {
        label: 'Increase',
        active: !isExtend,
        onClickHandler: () => {
          setIsExtend(false)
        },
      },
    ],
    [isExtend],
  )

  const extendVotingPower = useMemo(
    () => selected.amount.times(selectedDate.getTime() - new Date().getTime()).div(maxTimeStamp),
    [selected, selectedDate],
  )

  const lockVotingPower = useMemo(
    () =>
      selected.amount
        .plus(!amount ? 0 : amount)
        .times(selected.lockedEnd * 1000 - new Date().getTime())
        .div(maxTimeStamp),
    [selected, amount],
  )

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(amount)) {
      return 'Invalid amount'
    }
    if (!theAsset || theAsset.balance.lt(amount)) {
      return 'Insufficient balance'
    }
    return null
  }, [amount, theAsset])

  useEffect(() => {
    let timestamp = 0
    if (periodLevel < 0) return
    switch (periodLevel) {
      case 0:
        timestamp = minTimeStamp
        break
      case 1:
        timestamp = 3600 * 24 * (30 * 6) * 1000
        break
      case 2:
        timestamp = 3600 * 24 * 364 * 1000
        break
      case 3:
        timestamp = maxTimeStamp
        break

      default:
        break
    }
    let period
    if (periodLevel === 3) {
      period = new Date().getTime() + timestamp
    } else {
      period = selected.lockedEnd * 1000 + timestamp
    }
    const date = new Date(Math.min(Math.floor(period / week) * week, maxDate))
    setSelectedDate(date)
  }, [periodLevel, selected])

  return (
    <>
      <ModalBody>
        <Selection data={lockSelections} isFull />
        {isExtend ? (
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-2'>
              <div className='flex flex-col items-start justify-between gap-1 lg:flex-row lg:items-center'>
                <p className='font-medium text-white'>Lock Until</p>
                <Tabs data={periods} />
              </div>

              <DateInput
                selectedDate={selectedDate}
                minDate={minDate}
                maxDate={maxDate}
                onChange={date => {
                  if (periodLevel >= 0) {
                    setPeriodLevel(-1)
                  }
                  if (date.getTime() === selectedDate.getTime()) {
                    return
                  }
                  setSelectedDate(new Date(Math.floor(date.getTime() / week) * week))
                }}
              />
            </div>
            <div className='my-3 flex items-center justify-between'>
              <Paragraph>New veTHE Voting Power</Paragraph>
              <div>
                <TextHeading>{formatAmount(extendVotingPower)}&nbsp;</TextHeading>
                <span className='font-medium text-success-600'>
                  {`(+${formatAmount(extendVotingPower.minus(selected.voting_amount))})`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-5'>
            <BalanceInput title='Amount' asset={theAsset} amount={amount} onAmountChange={setAmount} autoFocus />
            <div className='my-3 flex items-center justify-between'>
              <Paragraph>New veTHE Voting Power</Paragraph>
              <div>
                <TextHeading>{formatAmount(lockVotingPower)}&nbsp;</TextHeading>
                <span className='font-medium text-success-600'>
                  {`(+${formatAmount(lockVotingPower.minus(selected.voting_amount))})`}
                </span>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        {isExtend ? (
          <>
            <SecondaryButton
              className='w-full'
              disabled={extendPending}
              onClick={() => {
                if (selectedDate.getTime() / 1000 === selected.lockedEnd) {
                  warnToast('Can only increase lock duration')
                  return
                }
                onExtend(selected.id, selectedDate, () => {
                  setSelectedDate(minDate)
                  updateVeTHEs()
                })
              }}
            >
              Extend Duration
            </SecondaryButton>
            <PrimaryButton
              className='w-full'
              disabled={extendPending}
              onClick={() => {
                let period
                if (periodLevel === 3) {
                  period = new Date().getTime() + maxTimeStamp
                } else {
                  period = selected.lockedEnd * 1000 + maxTimeStamp
                }
                const date = new Date(Math.min(Math.floor(period / week) * week, maxDate))
                setSelectedDate(date)
                if (date.getTime() / 1000 === selected.lockedEnd) {
                  warnToast('Can only increase lock duration')
                  return
                }
                onExtend(selected.id, date, () => {
                  setSelectedDate(minDate)
                  updateVeTHEs()
                })
              }}
            >
              Max Lock
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton
            className='w-full'
            disabled={increasePending}
            onClick={() => {
              if (errorMsg) {
                warnToast(errorMsg, 'warn')
                return
              }
              onIncreaseAmount(selected.id, amount, () => {
                setAmount('')
                setSelectedDate(minDate)
                updateVeTHEs()
                mutateAssets()
              })
            }}
          >
            Increase Amount
          </PrimaryButton>
        )}
      </ModalFooter>
    </>
  )
}
