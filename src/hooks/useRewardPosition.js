import { useCallback } from 'react'
import { zeroAddress } from 'viem'

import { GAMMA_TYPES, ICHI_TYPES } from '@/constant'

import { useAlgebraClaim } from './fusion/useAlgebra'
import { useGammaClaim } from './fusion/useGamma'
import { useIchiClaim } from './fusion/useIchi'
import { useGaugeHarvest } from './useGauge'
import { useClaimFees } from './useV1Liquidity'
import { useClaimWeightedPoolFees, useGaugeHarvestWeighted } from './weightedPool/useWeigtedPool'

export const useRewardPosition = () => {
  // for farming and manual
  const { onAlgebraClaim } = useAlgebraClaim()

  // for weighted
  const { onClaimFees: onClaimFeesWeighted } = useClaimWeightedPoolFees()
  const { onGaugeHarvest: onGaugeHarvestWeighted } = useGaugeHarvestWeighted()

  // for other staked
  const { onGammaClaim } = useGammaClaim()
  const { onIchiClaim } = useIchiClaim()
  const { onGaugeHarvest } = useGaugeHarvest()
  // for other unStaked
  const { onClaimFees } = useClaimFees()

  const onClaimAllRewardPosition = useCallback(
    async positions => {
      console.log({ positions })
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i]
        if (pos.type === 'Manual') {
          await onAlgebraClaim({
            tokenId: pos.tokenId,
            feeValue0: pos.rewards[0].amount,
            feeValue1: pos.rewards[1].amount,
            isFarming: pos.deployer === zeroAddress,
            poolkey: pos.key,
          })
        } else if (pos.tokens && Array.isArray(pos.tokens) && pos.type !== 'Manual') {
          if (pos.staked) {
            await onGaugeHarvestWeighted(pos)
          } else {
            await onClaimFeesWeighted(pos)
          }
        } else if (pos.staked && pos.type !== 'Manual' && !pos.tokens && !Array.isArray(pos.tokens)) {
          if (GAMMA_TYPES.includes(pos.title)) {
            await onGammaClaim(pos)
          } else if (ICHI_TYPES.includes(pos.title)) {
            await onIchiClaim(pos)
          } else {
            await onGaugeHarvest(pos)
          }
        } else {
          await onClaimFees(pos)
        }
      }
    },
    [
      onAlgebraClaim,
      onClaimFees,
      onClaimFeesWeighted,
      onGammaClaim,
      onGaugeHarvest,
      onGaugeHarvestWeighted,
      onIchiClaim,
    ],
  )

  return { onClaimAllRewardPosition }
}
