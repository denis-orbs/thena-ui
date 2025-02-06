import React from 'react'

import Step1Details from './Steps/Step1Details'
import Step2Settings from './Steps/Step2Settings'
import Step3Vote from './Steps/Step3Vote'
import Step4Create from './Steps/Step4Create'

function StepContent({ currentStep, isEdit }) {
  switch (currentStep) {
    case 1:
      return <Step1Details isEdit={isEdit} />
    case 2:
      return <Step2Settings />
    case 3:
      return <Step3Vote />
    case 4:
      return <Step4Create />
    default:
      return null
  }
}

export default StepContent
