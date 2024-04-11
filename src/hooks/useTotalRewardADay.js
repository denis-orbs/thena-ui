import BigNumber from 'bignumber.js'
import { useCallback } from 'react'

import { useDibsRewarder } from '@/context/dibsRewarderContext'
import { readCall } from '@/lib/contractActions'

export const useTotalRewardADay = () => {
  const { rewardTokenList, dibsRewarder } = useDibsRewarder()

  const fetchTotalRewardADay = useCallback(
    async currentDay => {
      let totalRewardADay = 0
      if (Number(currentDay) && rewardTokenList[0]) {
        const res = await readCall(dibsRewarder, 'totalReward', [rewardTokenList[0], Number(currentDay)])
        if (res) {
          totalRewardADay = new BigNumber(res).toNumber()
        }
      }
      return totalRewardADay
    },
    [dibsRewarder, rewardTokenList],
  )

  return { fetchTotalRewardADay }
}
