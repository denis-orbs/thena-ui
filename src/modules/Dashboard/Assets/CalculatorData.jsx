import React from 'react'

import ManualCalculator from './ManualCalculator'
import PositionCalculator from './PositionCalculator'
import WeightedCalculator from './WeightedCalculator'

function CalculatorData({ positions = [], onData = () => {} }) {
  return (
    <div className='hidden'>
      {positions
        .filter(item => item.version !== 2 && item.version !== 1)
        .map((item, index) => (
          <React.Fragment key={`${item.address}-${index}`}>
            {item.type === 'Manual' ? (
              <ManualCalculator index={index} position={item} onData={onData} />
            ) : item.tokens && Array.isArray(item.tokens) ? (
              <>
                {item.notStaked && <WeightedCalculator position={item} isStake={false} onData={onData} index={index} />}
                {item.staked && <WeightedCalculator position={item} isStake onData={onData} index={index} />}
              </>
            ) : (
              <>
                {item.account.gaugeBalance.gt(0) && (
                  <PositionCalculator isStaked position={item} onData={onData} index={index} />
                )}
                {item.account.walletBalance.gt(0) && (
                  <PositionCalculator isStaked={false} position={item} onData={onData} index={index} />
                )}
              </>
            )}
          </React.Fragment>
        ))}
    </div>
  )
}

export default CalculatorData
