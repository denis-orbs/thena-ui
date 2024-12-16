import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { TextIconButton } from '@/components/buttons/IconButton'
import { ArrowLeftIcon } from '@/svgs'

import AddLiquidity from '../add-liquidity/AddLiquidity'

function Liquidity({ pool, isModal = false }) {
  const [currentStep, setCurrentStep] = useState(1)
  const t = useTranslations()
  return (
    <div className='w-full'>
      {!isModal && (
        <div className='mb-4 flex items-center gap-2'>
          {currentStep >= 2 && <TextIconButton Icon={ArrowLeftIcon} onClick={() => setCurrentStep(1)} />}
          <h2 className='font-archia text-4xl font-semibold leading-[34px]'>{t('Add Liquidity')}</h2>
        </div>
      )}
      <AddLiquidity
        isModal={isModal}
        pool={pool}
        step={currentStep}
        setCurrentStep={setCurrentStep}
        showSidebar={false}
      />
    </div>
  )
}

export default Liquidity
