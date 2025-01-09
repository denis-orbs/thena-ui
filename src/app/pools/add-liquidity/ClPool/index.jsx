import React, { useState } from 'react'

import AddLiquidityCLPane from './AddLiquidityCLPane'
import { ChooseStrategyCLPane } from './ChooseStrategyCLPane'

function AddLiquidityClPool({ pool, setCurrentStep, isAdd = false, showSidebar = true }) {
  const [isChooseStrategy, setIsChooseStrategy] = useState(true)

  return (
    <>
      {isChooseStrategy ? (
        <ChooseStrategyCLPane
          pool={pool}
          isAdd={isAdd}
          showSidebar={showSidebar}
          goPreviousStep={() => setCurrentStep(1)}
          goNextStep={() => setIsChooseStrategy(false)}
        />
      ) : (
        <AddLiquidityCLPane
          pool={pool}
          isAdd={isAdd}
          showSidebar={showSidebar}
          goPreviousStep={() => setIsChooseStrategy(true)}
        />
      )}
    </>
  )
}

export default AddLiquidityClPool
