import React, { useRef, useState } from 'react'

import AddLiquidityCLPane from './AddLiquidityCLPane'
import { ChooseStrategyCLPane } from './ChooseStrategyCLPane'

function AddLiquidityClPool({ pool, setCurrentStep, isAdd = false, showSidebar = true }) {
  const [isChooseStrategy, setIsChooseStrategy] = useState(true)
  const [isReverse, setIsReverse] = useState(true)
  const targetRef = useRef(null)

  const scrollToComponent = () => {
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className='w-full'>
      <span ref={targetRef} className='inline h-0 w-0' />

      {isChooseStrategy ? (
        <ChooseStrategyCLPane
          pool={pool}
          isAdd={isAdd}
          showSidebar={showSidebar}
          goPreviousStep={() => setCurrentStep(2)}
          goNextStep={() => {
            setIsChooseStrategy(false)
            scrollToComponent()
          }}
          isReverse={isReverse}
          setIsReverse={setIsReverse}
        />
      ) : (
        <AddLiquidityCLPane
          pool={pool}
          isAdd={isAdd}
          isReverse={isReverse}
          showSidebar={showSidebar}
          goPreviousStep={() => setIsChooseStrategy(true)}
        />
      )}
    </div>
  )
}

export default AddLiquidityClPool
