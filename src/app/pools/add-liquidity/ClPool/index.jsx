import React from 'react'
import { useSelector } from 'react-redux'

import { ChooseStrategyCLPane } from './ChooseStrategyCLPane'

function AddLiquidityClPool({ pool, setCurrentStep, isAdd = false, showSidebar = true }) {
  const { isReverse } = useSelector(state => state.fusion)

  return (
    <div className='w-full'>
      <ChooseStrategyCLPane
        pool={pool}
        isAdd={isAdd}
        showSidebar={showSidebar}
        goPreviousStep={() => setCurrentStep(1)}
        isReverse={isReverse}
      />
    </div>
  )
}

export default AddLiquidityClPool
