import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import { convertBooleansToHex } from '@/lib/utils'

import Step1Settings from './Steps/Step1Settings'
import Step2Vote from './Steps/Step2Vote'
import Step3Create from './Steps/Step3Create'

function StepContent({ currentStep }) {
  const [step2Active, setStep2Active] = useState(false)
  const { createData } = useSelector(state => state.veTHEAutomationContract)

  const minFunds = useGetMinimumFunds(
    createData?.veTHEId,
    convertBooleansToHex(
      step2Active ? createData?.votes?.isAutoVote : false,
      createData?.settings?.isClaimEveryWeek,
      createData?.settings?.isRelockEveryWeek,
    ),
    step2Active ? (createData?.votes?.pairs || []).filter(item => Boolean(item.pair)).length : 0,
  )
  switch (currentStep) {
    case 1:
      return <Step1Settings step2Active={step2Active} minFunds={minFunds} />
    case 2:
      return <Step2Vote step2Active={step2Active} setStep2Active={setStep2Active} minFunds={minFunds} />
    case 3:
      return <Step3Create />
    default:
      return null
  }
}

export default StepContent
