'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { ArrowLeftIcon } from '@/svgs'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

export default function AddLiquidityPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { pairs } = usePairs()

  const { push } = router
  const t = useTranslations()
  const poolAddress = searchParams.get('pool')
  const [poolSelected, setPoolSelected] = useState(null)
  const [isAutomatic, setIsAutomatic] = useState(true)
  const [isAdd, setIsAdd] = useState(false)
  const [strategy, setStrategy] = useState()

  const [step, setStep] = useState(
    isNaN(parseInt(searchParams.get('step'), 10)) ? 0 : parseInt(searchParams.get('step'), 10),
  )

  const poolDefault = useMemo(() => pairs.find(pool => pool.address === poolAddress), [pairs, poolAddress])

  useEffect(() => {
    if (poolDefault && !poolSelected) {
      setPoolSelected(poolDefault)
    }
  }, [poolDefault, poolSelected])

  useEffect(() => {
    const query = new URLSearchParams(searchParams.toString())

    if (poolSelected) {
      query.set('pool', poolSelected?.address)
    }

    if (step) {
      query.set('step', step)
    }

    router.replace(`${pathname}?${query.toString()}`)
  }, [pathname, poolSelected, router, searchParams, step])

  const layoutStep = useMemo(() => {
    switch (step) {
      case 0: {
        return (
          <Step1 nextStep={setStep} setPoolSelected={setPoolSelected} poolSelected={poolSelected} setIsAdd={setIsAdd} />
        )
      }
      case 1: {
        return (
          <>
            {poolSelected ? (
              <Step2
                pool={poolSelected}
                setCurrentStep={setStep}
                currentStep={step}
                isAutomatic={isAutomatic}
                setIsAutomatic={setIsAutomatic}
                isAdd={isAdd}
                setStrategy={setStrategy}
                strategy={strategy}
              />
            ) : (
              <Loading />
            )}
          </>
        )
      }

      case 2: {
        return (
          <>
            {poolSelected ? (
              <Step3
                isAdd={isAdd}
                isAutomatic={isAutomatic}
                pool={poolSelected}
                setCurrentStep={setStep}
                setStrategy={setStrategy}
                strategy={strategy}
              />
            ) : (
              <Loading />
            )}
          </>
        )
      }

      default: {
        return <Step1 nextStep={setStep} setPoolSelected={setPoolSelected} poolSelected={poolSelected} />
      }
    }
  }, [isAdd, isAutomatic, poolSelected, step, strategy])

  return (
    <div className='mx-auto flex max-w-[1028px] flex-col'>
      <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
          {t('Pools')}
        </TextButton>
      </div>
      <TextHeading className='mt-4 font-archia text-[26px] font-semibold lg:text-4xl'>{t('Add Liquidity')}</TextHeading>
      {layoutStep}
    </div>
  )
}
