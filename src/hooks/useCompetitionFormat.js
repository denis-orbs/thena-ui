import { cloneDeep } from 'lodash'
import { useMemo } from 'react'

import { useAssets } from '@/context/assetsContext'

export const useCompetitionFormat = (competition, isPreview = false) => {
  const assets = useAssets()

  return useMemo(() => {
    if (isPreview) {
      return competition
    }
    if (competition) {
      const clone = cloneDeep(competition)

      if (clone.prize) {
        clone.prize.token = assets.find(ele => ele.address.toLowerCase() === competition?.prize?.token.toLowerCase())
      }

      if (clone.participants) {
        clone.participantCount = clone.participants.length
      }

      if (clone.competitionRules) {
        clone.competitionRules.tradingTokens = assets.filter(ele =>
          competition?.competitionRules.tradingTokens?.map(sub => sub.toLowerCase()).includes(ele.address),
        )

        clone.competitionRules.winningToken = assets.find(
          ele => ele.address.toLowerCase() === competition?.competitionRules.winningToken?.toLowerCase(),
        )
      }
      return clone
    }
    return undefined
  }, [assets, competition, isPreview])
}
