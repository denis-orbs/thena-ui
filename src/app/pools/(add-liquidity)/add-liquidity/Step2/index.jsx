import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { PAIR_TYPES } from '@/constant'
import { updateStrategy } from '@/state/fusion/actions'

import ChooseTokensSection from './ChooseTokensSection'
import PoolDescriptionSection from '../PoolTitleDescription'
import PoolTitleSection from '../PoolTitleSection'

export default function Step2() {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || PAIR_TYPES.LSD

  useEffect(() => {
    dispatch(updateStrategy({ strategy: null }))
  }, [dispatch])

  return (
    <div className='space-y-4 md:space-y-8'>
      <PoolTitleSection pairType={pairType} />

      <div className='lg:grid-cols-add-liquidity-layout grid gap-4'>
        <ChooseTokensSection pairType={pairType} />
        <PoolDescriptionSection pairType={pairType} />
      </div>
    </div>
  )
}
