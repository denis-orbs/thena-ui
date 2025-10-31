'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import Box from '@/components/box'
import { NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { CHAINLINK_ADDRESS } from '@/constant'
import { goToDoc } from '@/lib/utils'
import { InfoNeutralIcon } from '@/svgs'

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
    <div className='flex flex-col gap-8'>
      <NewTextHeading>{t('Create Automation')}</NewTextHeading>
      <div className='flex flex-col gap-3'>
        {currentStep === 1 && (
          <div className='hidden gap-4 rounded-xl border border-neutral-600 bg-neutral-900 p-4 md:p-6 lg:flex lg:p-8'>
            <InfoNeutralIcon className='h-8 w-8' />
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-xl'>{t('Information on creating veTHE automation')}</TextHeading>
              <div className='flex flex-col gap-4'>
                <ul className='list-disc px-6 text-neutral-300'>
                  <li>
                    You must have a{' '}
                    <TextHeading
                      className='text-primary-500 cursor-pointer hover:underline'
                      onClick={() => goToDoc('https://docs.thena.fi/thena/the-tokenomics/vethe-specs')}
                    >
                      veTHE
                    </TextHeading>{' '}
                    position and have already claimed your rebase.
                  </li>
                  <li>
                    You need to have approximately $15-$20 worth of{' '}
                    <Link
                      href={`/swap?inputCurrency=BNB&outputCurrency=${CHAINLINK_ADDRESS}&swapType=1`}
                      target='_blank'
                    >
                      <TextHeading className='text-primary-500 cursor-pointer hover:underline'>LINK</TextHeading>
                    </Link>{' '}
                    in your wallet for minimum deposit.
                  </li>
                  <li>
                    The minimum deposit will cover automation costs for a few months. Actual duration is determined
                    based on gas costs, your settings & available funds in the deposit account.
                  </li>
                  <li>
                    Next 3 Scheduled Dates are displayed for informational purposes. Automations will proceed as long as
                    sufficient funds are available in the deposit account.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <div className='flex flex-col gap-4 lg:flex-row xl:gap-8'>
          {/* Stepper */}
          <div className='order-1 max-lg:hidden lg:min-w-[200px] lg:flex-[2.5] xl:min-w-[320px]'>
            <Stepper steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} />
          </div>

          {/* Main Content - RELD NEEDS FURTHER UNDERSTANDING BEFORE IMPLEMENTING y4 */}
          <div className='order-3 grid grid-rows-[auto_1fr_auto] gap-y-4 bg-transparent lg:order-2 lg:min-w-[480px] lg:flex-5 lg:rounded-xl lg:bg-neutral-900 lg:p-4 xl:min-w-[480px]'>
            <NavigationTop
              steps={stepsTitle}
              currentStep={currentStep}
              onPrev={() => handleNavigation(NAVIGATION_TYPE.PREV)}
            />
            <StepContent currentStep={currentStep} />
            <NavigationBottom
              currentStep={currentStep}
              onNext={() => handleNavigation(NAVIGATION_TYPE.NEXT)}
              onPrev={() => handleNavigation(NAVIGATION_TYPE.PREV)}
            />
          </div>

          {/* Selected veTHE ID */}
          <div className='order-2 lg:order-3 lg:flex-[2.5] xl:w-[380px] xl:min-w-[300px]'>
            <SelectedVeTHEID veTHESelected={veTHESelected} />
            {currentStep > 1 && (
              <Box className='mt-4 flex w-fit flex-col gap-2 p-4 max-lg:hidden'>
                <TextHeading className='font-archia text-xl font-semibold'>{t('Why do you need LINK')}?</TextHeading>
                <Paragraph>{t('Why do you need LINK Answer')}</Paragraph>
              </Box>
            )}
            {currentStep === 1 && (
              <div className='mt-4 flex gap-4 rounded-xl border border-neutral-600 bg-neutral-900 p-4 lg:mt-0 lg:hidden lg:p-8'>
                <div className='size-6'>
                  <InfoNeutralIcon className='size-6' />
                </div>
                <div className='flex flex-col'>
                  <div className='flex flex-col'>
                    <TextHeading className='text-base font-bold'>
                      {t('Information on creating veTHE automation')}
                    </TextHeading>
                    <ul className='list-disc px-6 text-neutral-50'>
                      <li>
                        You must have a{' '}
                        <TextHeading
                          className='text-primary-500 cursor-pointer hover:underline'
                          onClick={() => push('/dashboard/lock')}
                        >
                          veTHE
                        </TextHeading>{' '}
                        position and have already claimed your rebase.
                      </li>
                      <li>
                        You need to have approximately $15-$20 worth of{' '}
                        <TextHeading
                          className='text-primary-500 cursor-pointer hover:underline'
                          onClick={() => {
                            push(`/swap?inputCurrency=BNB&outputCurrency=${CHAINLINK_ADDRESS}bd&swapType=1`)
                          }}
                        >
                          LINK
                        </TextHeading>{' '}
                        in your wallet for minimum deposit.
                      </li>
                      <li>
                        The minimum deposit will cover automation costs for a few months. Actual duration is determined
                        based on gas costs, your settings & available funds in the deposit account.
                      </li>
                      <li>
                        Next 3 Scheduled Dates are displayed for informational purposes. Automations will proceed as
                        long as sufficient funds are available in the deposit account.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateVeTHEAutomation
