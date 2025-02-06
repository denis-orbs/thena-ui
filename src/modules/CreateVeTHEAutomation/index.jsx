'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { ArrowLeftIcon } from '@/svgs'

import NavigationBottom from './NavigationBottom'
import NavigationTop from './NavigationTop'
import SelectedVeTHEID from './SelectedVeTHEID'
import StepContent from './StepContent'
import Stepper from './Stepper'

const NAVIGATION_TYPE = {
  NEXT: 'next',
  PREV: 'prev',
}

const steps = ['Details', 'Settings', 'Vote', 'Create']
const stepsTitle = ['Details', 'Settings', 'Voting Pairs and Weights', 'Create Contract']
function CreateVeTHEAutomation() {
  const { veTHESelected } = useSelector(state => state.veTHEAutomationContract)
  const t = useTranslations()
  const [currentStep, setCurrentStep] = useState(1)

  const handleNavigation = type => {
    if (currentStep < steps.length && type === NAVIGATION_TYPE.NEXT) setCurrentStep(currentStep + 1)

    if (currentStep > 1 && type === NAVIGATION_TYPE.PREV) setCurrentStep(currentStep - 1)
  }

  return (
    <div className='space-y-10'>
      <div>
        <div className='h-11 w-[140px]'>
          <TextButton onClick={() => {}} LeadingIcon={ArrowLeftIcon}>
            {t('Lock Page')}
          </TextButton>
        </div>
        <TextHeading className='font-archia text-3xl font-semibold text-neutral-50 lg:text-[40px]'>
          {t('Create Automation Contract')}
        </TextHeading>
      </div>
      <div className='flex flex-col gap-8 lg:flex-row'>
        {/* Stepper */}
        <div className='max-lg:hidden lg:min-w-[380px]'>
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Main Content */}
        <Box className='flex-1 space-y-9 lg:min-w-[500px]'>
          <NavigationTop
            steps={stepsTitle}
            currentStep={currentStep}
            onPrev={() => handleNavigation(NAVIGATION_TYPE.PREV)}
          />
          <StepContent currentStep={currentStep} />
          <NavigationBottom currentStep={currentStep} onNext={() => handleNavigation(NAVIGATION_TYPE.NEXT)} />
        </Box>

        {/* Selected veTHE ID */}
        <div className='lg:min-w-[380px]'>
          <SelectedVeTHEID veTHESelected={veTHESelected} />
        </div>
      </div>
    </div>
  )
}

export default CreateVeTHEAutomation
