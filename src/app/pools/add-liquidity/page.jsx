'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { usePairs } from '@/context/pairsContext'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

export default function AddLiquidityPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const poolAddress = searchParams.get('pool')

  const { pairs } = usePairs()
  const poolDefault = useMemo(() => pairs.find(pool => pool.address === poolAddress), [pairs, poolAddress])

  const [poolSelected, setPoolSelected] = useState(poolDefault)
  const [step, setStep] = useState(Number(searchParams.get('step') ?? 1))
  const [isAdd, setIsAdd] = useState(false)

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

  return (
    <div className='container mx-auto flex flex-col'>
      {step === 1 && <Step1 nextStep={setStep} setPoolSelected={setPoolSelected} setIsAdd={setIsAdd} />}
      {step === 2 && <Step2 pool={poolSelected} setStep={setStep} isAdd={isAdd} />}
      {step === 3 && <Step3 pool={poolSelected} setStep={setStep} isAdd={isAdd} />}
    </div>
  )
}
