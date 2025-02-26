'use client'

import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import Loading from '@/app/loading'
import { NewTextHeading, TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { cn, isInvalidAmount } from '@/lib/utils'
import ChooseTokenAndWeights from '@/modules/WeightedPool/ChooseTokenAndWeights'
import Preview from '@/modules/WeightedPool/Preview'
import SetWeightedAttributes from '@/modules/WeightedPool/SetWeightedAttributes'
import SideBarCreateWeighted from '@/modules/WeightedPool/SideBarCreateWeighted'
import StepCreate from '@/modules/WeightedPool/StepCreate'
import { InfoIcon, ScalesIcon, WarningTriangleIcon } from '@/svgs'

function PoolWithStep({
  currentStep,
  setCurrentStep,
  tokensAndWeights,
  setTokenAndWeights,
  fees,
  setFees,
  initialPoolSymbol,
  poolName,
  setPoolName,
  setCheckError,
}) {
  switch (currentStep) {
    case 1: {
      return (
        <ChooseTokenAndWeights
          setCurrentStep={setCurrentStep}
          tokensAndWeights={tokensAndWeights}
          setTokenAndWeights={setTokenAndWeights}
          setCheckError={setCheckError}
        />
      )
    }

    case 2: {
      return (
        <SetWeightedAttributes
          setCurrentStep={setCurrentStep}
          setTokenAndWeights={setTokenAndWeights}
          tokensAndWeights={tokensAndWeights}
          fees={fees}
          setFees={setFees}
          poolName={poolName}
          setPoolName={setPoolName}
        />
      )
    }

    case 3: {
      return (
        <Preview
          setCurrentStep={setCurrentStep}
          tokensAndWeights={tokensAndWeights}
          fees={fees}
          setFees={setFees}
          initialPoolSymbol={initialPoolSymbol}
          poolName={poolName}
          setPoolName={setPoolName}
        />
      )
    }

    default:
      return (
        <ChooseTokenAndWeights
          setCurrentStep={setCurrentStep}
          tokensAndWeights={tokensAndWeights}
          setTokenAndWeights={setTokenAndWeights}
        />
      )
  }
}

export default function CreateWeightedPoolPage() {
  const { tokens: tokensSelected } = useSelector(state => state.weightedPool)
  const assets = useAssets()
  const [fees, setFees] = useState(0.3)
  const [poolName, setPoolName] = useState('')
  const [tokensAndWeights, setTokenAndWeights] = useState([])
  const t = useTranslations()
  const { push } = useRouter()
  const [checkError, setCheckError] = useState(false)

  useEffect(() => {
    if (!tokensSelected || tokensSelected.length <= 1) {
      push('/pools/add-liquidity?step=2&pairType=Weighted')
    }
  }, [push, tokensSelected])

  useEffect(() => {
    setTokenAndWeights(
      (tokensSelected || []).map(token => ({
        token,
        lock: false,
        weight: null,
      })),
    )
  }, [tokensSelected])

  const [currentStep, setCurrentStep] = useState(1)
  const initialPoolSymbol = useMemo(() => {
    const result = tokensAndWeights.reduce(
      (str, curr, index) =>
        index > 0
          ? `${str}-${curr?.token?.symbol === 'WBNB' ? 'BNB' : curr?.token?.symbol}`
          : `${str}${curr?.token?.symbol === 'WBNB' ? 'BNB' : curr?.token?.symbol}`,
      '',
    )
    return result
  }, [tokensAndWeights])

  const checkAllWeightingHigherThanZero = useMemo(
    () => tokensAndWeights.every(item => item.weight > 0),
    [tokensAndWeights],
  )

  const totalWeight = useMemo(() => tokensAndWeights.reduce((sum, curr) => sum + curr.weight, 0), [tokensAndWeights])

  const renderMessages = useCallback(() => {
    const errorMessages = []
    if (!checkAllWeightingHigherThanZero) {
      errorMessages.push({ title: t('All tokens in a pool must have a weighting higher than zero') })
    }

    if (totalWeight !== 100) {
      errorMessages.push({
        title: t('Total Weights do not match 100%'),
        desc: t('The total weighting of all tokens must equal exactly 100% before you continue'),
      })
    }

    return errorMessages.map((data, index) => (
      <div className='flex items-center gap-4 rounded-lg border border-error-800 bg-error-950 px-4 py-5' key={index}>
        <WarningTriangleIcon className='h-5 w-5' />
        <div className='flex flex-col gap-1'>
          <TextHeading className='text-xl text-rose'>{data.title}</TextHeading>
          <TextSubHeading className='text-base text-rose'>{data.desc}</TextSubHeading>
        </div>
      </div>
    ))
  }, [checkAllWeightingHigherThanZero, t, totalWeight])

  const totalValueInUsd = useMemo(
    () =>
      tokensAndWeights.reduce((sum, curr) => {
        const { token, amount } = curr
        if (token) {
          return sum + Number(amount || 0) * token.price
        }
        return sum
      }, 0),
    [tokensAndWeights],
  )

  if (!tokensAndWeights || isEmpty(tokensAndWeights)) {
    return <Loading />
  }

  return (
    <div className='flex flex-col gap-16'>
      <StepCreate
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        disabled2={!checkAllWeightingHigherThanZero || totalWeight !== 100}
        disabled3={(tokensAndWeights || []).some(item => item?.isError || isInvalidAmount(item?.amount))}
      />
      <div className='flex items-center gap-8'>
        <ScalesIcon className='size-16' />
        <NewTextHeading>{t('Create Weighted Pool')}</NewTextHeading>
      </div>
      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <div className='space-y-4'>
          {tokensAndWeights.length > 0 && currentStep !== 2 && totalValueInUsd < 20000 ? (
            <div className='flex items-center gap-4 rounded-lg border border-warn-950 bg-warn-950 px-4 py-5'>
              <InfoIcon className={cn('h-5 w-5 !stroke-warn-600')} />
              <div className='flex flex-col gap-1'>
                <TextHeading className='text-xl text-rose'>{t('Initial funds')}</TextHeading>
                <TextSubHeading className='text-base text-rose'>
                  {t('We recommend you to provide new pools')}
                </TextSubHeading>
              </div>
            </div>
          ) : (
            <></>
          )}
          {checkError && renderMessages()}
        </div>
      </div>
      <div className={currentStep === 3 ? 'w-full' : 'grid gap-4 lg:grid-cols-add-liquidity-layout'}>
        <div className='w-full'>
          <PoolWithStep
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            setTokenAndWeights={setTokenAndWeights}
            tokensAndWeights={tokensAndWeights}
            initialPoolSymbol={initialPoolSymbol}
            fees={fees}
            setFees={setFees}
            assets={assets}
            poolName={poolName}
            setPoolName={setPoolName}
            setCheckError={setCheckError}
          />
        </div>
        <div className={cn('flex flex-[4] flex-col gap-8', currentStep === 3 && 'hidden')}>
          <SideBarCreateWeighted fees={fees} step={currentStep} tokensAndWeights={tokensAndWeights} />
        </div>
      </div>
    </div>
  )
}
