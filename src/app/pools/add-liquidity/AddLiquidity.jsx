import React, { useState } from 'react'

import Loading from '@/app/loading'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

function AddLiquidity({ showSidebar, step, setCurrentStep, pool }) {
  const [poolSelected, setPoolSelected] = useState(pool)
  const [isAdd, setIsAdd] = useState(false)

  return (
    <>
      {step === 0 && (
        <Step1
          nextStep={setCurrentStep}
          setPoolSelected={setPoolSelected}
          poolSelected={poolSelected}
          setIsAdd={setIsAdd}
        />
      )}

      {step === 1 && (
        <>
          {poolSelected ? (
            <Step2
              pool={poolSelected}
              setCurrentStep={setCurrentStep}
              currentStep={step}
              isAdd={isAdd}
              showSidebar={showSidebar}
            />
          ) : (
            <Loading />
          )}
        </>
      )}

      {step === 2 && (
        <>
          {poolSelected ? (
            <Step3 isAdd={isAdd} pool={poolSelected} setCurrentStep={setCurrentStep} showSidebar={showSidebar} />
          ) : (
            <Loading />
          )}
        </>
      )}
    </>
  )
}

export default AddLiquidity
