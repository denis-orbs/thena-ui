'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { createVeTHEAutomationContract, setSelectedVeTHE } from '@/state/veTHEAutomationContract/action'
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
function CreateVeTHEAutomation({ contractData, isEdit, mutateAutomationData }) {
  const { veTHESelected } = useSelector(state => state.veTHEAutomationContract)
  const t = useTranslations()
  const [currentStep, setCurrentStep] = useState(1)
  const { veTHEs } = useVeTHEsContext()
  const [isInitialed, setIsInitialed] = useState(false)

  const { push } = useRouter()

  const handleNavigation = type => {
    if (currentStep < steps.length && type === NAVIGATION_TYPE.NEXT) setCurrentStep(currentStep + 1)

    if (currentStep > 1 && type === NAVIGATION_TYPE.PREV) setCurrentStep(currentStep - 1)
  }

  const dispatch = useDispatch()

  useEffect(() => {
    if (isEdit && contractData && !isInitialed) {
      dispatch(createVeTHEAutomationContract({ createData: { ...contractData } }))
      const { veTHEId } = contractData
      const veTHE = veTHEs.find(ve => ve.id.toString() === veTHEId)
      if (veTHE) {
        dispatch(
          setSelectedVeTHE({
            veTHESelected: {
              id: veTHE.id,
              amount: veTHE.amount.toString(),
              rebase_amount: veTHE.rebase_amount.toString(),
              voting_amount: veTHE.voting_amount.toString(),
              lockedEnd: veTHE.lockedEnd,
            },
          }),
        )
        setIsInitialed(true)
      }
    }
  }, [contractData, dispatch, isEdit, veTHEs, isInitialed])

  return (
    <div className='space-y-10'>
      <div>
        <div className='h-11 w-[140px]'>
          <TextButton onClick={() => push('/dashboard/lock')} LeadingIcon={ArrowLeftIcon}>
            {t('Lock Page')}
          </TextButton>
        </div>
        <TextHeading className='font-archia text-3xl font-semibold text-neutral-50 lg:text-[40px]'>
          {t(isEdit ? 'Edit Automation Contract' : 'Create Automation Contract')}
          {isEdit && ` ${contractData.veTHEId}`}
        </TextHeading>
      </div>
      <div className='flex flex-col gap-5 lg:flex-row xl:gap-8'>
        {/* Stepper */}
        <div className='max-lg:hidden xl:min-w-[380px]'>
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Main Content */}
        <Box className='flex-1 space-y-9 xl:min-w-[500px]'>
          <NavigationTop
            steps={stepsTitle}
            currentStep={currentStep}
            onPrev={() => handleNavigation(NAVIGATION_TYPE.PREV)}
          />
          <StepContent currentStep={currentStep} isEdit={isEdit} />
          <NavigationBottom
            currentStep={currentStep}
            onNext={() => handleNavigation(NAVIGATION_TYPE.NEXT)}
            isEdit={isEdit}
            mutateAutomationData={mutateAutomationData}
          />
        </Box>

        {/* Selected veTHE ID */}
        <div className='xl:min-w-[380px]'>
          <SelectedVeTHEID veTHESelected={veTHESelected} />
        </div>
      </div>
    </div>
  )
}

export default CreateVeTHEAutomation
