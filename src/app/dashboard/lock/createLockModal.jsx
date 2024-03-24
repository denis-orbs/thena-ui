'use client'

import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import DateInput from '@/components/input/DateInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { PERIOD_LEVELS } from '@/constant'
import { useMutateAssets } from '@/context/assetsContext'
import { useCreateLock } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import { formatAmount, isInvalidAmount } from '@/lib/utils'

const week = 86400 * 7 * 1000

const minTimeStamp = 86400 * 14 * 1000
const maxTimeStamp = 86400 * 728 * 1000
const minDate = new Date(Math.floor((new Date().getTime() + minTimeStamp) / week) * week)
const maxDate = new Date(Math.floor((new Date().getTime() + maxTimeStamp) / week) * week)

export default function CreateLockModal({ popup, setPopup, theAsset, updateVeTHEs }) {
  const [selectedDate, setSelectedDate] = useState(minDate)
  const [amount, setAmount] = useState('')
  const [periodLevel, setPeriodLevel] = useState(0)
  const { onCreateLock, pending } = useCreateLock(amount, selectedDate)
  const mutateAssets = useMutateAssets()
  const t = useTranslations()

  const periods = useMemo(
    () =>
      PERIOD_LEVELS.map((level, idx) => ({
        label: level.label,
        active: periodLevel === idx,
        onClickHandler: () => setPeriodLevel(idx),
      })),
    [periodLevel, setPeriodLevel],
  )
  const unlockTime = useMemo(() => dayjs(selectedDate).diff(dayjs(), 'second'), [selectedDate])

  const votingPower = useMemo(() => {
    if (amount && amount > 0) {
      return formatAmount((amount * unlockTime) / (86400 * 365 * 2))
    }
    return '-'
  }, [amount, unlockTime])

  useEffect(() => {
    let timestamp = 0
    if (periodLevel < 0) return
    switch (periodLevel) {
      case 0:
        timestamp = minTimeStamp
        break
      case 1:
        timestamp = 86400 * 180 * 1000
        break
      case 2:
        timestamp = 86400 * 364 * 1000
        break
      case 3:
        timestamp = 86400 * 730 * 1000
        break

      default:
        break
    }
    const date = new Date(Math.floor((new Date().getTime() + timestamp) / week) * week)
    setSelectedDate(date)
  }, [periodLevel])

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(amount)) {
      return 'Invalid Amount'
    }
    if (!theAsset || theAsset.balance.lt(amount)) {
      return 'Insufficient Balance'
    }
    return null
  }, [amount, theAsset])

  const onClear = useCallback(() => {
    setAmount('')
    setSelectedDate(minDate)
    setPeriodLevel(0)
  }, [setAmount])

  return (
    <Modal
      isOpen={popup}
      title='Create New Lock'
      closeModal={() => {
        setPopup(false)
      }}
      onAfterClose={onClear}
    >
      <ModalBody>
        <BalanceInput title='Amount' asset={theAsset} amount={amount} onAmountChange={setAmount} autoFocus />
        <div className='flex flex-col gap-2'>
          <div className='flex flex-col items-start justify-between gap-1 lg:flex-row lg:items-center'>
            <p className='font-medium text-white'>{t('Lock Until')}</p>
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
          <Paragraph>{t('veTHE Voting Power')}</Paragraph>
          <TextHeading>{votingPower}</TextHeading>
        </div>
      </ModalBody>
      <ModalFooter>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            if (errorMsg) {
              warnToast(errorMsg)
              return
            }
            onCreateLock(amount, selectedDate, () => {
              updateVeTHEs()
              mutateAssets()
              onClear()
            })
          }}
        >
          {t('Create New Lock')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
