import { useCallback } from 'react'
import { zeroAddress } from 'viem'

import { GAMMA_TYPES, ICHI_TYPES } from '@/constant'

import { useAlgebraClaim } from './fusion/useAlgebra'
import { useGammaClaim } from './fusion/useGamma'
import { useIchiClaim } from './fusion/useIchi'
import { useGaugeHarvest } from './useGauge'
import { useClaimFees } from './useV1Liquidity'
import { useClaimWeightedPoolFees } from './weightedPool/useWeigtedPool'

export const useRewardPosition = () => {
  // for farming and manual
  const { onAlgebraClaim } = useAlgebraClaim()

  // for weighted
  const { onClaimFees: onClaimFeesWeighted } = useClaimWeightedPoolFees()

  // for other staked
  const { onGammaClaim } = useGammaClaim()
  const { onIchiClaim } = useIchiClaim()
  const { onGaugeHarvest } = useGaugeHarvest()
  // for other unStaked
  const { onClaimFees } = useClaimFees()

  const onClaimAllRewardPosition = useCallback(
    positions => {
      const manualPostions = positions.filter(pos => pos.position.type === 'Manual')
      const weightedPositions = positions.filter(pos => pos.position.tokens && Array.isArray(pos.position.tokens))
      const otherPositions = positions.filter(
        pos => pos.position.type !== 'Manual' && !Array.isArray(pos.position.tokens),
      )
      if (manualPostions && manualPostions.length > 0) {
        manualPostions.forEach(pos => {
          onAlgebraClaim({
            tokenId: pos.position.tokenId,
            feeValue0: pos.rewards[0].amount,
            feeValue1: pos.rewards[1].amount,
            isFarming: pos.deployer === zeroAddress,
            poolkey: pos.position.key,
          })
        })
      }

      if (weightedPositions && weightedPositions.length > 0) {
        console.log('check1')
        weightedPositions.forEach(pos => {
          onClaimFeesWeighted(pos.position)
        })
      }

      if (otherPositions && otherPositions.length > 0) {
        otherPositions.forEach(pos => {
          if (pos.position.isStaked) {
            if (GAMMA_TYPES.includes(pos.position.title)) {
              onGammaClaim(pos.position)
            } else if (ICHI_TYPES.includes(pos.position.title)) {
              onIchiClaim(pos.position)
            } else {
              onGaugeHarvest(pos.position)
            }
          } else {
            onClaimFees(pos.position)
          }
        })
      }
    },
    [onAlgebraClaim, onClaimFees, onClaimFeesWeighted, onGammaClaim, onGaugeHarvest, onIchiClaim],
  )

  return { onClaimAllRewardPosition }
}
