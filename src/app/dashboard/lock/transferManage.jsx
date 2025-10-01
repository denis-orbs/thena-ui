'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { isAddress } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { ModalBody, ModalFooter } from '@/components/modal'
import ConfirmModal from '@/components/modal/ConfirmModal'
import { TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useTransfer } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import WithdrawFundsModal from '@/modules/AutomationContract/WithdrawFundsModal'
import { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'
import { CheckCircleIcon } from '@/svgs'

export default function TransferManage({ selected, setPopup, updateVeTHEs, status, contract, mutateAutomationData }) {
  const [address, setAddress] = useState('')
  const { onTransfer, pending } = useTransfer()
  const t = useTranslations()

  const [warnWithdrawFunds, setWarnWithdrawFunds] = useState(false)
  const [withdrawFundsPopup, setWithdrawFundsPopup] = useState(false)

  const hasActiveAutomation = useMemo(
    () => status !== AUTOMATION_STATUS.NO && status !== AUTOMATION_STATUS.CANCELED,
    [status],
  )

  const errorMsg = useMemo(() => {
    if (!address || !isAddress(address)) {
      return 'Invalid Address'
    }
    return null
  }, [address])

  const handleTransfer = useCallback(
    (confirm = false) => {
      if (errorMsg) {
        warnToast(errorMsg)
        return
      }
      if (status === AUTOMATION_STATUS.CANCELED && contract.balance > 0 && !confirm) {
        setWarnWithdrawFunds(true)
        return
      }
      onTransfer(selected, address, () => {
        setAddress('')
        setPopup(false)
        updateVeTHEs()
      })
    },
    [errorMsg, status, contract.balance, onTransfer, selected, address, setPopup, updateVeTHEs],
  )

  return (
    <>
      {warnWithdrawFunds && (
        <ConfirmModal
          setPopup={setWarnWithdrawFunds}
          bgIcon='bg-error-600'
          popup={warnWithdrawFunds}
          cancelButton={t('Continue')}
          confirmButton={t('Withdraw Deposit')}
          title={t('Warning')}
          desc={t('Warning withdraw fund automation')}
          onConfirm={() => {
            setWithdrawFundsPopup(true)
          }}
          onCancel={() => {
            handleTransfer(true)
          }}
        />
      )}

      {withdrawFundsPopup && (
        <WithdrawFundsModal
          contract={contract}
          popup={withdrawFundsPopup}
          setPopup={setWithdrawFundsPopup}
          onWithdrawSuccess={() => {
            mutateAutomationData()
          }}
        />
      )}
      <ModalBody>
        <div className='flex flex-col gap-2'>
          <TextHeading>{t('Transfer veTHE #[Number] to Address', { id: selected?.id })}</TextHeading>
          <Input
            val={address}
            type='text'
            onChange={e => {
              setAddress(e.target.value)
            }}
            placeholder='Address'
            TrailingIcon={isAddress(address) ? <CheckCircleIcon /> : null}
          />
        </div>
        {hasActiveAutomation && <ErrorMessage className='lg:p-4' message={t('Waring automation manage')} />}
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <PrimaryButton className='w-full' disabled={pending || hasActiveAutomation} onClick={() => handleTransfer()}>
          {t('Transfer')}
        </PrimaryButton>
      </ModalFooter>
    </>
  )
}
