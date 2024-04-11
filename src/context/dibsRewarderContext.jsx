import BigNumber from 'bignumber.js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { readCall } from '@/lib/contractActions'
import { getDibsRewarderContract } from '@/lib/contracts'
import useWallet from '@/lib/wallets/useWallet'

import { useAssets } from './assetsContext'

const DibsRewarderContext = createContext({
  currentDay: 0,
  rewardTokenList: [],
  totalReward: 0,
})

function DibsRewarderContextProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(0)
  const [rewardTokenList, setRewardTokenList] = useState([])
  const [totalReward, setTotalReward] = useState(0)
  const assets = useAssets()

  const { chainId } = useWallet()

  const value = useMemo(
    () => ({
      currentDay,
      rewardTokenList,
      totalReward,
    }),
    [currentDay, rewardTokenList, totalReward],
  )

  useEffect(() => {
    const fetchTotalReward = async () => {
      if (chainId) {
        try {
          const dibsRewarderContract = getDibsRewarderContract(chainId)
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
          for (let i = 0; i < res1.length; i++) {
            const res = await readCall(dibsRewarderContract, 'totalReward', [res1[i], new BigNumber(res0).toNumber()])
            const asset = assets.find(a => a.address.toLowerCase() === res1[i].toLowerCase())
            if (res && asset) total += new BigNumber(res).toNumber() * asset.price
          }
          setTotalReward(total)
        } catch (error) {
          console.log(error)
        }
      }
    }

    fetchTotalReward()
  }, [assets, chainId])

  return <DibsRewarderContext.Provider value={value}>{children}</DibsRewarderContext.Provider>
}

const useDibsRewarder = () => {
  const dibsRewarder = useContext(DibsRewarderContext)
  return dibsRewarder
}

export { DibsRewarderContext, DibsRewarderContextProvider, useDibsRewarder }
