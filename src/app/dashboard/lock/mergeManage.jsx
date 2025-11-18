'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { useVeTHEsContext } from '@/app/dashboard/VeTHEsContext'
import { PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Input from '@/components/input'
import { ModalBody, ModalFooter } from '@/components/modal'
import ConfirmModal from '@/components/modal/ConfirmModal'
import { Paragraph, TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useMerge } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import WithdrawFundsModal from '@/modules/AutomationContract/WithdrawFundsModal'
import { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'
import { formatAmount } from '@/utils/utils'

export default function MergeManage({ selected, status, contract, mutateAutomationData }) {
  const [veTHE, setVeTHE] = useState(null)
  const { veTHEs, updateVeTHEs } = useVeTHEsContext()
  const t = useTranslations()

  const { onMerge, pending } = useMerge()

  const [warnWithdrawFunds, setWarnWithdrawFunds] = useState(false)
  const [withdrawFundsPopup, setWithdrawFundsPopup] = useState(false)

  const hasActiveAutomation = useMemo(
    () => status !== AUTOMATION_STATUS.NO && status !== AUTOMATION_STATUS.CANCELED,
    [status],
  )
  const handleMerge = useCallback(
    (confirm = false) => {
      if (!veTHE) {
        warnToast('Select veTHE')
        return
      }
      if (status === AUTOMATION_STATUS.CANCELED && contract.balance > 0 && !confirm) {
        setWarnWithdrawFunds(true)
        return
      }
      onMerge(veTHE, selected, () => {
        setVeTHE(null)
        updateVeTHEs()
      })
    },
    [veTHE, status, contract.balance, onMerge, selected, updateVeTHEs],
  )

  const filtered = useMemo(
    () =>
      veTHEs
        .filter(item => item.id !== selected.id && item.voting_amount.gt(0))
        .map(item => ({
          ...item,
          label: `veTHE #${item.id}`,
        })),
    [veTHEs, selected],
  )

  const votingPower = useMemo(() => {
    if (veTHE) {
      const end = Math.max(selected.lockedEnd, veTHE.lockedEnd)
      const current = new Date().getTime() / 1000
      return selected.amount
        .plus(veTHE.amount)
        .times(end - current)
        .div(86400 * 730)
    }
    return new BigNumber(0)
  }, [selected, veTHE])

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
            handleMerge(true)
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
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Merge From')}</TextHeading>
              <Paragraph>
                veTHE {t('Balance')}: {veTHE ? formatAmount(veTHE.voting_amount) : '-'}
              </Paragraph>
            </div>
            <Dropdown
              className='w-full'
              data={filtered}
              selected={veTHE ? `veTHE #${veTHE.id}` : ''}
              setSelected={setVeTHE}
              placeHolder={t('Make a selection')}
              isLocale={false}
              listClassNames='z-60'
            />
          </div>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>veTHE ID</TextHeading>
              <Paragraph>
                veTHE {t('Balance')}: {formatAmount(selected.voting_amount)}
              </Paragraph>
            </div>
            <Input type='text' val={`veTHE #${selected.id}`} readOnly />
          </div>
          {veTHE && (
            <div className='my-3 flex items-center justify-between'>
              <Paragraph>{t('veTHE #[Number] Balance Will Be:', { id: selected.id })}</Paragraph>
              <div>
                <TextHeading>{formatAmount(votingPower)}&nbsp;</TextHeading>
                <span className='text-success-600 font-medium'>
                  {`(+${formatAmount(votingPower.minus(selected.voting_amount))})`}
                </span>
              </div>
            </div>
          )}
        </div>
        {hasActiveAutomation && <ErrorMessage className='lg:p-4' message={t('Waring automation manage')} />}
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <PrimaryButton className='w-full' disabled={pending || hasActiveAutomation} onClick={() => handleMerge()}>
          {t('Merge')}
        </PrimaryButton>
      </ModalFooter>
    </>
  )
}
