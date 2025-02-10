import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import SuccessModal from '@/components/modal/SuccessModal'
import { useCreateAutomation, useGetMaxPaymentForGas } from '@/hooks/automationContract/useAutomationContract'

import { ErrorMessage } from '../WeightedPool/ChooseTokenAndWeights'

function NavigationBottom({ currentStep, onNext }) {
  const t = useTranslations()
  const maxPaymentForGas = useGetMaxPaymentForGas()
  const { createData } = useSelector(state => state.veTHEAutomationContract)
  const { push } = useRouter()

  const [error, setError] = useState()

  const { onCreateAutomation, pending: pendingCreate } = useCreateAutomation()

  const [isSuccess, setIsSuccess] = useState(false)

  const isDisabled = useMemo(() => {
    if (currentStep === 1) {
      return !createData?.settings?.executionTime
    }

    if (currentStep === 2 && createData?.votes?.isAutoVote) {
      const pairs = createData?.votes?.pairs || []

      if (isEmpty(pairs)) return true

      const checkInvalidPair = pairs.some(pair => !pair.pair)
      if (checkInvalidPair) return true

      const checkInvalidWeight = pairs.some(pair => pair.weight <= 0 || !pair.weight)
      if (checkInvalidWeight) {
        setError(t('InvalidWeight'))
        return true
      }

      const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0)

      if (totalWeight < 100 || totalWeight > 100) {
        setError(t('Total weight invalid'))
        return true
      }
    }

    if (currentStep === 3) {
      if (
        !createData.registration?.chainlink ||
        !createData.registration?.chainlinkAmount ||
        maxPaymentForGas.gt(createData.registration?.chainlinkAmount)
      ) {
        return true
      }
    }

    setError()
    return false
  }, [
    createData.registration?.chainlink,
    createData.registration?.chainlinkAmount,
    createData?.settings?.executionTime,
    createData?.votes?.isAutoVote,
    createData?.votes?.pairs,
    currentStep,
    maxPaymentForGas,
    t,
  ])

  return (
    <div className='mt-4 space-y-4'>
      {Boolean(error) && <ErrorMessage className='lg:p-4' message={error} />}
      <>
        {currentStep < 3 && (
          <PrimaryButton className='w-full' onClick={onNext} disabled={isDisabled}>
            {t('Next')}
          </PrimaryButton>
        )}

        {currentStep === 3 && (
          <PrimaryButton
            disabled={pendingCreate || isDisabled}
            className='w-full'
            onClick={
              () =>
                onCreateAutomation(createData, () => {
                  setIsSuccess(true)
                })
              // eslint-disable-next-line react/jsx-curly-newline
            }
          >
            {t('Create Automation')}
          </PrimaryButton>
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
