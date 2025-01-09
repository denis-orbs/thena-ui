import React, { useState } from 'react'

import Step1 from './Step1'
import Step2 from './Step2'

function AddLiquidity({ showSidebar, step, setStep, pool }) {
  const [poolSelected, setPoolSelected] = useState(pool)
  const [isAdd, setIsAdd] = useState(false)

  return (
    <>
      {step === 1 && <Step1 nextStep={setStep} setPoolSelected={setPoolSelected} setIsAdd={setIsAdd} />}
      {step === 2 && <Step2 pool={poolSelected} setStep={setStep} isAdd={isAdd} showSidebar={showSidebar} />}
    </>
  )
}

export default AddLiquidity
