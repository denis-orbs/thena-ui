import BigNumber from 'bignumber.js'
import { cloneDeep } from 'lodash'
import { useMemo } from 'react'

import { useAssets } from '@/context/assetsContext'
import { useTC } from '@/context/tcContext'

export const useCompetitionFormat = (competition, isPreview = false) => {
  const _assets = useAssets()
  const { pairLists } = useTC()

  const dataListPairs = useMemo(() => {
    if (pairLists?.[1] && Array.isArray(pairLists[1])) {
      const result = pairLists[1].map((item, index) => ({
        id: new BigNumber(pairLists[0][index]).toNumber(),
        symbol: item,
      }))
      return result
    }
    return []
  }, [pairLists])

  const assets = useMemo(() => {
    const clone = cloneDeep(_assets)
    clone.push({
      name: 'MockUSD',
      symbol: 'MUSD',
      decimals: 18,
      address: '0xced4ac14bb1077b995b954c48a87b25ebb4828e5',
    })

    return clone
  }, [_assets])

  return useMemo(() => {
    if (!competition) {
      return undefined
    }

    const clone = cloneDeep(competition)

    if (!clone.competitionRules.pairIds) {
      clone.competitionRules.pairIds = []
    } else {
      clone.competitionRules.pairIds = clone.competitionRules.pairIds.map(item => {
        const pair = dataListPairs.find(p => Number(p.id) === Number(item))
        return pair
      })
    }

    if (isPreview) {
      if (clone?.winType && clone?.prizeUpdate) {
        clone.prizeUpdate.winType = clone.winType
      }

      return clone
    }

    if (clone.prize) {
      clone.prize.token = assets.find(ele => ele.address.toLowerCase() === competition?.prize?.token.toLowerCase())
    }

    if (clone.prizeUpdate) {
      clone.prizeUpdate.token = clone.prizeUpdate.token.map(token => {
        const asset = assets.find(ele => ele.address.toLowerCase() === token.toLowerCase())
        return asset
      })
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
  }, [assets, competition, dataListPairs, isPreview])
}
