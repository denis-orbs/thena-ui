'use client'

import { isEmpty } from 'lodash'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import Loading from '@/app/loading'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { NewTextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useBackURL } from '@/hooks/useBackURL'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { cn } from '@/lib/utils'
import ChooseTokenAndWeights from '@/modules/WeightedPool/ChooseTokenAndWeights'
import Preview from '@/modules/WeightedPool/Preview'
import SetWeightedAttributes from '@/modules/WeightedPool/SetWeightedAttributes'
import SideBarCreateWeighted from '@/modules/WeightedPool/SideBarCreateWeighted'
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
  const t = useTranslations()
  const { push } = useRouter()
  const backUrl = useBackURL(PAIR_TYPES.WEIGHTED)
  const { is2XlDown } = useMediaQuery()

  const { tokens: tokensSelected } = useSelector(state => state.weightedPool)

  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const currentStep = Number(searchParams.get('step'))
  useEffect(() => {
    if (!currentStep) {
      updateSearchParams({ step: 1 })
    }
  }, [currentStep, updateSearchParams])
  const assets = useAssets()
  const [fees, setFees] = useState(0.3)
  const [tokensAndWeights, setTokenAndWeights] = useState([])
  const poolName = useMemo(
    () =>
      ([...tokensAndWeights] || [])
        .sort((a, b) => b.weight - a.weight)
        .map(token => token.token.symbol)
        .join(' | '),
    [tokensAndWeights],
  )

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

  if (!tokensAndWeights || isEmpty(tokensAndWeights)) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton
      hiddenBackButton={is2XlDown}
      backUrl={backUrl}
      className='mx-auto xl:!mt-6 xl:!w-[1184px] 2xl:!mt-8 2xl:!w-[1312px] 3xl:!mt-16 3xl:!w-[1440px]'
    >
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-8'>
          <ScalesIcon className='hidden size-14 lg:block' />
          <NewTextHeading className='xl:!text-[40px] xl:!leading-[48px]'>{t('Create Weighted Pool')}</NewTextHeading>
        </div>
        <div
          className={cn('flex flex-col-reverse gap-4 xl:grid xl:grid-cols-2', currentStep === 3 && 'xl:grid-cols-1')}
        >
          <div className='w-full flex-2 lg:flex-1'>
            <PoolWithStep
              currentStep={currentStep}
              setCurrentStep={step => updateSearchParams({ step }, true)}
              setTokenAndWeights={setTokenAndWeights}
              tokensAndWeights={tokensAndWeights}
              initialPoolSymbol={initialPoolSymbol}
              fees={fees}
              setFees={setFees}
              assets={assets}
              poolName={poolName}
            />
          </div>
          {currentStep !== 3 && (
            <div className={cn('hidden flex-1 flex-col gap-2 lg:flex lg:flex-[4]', currentStep === 1 && 'block')}>
              <SideBarCreateWeighted fees={fees} step={currentStep} tokensAndWeights={tokensAndWeights} />
            </div>
          )}
        </div>
      </div>
    </LayoutWithBackButton>
  )
}
