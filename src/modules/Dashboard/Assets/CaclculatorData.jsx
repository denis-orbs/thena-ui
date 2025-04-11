import React from 'react'

import ManualCaclculator from './ManualCaclculator'
import PositionCaclculator from './PositionCaclculator'
import WeightedCaclculator from './WeightedCaclculator'

function CaclculatorData({ positions = [], onData = () => {} }) {
  return (
    <div className='hidden'>
      {positions
        .filter(item => item.version !== 2 && item.version !== 1)
        .map((item, index) => (
          <React.Fragment key={`${item.address}-${index}`}>
            {item.type === 'Manual' ? (
              <ManualCaclculator index={index} position={item} onData={onData} />
            ) : item.tokens && Array.isArray(item.tokens) ? (
              <>
                {item.notStaked && (
                  <WeightedCaclculator position={item} isStake={false} onData={onData} index={index} />
                )}
                {item.staked && <WeightedCaclculator position={item} isStake onData={onData} index={index} />}
              </>
            ) : (
              <>
                {item.account.gaugeBalance.gt(0) && (
                  <PositionCaclculator isStaked position={item} onData={onData} index={index} />
                )}
                {item.account.walletBalance.gt(0) && (
                  <PositionCaclculator isStaked={false} position={item} onData={onData} index={index} />
                )}
              </>
            )}
          </React.Fragment>
        ))}
    </div>
  )
}

export default CaclculatorData
