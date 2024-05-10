import BigNumber from 'bignumber.js'
import { useCallback } from 'react'

import { useAssets } from '@/context/assetsContext'
import { useDibsRewarder } from '@/context/dibsRewarderContext'
import { readCall } from '@/lib/contractActions'

export const useTotalRewardADay = () => {
  const { rewardTokenList, dibsRewarder } = useDibsRewarder()
  const assets = useAssets()

  const fetchTotalRewardADay = useCallback(
    async currentDay => {
      const totalRewardADay = []
      if (Number(currentDay) && rewardTokenList && rewardTokenList.length && dibsRewarder) {
        for (let i = 0; i < rewardTokenList.length; i++) {
          const res = await readCall(dibsRewarder, 'totalReward', [rewardTokenList[i], Number(currentDay)])
          const asset = assets.find(a => a.address.toLowerCase() === rewardTokenList[i].toLowerCase())

          if (res !== undefined && asset) {
            totalRewardADay.push({
              totalReward: new BigNumber(res).toNumber(),
              symbol: asset.symbol,
              address: asset.address,
            })
          }
        }
      }

      return totalRewardADay
    },
    [dibsRewarder, rewardTokenList, assets],
  )

  return { fetchTotalRewardADay }
}
