'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { usePairs } from '@/context/pairsContext'

import AddLiquidity from './AddLiquidity'

export default function AddLiquidityPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { pairs } = usePairs()

  const poolAddress = searchParams.get('pool')
  const [poolSelected, setPoolSelected] = useState(null)
  const [step, setStep] = useState(Number(searchParams.get('step') ?? 1))

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

  return (
    <div className='container mx-auto flex flex-col'>
      <AddLiquidity pool={poolSelected} setStep={setStep} step={step} />
    </div>
  )
}
