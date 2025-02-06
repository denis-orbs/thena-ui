import React from 'react'

import Step1Settings from './Steps/Step1Settings'
import Step2Vote from './Steps/Step2Vote'
import Step3Create from './Steps/Step3Create'

function StepContent({ currentStep, isEdit }) {
  switch (currentStep) {
    case 1:
      return <Step1Settings isEdit={isEdit} />
    case 2:
      return <Step2Vote />
    case 3:
      return <Step3Create />
    default:
      return null
  }
}

export default StepContent
