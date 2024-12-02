import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import TokenInput from '@/components/input/TokenInput'

function ZapperInput({ asset1, asset2 }) {
  const t = useTranslations()

  const [amount1, setAmount1] = useState(100)
  const [amount2, setAmount2] = useState(100)

  return (
    <div className='flex flex-col gap-2'>
      <TokenInput title={`${t('Asset')} 1`} asset={asset1} amount={amount1} setAmount={setAmount1} disabledSelect />
      <TokenInput title={`${t('Asset')} 2`} asset={asset2} amount={amount2} setAmount={setAmount2} disabledSelect />
    </div>
  )
}

export default ZapperInput
