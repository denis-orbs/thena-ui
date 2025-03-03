'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading } from '@/components/typography'
import { ArrowLeftIcon, InfoNeutralIcon } from '@/svgs'

import NavigationBottom from './NavigationBottom'
import NavigationTop from './NavigationTop'
import SelectedVeTHEID from './SelectedVeTHEID'
import StepContent from './StepContent'
import Stepper from './Stepper'

const NAVIGATION_TYPE = {
  NEXT: 'next',
  PREV: 'prev',
}

const steps = ['Settings', 'Vote', 'Create']
const stepsTitle = ['Settings', 'Voting Pairs and Weights', 'Create Contract']
function CreateVeTHEAutomation() {
  const { veTHESelected } = useSelector(state => state.veTHEAutomationContract)
  const t = useTranslations()
  const [currentStep, setCurrentStep] = useState(1)

  const { push } = useRouter()

  const handleNavigation = type => {
    if (currentStep < steps.length && type === NAVIGATION_TYPE.NEXT) setCurrentStep(currentStep + 1)

    if (currentStep > 1 && type === NAVIGATION_TYPE.PREV) setCurrentStep(currentStep - 1)
  }

  return (
    <div className='space-y-8'>
      <div>
        <div className='mb-4 h-11 w-[140px]'>
          <TextButton onClick={() => push('/dashboard/lock')} LeadingIcon={ArrowLeftIcon}>
            {t('Lock Page')}
          </TextButton>
        </div>
        <TextHeading className='font-archia text-3xl font-semibold text-neutral-50 lg:text-[40px]'>
          {t('Create Automation Contract')}
        </TextHeading>
      </div>
      <div className='space-y-3'>
        {currentStep === 1 && (
          <div className='flex gap-4 rounded-xl border border-neutral-600 bg-neutral-900 p-4 md:p-6 lg:p-8'>
            <InfoNeutralIcon className='h-8 w-8' />
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-xl'>{t('What you need to create an Automation')}</TextHeading>
              <div className='flex flex-col gap-4'>
                <Paragraph className='text-base'>
                  {t('To create an automation, the following prerequisites must be met')}:
                </Paragraph>
                <ul className='list-disc px-6 text-neutral-300'>
                  <li>
                    An existing{' '}
                    <TextHeading
                      className='cursor-pointer text-primary-500 hover:underline'
                      onClick={() => push('/dashboard/lock')}
                    >
                      veTHE
                    </TextHeading>{' '}
                    position.
                  </li>
                  <li>
                    Approximately $150-$200 USD worth of{' '}
                    <TextHeading
                      className='cursor-pointer text-primary-500 hover:underline'
                      onClick={
                        () =>
                          push(
                            '/swap?inputCurrency=BNB&outputCurrency=0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd&swapType=1',
                          )
                        // eslint-disable-next-line react/jsx-curly-newline
                      }
                    >
                      $LINK
                    </TextHeading>{' '}
                    in your wallet.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <div className='flex flex-col gap-5 lg:flex-row xl:gap-8'>
          {/* Stepper */}
          <div className='max-lg:hidden lg:min-w-[200px] xl:min-w-[320px]'>
            <Stepper steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} />
          </div>

          {/* Main Content */}
          <Box className='grid flex-1 grid-rows-[auto,1fr,auto] space-y-4 p-4 lg:p-4 xl:min-w-[480px]'>
            <NavigationTop
              steps={stepsTitle}
              currentStep={currentStep}
              onPrev={() => handleNavigation(NAVIGATION_TYPE.PREV)}
            />
            <StepContent currentStep={currentStep} />
            <NavigationBottom currentStep={currentStep} onNext={() => handleNavigation(NAVIGATION_TYPE.NEXT)} />
          </Box>

          {/* Selected veTHE ID */}
          <div className='space-y-4 xl:w-[380px] xl:min-w-[300px]'>
            <SelectedVeTHEID veTHESelected={veTHESelected} />
            {currentStep > 1 && (
              <Box className='flex w-fit flex-col gap-2 p-4'>
                <TextHeading className='font-archia text-xl font-semibold'>{t('Why do you need LINK')}?</TextHeading>
                <Paragraph>{t('Why do you need LINK Answer')}</Paragraph>
              </Box>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateVeTHEAutomation
