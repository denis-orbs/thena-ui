'use client'

import React, { useCallback, useMemo, useState } from 'react'

import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import DoubleInput from '@/components/input/DoubleInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { warnToast } from '@/lib/notify'
import { isInvalidAmount } from '@/lib/utils'

export default function GaugeManageModal({ popup, setPopup, pair, balance, title, onGaugeManage, pending, label }) {
  const [amount, setAmount] = useState('')

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(amount)) {
      return 'Invalid amount'
    }
    if (!balance || balance.lt(amount)) {
      return 'Insufficient balance'
    }
    return null
  }, [amount, balance])

  const onClear = useCallback(() => {
    setAmount('')
  }, [setAmount])

  return (
    <Modal
      isOpen={popup}
      title={title}
      closeModal={() => {
        setPopup(false)
      }}
      onAfterClose={onClear}
    >
      <ModalBody>
        <DoubleInput
          title='Amount'
          pair={pair}
          balance={balance}
          symbol={pair.symbol}
          amount={amount}
          onAmountChange={setAmount}
          autoFocus
        />
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <TextButton className='w-full' onClick={() => setPopup(false)}>
          Cancel
        </TextButton>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            if (errorMsg) {
              warnToast(errorMsg)
              return
            }
            onGaugeManage(pair, amount, () => {
              setPopup(false)
            })
          }}
        >
          {label}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
