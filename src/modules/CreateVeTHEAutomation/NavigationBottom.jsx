import { isEmpty } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { useCreateAutomation } from '@/hooks/automationContract/useAutomationContract'

import { ErrorMessage } from '../WeightedPool/ChooseTokenAndWeights'

function NavigationBottom({ currentStep, onNext, isEdit }) {
  const t = useTranslations()

  const { createData } = useSelector(state => state.veTHEAutomationContract)

  const [error, setError] = useState()

  const { onCreateAutomation, pending: pendingCreate } = useCreateAutomation()

  const isDisabled = useMemo(() => {
    if (currentStep === 1) {
      return !createData?.veTHEId
    }

    if (currentStep === 2) {
      return !createData?.settings?.executionTime
    }

    if (currentStep === 3) {
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

    setError()
    return false
  }, [createData?.settings?.executionTime, createData?.veTHEId, createData?.votes?.pairs, currentStep, t])

  return (
    <div className='mt-4 space-y-4'>
      {Boolean(error) && <ErrorMessage className='lg:p-4' message={error} />}
      <>
        {isEdit ? (
          <>
            {currentStep < 4 && (
              <div className='grid w-full grid-cols-2 gap-4'>
                <EmphasisButton className='w-full' onClick={onNext} disabled={isDisabled}>
                  {t('Next')}
                </EmphasisButton>
                <PrimaryButton className='w-full' disabled={isDisabled}>
                  {t('Save Changes')}
                </PrimaryButton>
              </div>
            )}
            {currentStep === 4 && (
              <PrimaryButton disabled={pendingCreate} className='w-full' onClick={() => onCreateAutomation(createData)}>
                {t('Save Changes')}
              </PrimaryButton>
            )}
          </>
        ) : (
          <>
            {currentStep < 4 && (
              <PrimaryButton className='w-full' onClick={onNext} disabled={isDisabled}>
                {t('Next')}
              </PrimaryButton>
            )}

            {currentStep === 4 && (
              <PrimaryButton disabled={pendingCreate} className='w-full' onClick={() => onCreateAutomation(createData)}>
                {t('Confirm')}
              </PrimaryButton>
            )}
          </>
        )}
      </>
    </div>
  )
}

export default NavigationBottom
