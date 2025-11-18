'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { ModalBody, ModalFooter } from '@/components/modal'
import ConfirmModal from '@/components/modal/ConfirmModal'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useSplit } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import WithdrawFundsModal from '@/modules/AutomationContract/WithdrawFundsModal'
import { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'
import { formatAmount, isInvalidAmount } from '@/utils/utils'

const validNumber = val => (val === '' ? 0 : Number(val))

export default function SplitManage({ selected, setPopup, updateVeTHEs, status, contract, mutateAutomationData }) {
  const [numberOfInputs, setNumberOfInputs] = useState(2)
  const [customInput, setCustomInput] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [percentArr, setPercentArr] = useState([])
  const { onSplit, pending } = useSplit()
  const t = useTranslations()

  const [warnWithdrawFunds, setWarnWithdrawFunds] = useState(false)
  const [withdrawFundsPopup, setWithdrawFundsPopup] = useState(false)

  const hasActiveAutomation = useMemo(
    () => status !== AUTOMATION_STATUS.NO && status !== AUTOMATION_STATUS.CANCELED,
    [status],
  )
  const lockSelections = useMemo(
    () => [
      {
        label: '2 tokens',
        active: numberOfInputs === 2 && !isCustom,
        onClickHandler: () => {
          setCustomInput('')
          setIsCustom(false)
          setNumberOfInputs(2)
        },
      },
      {
        label: '3 tokens',
        active: numberOfInputs === 3 && !isCustom,
        onClickHandler: () => {
          setCustomInput('')
          setIsCustom(false)
          setNumberOfInputs(3)
        },
      },
      {
        label: '4 tokens',
        active: numberOfInputs === 4 && !isCustom,
        onClickHandler: () => {
          setCustomInput('')
          setIsCustom(false)
          setNumberOfInputs(4)
        },
      },
      {
        label: 'Custom',
        active: isCustom,
        onClickHandler: () => {
          setIsCustom(true)
        },
      },
    ],
    [numberOfInputs, isCustom],
  )

  useEffect(() => {
    const fixedArr = []
    const target = customInput !== '' ? customInput : numberOfInputs
    for (let i = 0; i < target; i++) {
      fixedArr.push('')
    }
    setPercentArr(fixedArr)
  }, [numberOfInputs, customInput])

  const total = useMemo(() => percentArr.reduce((sum, cur) => sum + validNumber(cur), 0), [percentArr])

  const errorMsg = useMemo(() => {
    let isError = false
    for (let i = 0; i < percentArr.length; i++) {
      if (validNumber(percentArr[i]) === 0) {
        isError = true
        break
      }
    }
    if (isError) {
      return 'All the fields must be filled.'
    }
    if (total !== 100) {
      return 'Total Split Amount must be 100%.'
    }
    return null
  }, [percentArr, total])

  const handleSplit = useCallback(
    (confirm = false) => {
      if (errorMsg) {
        warnToast(errorMsg, 'warn')
        return
      }
      if (status === AUTOMATION_STATUS.CANCELED && contract.balance > 0 && !confirm) {
        setWarnWithdrawFunds(true)
        return
      }
      onSplit(selected, percentArr, () => {
        setPopup(false)
        updateVeTHEs()
      })
    },
    [errorMsg, status, contract.balance, onSplit, selected, percentArr, setPopup, updateVeTHEs],
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
            handleSplit(true)
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
          <TextHeading>{t('Split veTHE #[Number] into', { id: selected.id })}</TextHeading>
          <Selection data={lockSelections} isFull />
        </div>
        {isCustom && (
          <div className='flex flex-col gap-2 border-b border-neutral-700 pb-5'>
            <TextHeading>{t('Received Tokens')}</TextHeading>
            <Input
              val={customInput}
              onChange={e => {
                if (!isInvalidAmount(e.target.value)) {
                  const nums = Number(e.target.value)
                  setCustomInput(Math.max(Math.min(10, nums), 5))
                } else {
                  setCustomInput('')
                }
              }}
              placeholder='Enter token amount'
            />
          </div>
        )}
        <div className='flex max-h-[300px] flex-col gap-4 overflow-auto'>
          {percentArr.map((item, idx) => (
            <div className='flex flex-col gap-2' key={`split${idx}`}>
              <div className='flex items-center justify-between'>
                <TextHeading>{t('Token [x]', { x: idx + 1 })}</TextHeading>
                <Paragraph>
                  veTHE {t('Amount')}: {formatAmount(selected.voting_amount.times(validNumber(item)).div(100))}
                </Paragraph>
              </div>
              <Input
                val={item}
                onChange={e => {
                  const val = validNumber(e.target.value)
                  const temp = [...percentArr]
                  if (val > 0) {
                    const newVal =
                      total - validNumber(percentArr[idx]) + val > 100
                        ? 100 - total + validNumber(percentArr[idx])
                        : val
                    temp[idx] = newVal > 0 ? newVal : ''
                    setPercentArr(temp)
                  } else {
                    temp[idx] = ''
                    setPercentArr(temp)
                  }
                }}
                suffix='%'
                placeholder='Enter a value'
              />
            </div>
          ))}
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph>{t('Total Split Amount')}</Paragraph>
          <TextHeading>{total}%</TextHeading>
        </div>
        {hasActiveAutomation && <ErrorMessage className='lg:p-4' message={t('Waring automation manage')} />}
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <PrimaryButton className='w-full' onClick={() => handleSplit()} disabled={pending || hasActiveAutomation}>
          {t('Split')}
        </PrimaryButton>
      </ModalFooter>
    </>
  )
}
