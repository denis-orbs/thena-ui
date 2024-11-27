import React, { useState } from 'react'

import Loading from '@/app/loading'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

function AddLiquidity({ showSidebar, step, setCurrentStep, pool }) {
  const [poolSelected, setPoolSelected] = useState(pool)
  const [isAutomatic, setIsAutomatic] = useState(true)
  const [isAdd, setIsAdd] = useState(false)
  const [strategy, setStrategy] = useState()

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
              isAutomatic={isAutomatic}
              setIsAutomatic={setIsAutomatic}
              isAdd={isAdd}
              setStrategy={setStrategy}
              strategy={strategy}
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
            <Step3
              isAdd={isAdd}
              isAutomatic={isAutomatic}
              pool={poolSelected}
              setCurrentStep={setCurrentStep}
              setStrategy={setStrategy}
              strategy={strategy}
              showSidebar={showSidebar}
            />
          ) : (
            <Loading />
          )}
        </>
      )}
    </>
  )
}

export default AddLiquidity
