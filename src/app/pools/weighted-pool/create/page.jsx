'use client'

import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import Loading from '@/app/loading'
import { NewTextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { cn, formatAmount } from '@/lib/utils'
import ChooseTokenAndWeights, { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'
import Preview from '@/modules/WeightedPool/Preview'
import SetWeightedAttributes from '@/modules/WeightedPool/SetWeightedAttributes'
import SideBarCreateWeighted from '@/modules/WeightedPool/SideBarCreateWeighted'
import StepCreate from '@/modules/WeightedPool/StepCreate'
import { ScalesIcon } from '@/svgs'

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
}) {
  switch (currentStep) {
    case 1: {
      return (
        <ChooseTokenAndWeights
          setCurrentStep={setCurrentStep}
          tokensAndWeights={tokensAndWeights}
          setTokenAndWeights={setTokenAndWeights}
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

  const renderMessages = useCallback(() => {
    const errorMessages = []
    if (!checkAllWeightingHigherThanZero) {
      errorMessages.push(t('All tokens in a pool must have a weighting higher than zero'))
    }

    const totalWeight = tokensAndWeights.reduce((sum, curr) => sum + curr.weight, 0)

    if (totalWeight > 100) {
      errorMessages.push(t('Warning total weight Weighted Pool'))
    }

    return errorMessages.map((message, index) => <ErrorMessage key={index} message={message} />)
  }, [checkAllWeightingHigherThanZero, t, tokensAndWeights])

  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const totalBalance = useMemo(
    () =>
      tokensAndWeights.reduce((sum, curr) => {
        const { token } = curr
        if (token) {
          const { balance } = token
          const amountToWei = typeof balance !== 'number' ? balance.toNumber() : balance
          const usdValue = getValueTokenAmountToUSD(token.address, amountToWei)
          return sum + usdValue
        }
        return sum
      }, 0),
    [getValueTokenAmountToUSD, tokensAndWeights],
  )

  if (!tokensAndWeights || isEmpty(tokensAndWeights)) {
    return <Loading />
  }

  return (
    <div className='flex flex-col gap-8'>
      <StepCreate currentStep={currentStep} />
      <div className='flex items-center gap-8'>
        <ScalesIcon className='h-[86px] w-[86px]' />
        <NewTextHeading>{t('Create Weighted Pool')}</NewTextHeading>
      </div>
      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <div className='space-y-4'>
          {tokensAndWeights.length > 0 && totalBalance < 20000 ? (
            <ErrorMessage
              type='warn'
              message={t('We recommend you to provide new pools [symbol]', { yourBalance: formatAmount(totalBalance) })}
            />
          ) : (
            <></>
          )}
          {renderMessages()}
        </div>
      </div>
      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
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
          />
        </div>
        <div className={cn('flex flex-[4] flex-col gap-8', currentStep === 3 && 'hidden')}>
          <SideBarCreateWeighted fees={fees} step={currentStep} tokensAndWeights={tokensAndWeights} />
        </div>
      </div>
    </div>
  )
}
