import BigNumber from 'bignumber.js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getDibsRewarderContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import { fetchDataTotalClaimedRewards } from '@/modules/TradeToEarn'
import { useChainSettings } from '@/state/settings/hooks'

import { useAssets } from './assetsContext'

const DibsRewarderContext = createContext({
  currentDay: 0,
  rewardTokenList: [],
  totalUserEarned: 0,
})

function DibsRewarderContextProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(0)
  const [totalUserEarned, setTotalUserEarned] = useState(0)
  const [rewardTokenList, setRewardTokenList] = useState([])
  const assets = useAssets()
  const { account } = useWallet()
  const { networkId } = useChainSettings()

  const value = useMemo(
    () => ({
      currentDay,
      rewardTokenList,
      totalUserEarned,
    }),
    [currentDay, rewardTokenList, totalUserEarned],
  )

  useEffect(() => {
    const fetchTotalReward = async () => {
      if (networkId) {
        try {
          const dibsRewarderContract = getDibsRewarderContract(networkId)
          if (!dibsRewarderContract) {
            return
          }
          const [res0, res1] = await Promise.all([
            readCall(dibsRewarderContract, 'currentDay', []),
            readCall(dibsRewarderContract, 'rewardTokenList', []),
          ])
          if (res0 === undefined || res1 === undefined || !res1.length) {
            return
          }
          setCurrentDay(new BigNumber(res0).toNumber())
          if (!rewardTokenList.length) {
            setRewardTokenList(res1)
          }

          if (account) {
            let totalEarned = 0
            const totalClaimedRewards = await fetchDataTotalClaimedRewards(account)
            if (Array.isArray(totalClaimedRewards) && totalClaimedRewards.length) {
              totalClaimedRewards.forEach(tcr => {
                const asset = assets.find(a => a.address.toLowerCase() === tcr.token.toLowerCase())
                if (asset) {
                  const userEarned = fromWei(new BigNumber(tcr.amount)).toNumber() * asset.price
                  totalEarned += userEarned
                }
              })
            }

            setTotalUserEarned(totalEarned)
          }
        } catch (error) {
          console.log(error)
        }
      }
    }

    fetchTotalReward()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, account, networkId])

  return <DibsRewarderContext.Provider value={value}>{children}</DibsRewarderContext.Provider>
}

const useDibsRewarder = () => {
  const dibsRewarder = useContext(DibsRewarderContext)
  return dibsRewarder
}

export { DibsRewarderContext, DibsRewarderContextProvider, useDibsRewarder }
