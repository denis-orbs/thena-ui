import BigNumber from 'bignumber.js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { readCall } from '@/lib/contractActions'
import { getDibsRewarderContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { fetchDataTotalClaimedRewards } from '@/modules/TradeToEarn'
import { useChainSettings } from '@/state/settings/hooks'

import { useAssets } from './assetsContext'

const DibsRewarderContext = createContext({
  currentDay: 0,
  rewardTokenList: [],
  totalDailyRewardUsd: 0,
  totalRewardCurrDay: [],
  totalUserEarned: 0,
  dibsRewarder: null,
})

function DibsRewarderContextProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(0)
  const [rewardTokenList, setRewardTokenList] = useState([])
  const [totalDailyRewardUsd, setTotalDailyRewardUsd] = useState(0)
  const [totalRewardCurrDay, setTotalRewardCurrDay] = useState([])
  const [totalUserEarned, setTotalUserEarned] = useState(0)
  const [dibsRewarder, setDibsRewarder] = useState('')
  const assets = useAssets()
  const { account } = useWallet()
  const { networkId } = useChainSettings()

  const value = useMemo(
    () => ({
      currentDay,
      rewardTokenList,
      totalDailyRewardUsd,
      totalRewardCurrDay,
      totalUserEarned,
      dibsRewarder,
    }),
    [currentDay, rewardTokenList, totalDailyRewardUsd, totalRewardCurrDay, totalUserEarned, dibsRewarder],
  )

  useEffect(() => {
    const fetchTotalReward = async () => {
      if (networkId) {
        try {
          const dibsRewarderContract = getDibsRewarderContract(networkId)
          if (!dibsRewarderContract) {
            return
          }
          setDibsRewarder(dibsRewarderContract)
          const [res0, res1] = await Promise.all([
            readCall(dibsRewarderContract, 'currentDay', []),
            readCall(dibsRewarderContract, 'rewardTokenList', []),
          ])
          if (res0 === undefined || res1 === undefined || !res1.length) {
            return
          }
          setCurrentDay(new BigNumber(res0).toNumber())
          setRewardTokenList(res1)
          let total = 0

          const arrayTotalRewardCurrDay = []
          for (let i = 0; i < res1.length; i++) {
            const res2 = await readCall(dibsRewarderContract, 'totalReward', [res1[i], new BigNumber(res0).toNumber()])
            const asset = assets.find(a => a.address.toLowerCase() === res1[i].toLowerCase())
            if (res2 && asset) {
              total += new BigNumber(res2).toNumber() * asset.price
              arrayTotalRewardCurrDay.push({
                totalReward: fromWei(res2).toNumber(),
                symbol: asset.symbol,
              })
            }
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

          setTotalDailyRewardUsd(total)
          setTotalRewardCurrDay(arrayTotalRewardCurrDay)
        } catch (error) {
          console.log(error)
        }
      }
    }

    fetchTotalReward()
  }, [assets, account, networkId])

  return <DibsRewarderContext.Provider value={value}>{children}</DibsRewarderContext.Provider>
}

const useDibsRewarder = () => {
  const dibsRewarder = useContext(DibsRewarderContext)
  return dibsRewarder
}

export { DibsRewarderContext, DibsRewarderContextProvider, useDibsRewarder }
