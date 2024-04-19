import BigNumber from 'bignumber.js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { readCall } from '@/lib/contractActions'
import { getDibsRewarderContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { fetchDataTotalClaimedRewards } from '@/modules/TradeToEarn'

import { useAssets } from './assetsContext'

const DibsRewarderContext = createContext({
  currentDay: 0,
  rewardTokenList: [],
  totalReward: 0,
  totalRewardCurrDay: [],
  totalUserEarned: 0,
  dibsRewarder: null,
})

function DibsRewarderContextProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(0)
  const [rewardTokenList, setRewardTokenList] = useState([])
  const [totalReward, setTotalReward] = useState(0)
  const [totalRewardCurrDay, setTotalRewardCurrDay] = useState([])
  const [totalUserEarned, setTotalUserEarned] = useState(0)
  const [dibsRewarder, setDibsRewarder] = useState('')
  const assets = useAssets()
  const { account } = useWallet()

  const { chainId } = useWallet()

  const value = useMemo(
    () => ({
      currentDay,
      rewardTokenList,
      totalReward,
      totalRewardCurrDay,
      totalUserEarned,
      dibsRewarder,
    }),
    [currentDay, rewardTokenList, totalReward, totalRewardCurrDay, totalUserEarned, dibsRewarder],
  )

  useEffect(() => {
    const fetchTotalReward = async () => {
      if (chainId) {
        try {
          const dibsRewarderContract = getDibsRewarderContract(chainId)
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

          let totalEarned = 0
          const totalClaimedRewards = await fetchDataTotalClaimedRewards(account)
          totalClaimedRewards.forEach(tcr => {
            const asset = assets.find(a => a.address.toLowerCase() === tcr.token.toLowerCase())
            const userEarned = fromWei(new BigNumber(tcr.amount)).toNumber() * asset.price
            totalEarned += userEarned
          })

          setTotalReward(total)
          setTotalUserEarned(totalEarned)
          setTotalRewardCurrDay(arrayTotalRewardCurrDay)
        } catch (error) {
          console.log(error)
        }
      }
    }

    fetchTotalReward()
  }, [assets, chainId, account])

  return <DibsRewarderContext.Provider value={value}>{children}</DibsRewarderContext.Provider>
}

const useDibsRewarder = () => {
  const dibsRewarder = useContext(DibsRewarderContext)
  return dibsRewarder
}

export { DibsRewarderContext, DibsRewarderContextProvider, useDibsRewarder }
