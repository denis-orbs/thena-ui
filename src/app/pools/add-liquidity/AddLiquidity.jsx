import React, { useState } from 'react'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

function AddLiquidity({ showSidebar, step, setStep, pool }) {
  const [poolSelected, setPoolSelected] = useState(pool)
  const [isAdd, setIsAdd] = useState(false)

  return (
    <>
      {step === 1 && <Step1 nextStep={setStep} setPoolSelected={setPoolSelected} setIsAdd={setIsAdd} />}
      {step === 2 && <Step2 setStep={setStep} />}
      {step === 3 && <Step3 pool={poolSelected} setStep={setStep} isAdd={isAdd} showSidebar={showSidebar} />}
    </>
  )
}

export default AddLiquidity
