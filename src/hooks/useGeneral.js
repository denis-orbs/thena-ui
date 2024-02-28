import { useEffect, useState } from 'react'
import { ChainId } from 'thena-sdk-core/dist'
import { formatEther } from 'viem'

import { DoubleRewarders } from '@/constant'
import { extraRewarderAbi } from '@/constant/abi'
import { callMulti, readCall } from '@/lib/contractActions'
import { getMinterContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useChainSettings } from '@/state/settings/hooks'

import usePrices from './usePrices'

export const useExtraRewardsInfo = () => {
  const [extraRewardsInfo, setExtraRewardsInfo] = useState([])
  const { account } = useWallet()
  const { networkId } = useChainSettings()

  useEffect(() => {
    const fetchInfo = async rewarders => {
      const stops = await callMulti(
        rewarders.map(pool => ({
          address: pool.doubleRewarderAddress,
          abi: extraRewarderAbi,
          functionName: 'stop',
          chainId: networkId,
        })),
      )
      const activeRewarders = []
      rewarders.forEach((ele, idx) => {
        if (!stops[idx]) {
          activeRewarders.push(ele)
        }
      })
      const rewardRates = await callMulti(
        activeRewarders.map(pool => ({
          address: pool.doubleRewarderAddress,
          abi: extraRewarderAbi,
          functionName: 'rewardPerSecond',
          chainId: networkId,
        })),
      )
      let pendingRewards = []
      if (account) {
        pendingRewards = await callMulti(
          activeRewarders.map(pool => ({
            address: pool.doubleRewarderAddress,
            abi: extraRewarderAbi,
            functionName: 'pendingReward',
            args: [account],
            chainId: networkId,
          })),
        )
      }
      const final = activeRewarders.map((item, index) => ({
        ...item,
        rewardRate: +formatEther(rewardRates[index] ?? 0),
        pendingReward: account ? +formatEther(pendingRewards[index] ?? 0) : 0,
      }))
      setExtraRewardsInfo(final)
    }
    if (DoubleRewarders[networkId].length > 0 && networkId === ChainId.BSC) {
      fetchInfo(DoubleRewarders[networkId])
    }
  }, [account, networkId])

  return extraRewardsInfo
}

export const useVoteEmissions = () => {
  const [voteEmssions, setVoteEmissions] = useState(null)
  const prices = usePrices()
  const { networkId } = useChainSettings()

  useEffect(() => {
    const fetchSupply = async () => {
      const minterContract = getMinterContract()
      const weekly_emission = await readCall(minterContract, 'weekly_emission')
      const lpEmissionRes = fromWei(weekly_emission).times(0.675)
      setVoteEmissions(lpEmissionRes.times(prices.THE).div(100))
    }
    fetchSupply()
  }, [prices, networkId])
  return { voteEmssions }
}

export const useEpochTimer = () => {
  const [epochInfo, setEpochInfo] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    epoch: 0,
  })

  useEffect(() => {
    const epochTimer = () => {
      const curTime = new Date().getTime() / 1000
      const epoch5 = 1675900800
      const epoch = Math.floor((curTime - epoch5) / 604800) + 5
      const nextEpoch = Math.ceil(curTime / (86400 * 7)) * (86400 * 7)
      const days = Math.floor((nextEpoch - curTime) / 86400)
      const hours = Math.floor((nextEpoch - curTime - days * 86400) / 3600)
      const mins = Math.floor((nextEpoch - curTime - days * 86400 - hours * 3600) / 60)
      setEpochInfo({
        days,
        hours: hours < 10 ? `0${hours}` : hours,
        mins: mins < 10 ? `0${mins}` : mins,
        epoch,
      })
    }
    const timer = setInterval(() => epochTimer(), 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return epochInfo
}
