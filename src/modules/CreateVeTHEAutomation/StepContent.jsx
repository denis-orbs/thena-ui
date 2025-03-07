import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import { convertBooleansToHex } from '@/lib/utils'

import Step1Settings from './Steps/Step1Settings'
import Step2Vote from './Steps/Step2Vote'
import Step3Create from './Steps/Step3Create'

function StepContent({ currentStep }) {
  const [step2Active, setStep2Active] = useState(false)
  const { createData } = useSelector(state => state.veTHEAutomationContract)

  const pairLength = useMemo(
    () => (step2Active ? (createData?.votes?.pairs || []).filter(item => Boolean(item.pair)).length : 0),
    [createData?.votes?.pairs, step2Active],
  )

  const { minimumFunds: minFunds, isLoading: isLoadingMinFunds } = useGetMinimumFunds(
    createData?.veTHEId,
    convertBooleansToHex(
      step2Active && pairLength > 0 ? createData?.votes?.isAutoVote : false,
      createData?.settings?.isClaimEveryWeek,
      createData?.settings?.isRelockEveryWeek,
    ),
    pairLength,
  )
  switch (currentStep) {
    case 1:
      return <Step1Settings minFunds={minFunds} isLoadingMinFunds={isLoadingMinFunds} />
    case 2:
      return (
        <Step2Vote
          step2Active={step2Active}
          setStep2Active={setStep2Active}
          minFunds={minFunds}
          isLoadingMinFunds={isLoadingMinFunds}
        />
      )
    case 3:
      return <Step3Create />
    default:
      return null
  }
}

export default StepContent
