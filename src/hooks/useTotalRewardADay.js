import BigNumber from 'bignumber.js'
import { useCallback } from 'react'

import { useAssets } from '@/context/assetsContext'
import { useDibsRewarder } from '@/context/dibsRewarderContext'
import { readCall } from '@/lib/contractActions'
import { getDibsRewarderContract } from '@/lib/contracts'
import { useChainSettings } from '@/state/settings/hooks'

export const useTotalRewardADay = () => {
  const assets = useAssets()
  const { networkId } = useChainSettings()
  const { rewardTokenList } = useDibsRewarder()

  const fetchTotalRewardADay = useCallback(
    async day => {
      const totalRewardADay = []
      const dibsRewarderContract = getDibsRewarderContract(networkId)

      if (Number(day) && rewardTokenList && rewardTokenList.length && dibsRewarderContract) {
        for (let i = 0; i < rewardTokenList.length; i++) {
          const res = await readCall(dibsRewarderContract, 'totalReward', [rewardTokenList[i], Number(day)])
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
    [assets, networkId, rewardTokenList],
  )

  return { fetchTotalRewardADay }
}
