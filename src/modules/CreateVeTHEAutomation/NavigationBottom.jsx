import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import SuccessModal from '@/components/modal/SuccessModal'
import { useCreateAutomation, useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import { warnToast } from '@/lib/notify'
import { convertBooleansToHex, isInvalidAmount } from '@/lib/utils'

import { ErrorMessage } from '../WeightedPool/ChooseTokenAndWeights'

const checkDisabledState = ({ currentStep, settings, isAutoVote, pairs, registration, minimumBalance, t }) => {
  const message = null

  if (currentStep === 1) {
    return { isDisabled: !settings?.executionTime, message }
  }

  if (currentStep === 2 && isAutoVote) {
    if (isEmpty(pairs)) return { isDisabled: true, message: 'Please select Pair' }

    if (pairs.some(pair => !pair.pair) && isAutoVote) {
      return { isDisabled: true, message: 'Please select Pair' }
    }

    if (pairs.some(pair => pair.weight <= 0 || !pair.weight)) {
      return { isDisabled: true, message: t('Invalid Weight') }
    }

    const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0)
    if (totalWeight !== 100) {
      return { isDisabled: true, message: t('Total weight invalid') }
    }
  }

  if (currentStep === 3) {
    if (
      !registration?.chainlink ||
      !registration?.chainlinkAmount ||
      minimumBalance.gt(registration?.chainlinkAmount)
    ) {
      return { isDisabled: true, message }
    }
  }

  return { isDisabled: false, message }
}

function NavigationBottom({ currentStep, onNext, onPrev }) {
  const [isActive, setIsActive] = useState(false)
  const t = useTranslations()
  const { createData } = useSelector(state => state.veTHEAutomationContract, shallowEqual)
  const { minimumFunds: minimumBalance } = useGetMinimumFunds(
    createData.veTHEId,
    convertBooleansToHex(
      createData.votes.isAutoVote,
      createData.settings.isRelockEveryWeek,
      createData.settings.isClaimEveryWeek,
    ),
    (createData?.votes?.pairs || []).length,
  )
  const { push } = useRouter()

  const { onCreateAutomation, pending: pendingCreate } = useCreateAutomation()

  const [isSuccess, setIsSuccess] = useState(false)

  const [error, setError] = useState(null)
  const handleValidate = useCallback(() => {
    setIsActive(true)
    const { isDisabled: disabledState, message } = checkDisabledState({
      currentStep,
      settings: createData?.settings,
      isAutoVote: createData?.votes?.isAutoVote,
      pairs: createData?.votes?.pairs || [],
      registration: createData?.registration,
      minimumBalance,
      t,
    })
    setError(message)
    if (!disabledState && currentStep < 3) {
      setIsActive(false)
      onNext()
    }
    if (!disabledState && currentStep === 3) {
      onCreateAutomation(createData, () => {
        setIsSuccess(true)
      })
    }
  }, [createData, currentStep, minimumBalance, onCreateAutomation, onNext, t])

  useEffect(() => {
    if (isActive) {
      const { message } = checkDisabledState({
        currentStep,
        settings: createData?.settings,
        isAutoVote: createData?.votes?.isAutoVote,
        pairs: createData?.votes?.pairs || [],
        registration: createData?.registration,
        minimumBalance,
        t,
      })
      setError(message)
    }
  }, [
    createData?.registration,
    createData?.settings,
    createData?.votes?.isAutoVote,
    createData?.votes?.pairs,
    currentStep,
    isActive,
    minimumBalance,
    t,
  ])

  return (
    <div className='flex flex-col gap-4'>
      {Boolean(error) && <ErrorMessage className='lg:p-4' message={error} />}
      <>
        {currentStep < 3 && (
          <PrimaryButton className='w-full' onClick={() => handleValidate()}>
            {t('Next')}
          </PrimaryButton>
        )}

        {currentStep === 3 && (
          <PrimaryButton
            disabled={pendingCreate}
            className='w-full'
            onClick={
              () => {
                if (
                  isInvalidAmount(createData?.registration?.chainlinkAmount) ||
                  createData?.registration?.chainlink?.balance < createData?.registration?.chainlinkAmount
                ) {
                  warnToast(t('Invalid Amount'))
                  return
                }
                handleValidate()
              }
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            {t('Create Automation')}
          </PrimaryButton>
        )}
        {currentStep > 1 && (
          <EmphasisButton className='w-full lg:hidden' onClick={onPrev}>
            {t('Back')}
          </EmphasisButton>
        )}
      </>
      <SuccessModal
        isOpen={!pendingCreate && isSuccess}
        heading={t('Success')}
        message={t('You have successfully created automation for your [veTHEId] veTHE ID', {
          veTHEId: createData?.veTHEId || '',
        })}
        onClose={() => {
          setIsSuccess(false)
        }}
        buttonAction={
          <EmphasisButton onClick={() => push(`/dashboard/lock/automation/${createData.veTHEId}`)} className='w-full'>
            {t('View Details')}
          </EmphasisButton>
        }
      />
    </div>
  )
}

export default NavigationBottom
