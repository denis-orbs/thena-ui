import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import InputManyToken from '@/components/input/InputManyToken'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { useGaugeBalance, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { warnToast } from '@/lib/notify'
import { isInvalidAmount } from '@/lib/utils'

function GaugeWeightedManageModal({ popup, setPopup, pool, title, onGaugeManage, pending, label, isStake }) {
  const [amount, setAmount] = useState('')
  const t = useTranslations()

  const { balance: weightedBalance, mutatePoolBalance } = useWeightPoolData(pool?.address)
  const { gaugeBalance, mutateGaugeBalance } = useGaugeBalance(pool?.gauge.address)
  const balance = useMemo(() => (!isStake ? weightedBalance : gaugeBalance), [gaugeBalance, isStake, weightedBalance])

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(amount)) {
      return 'Invalid Amount'
    }
    if (!balance || balance.lt(amount)) {
      return 'Insufficient Balance'
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
        <InputManyToken pair={pool} amount={amount} onAmountChange={setAmount} title='Amount' balanceValue={balance} />
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <TextButton className='w-full' onClick={() => setPopup(false)}>
          {t('Cancel')}
        </TextButton>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            if (errorMsg) {
              warnToast(errorMsg)
              return
            }
            onGaugeManage(pool, amount, () => {
              setPopup(false)
              mutateGaugeBalance()
              mutatePoolBalance()
            })
          }}
        >
          {t(label)}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default GaugeWeightedManageModal
