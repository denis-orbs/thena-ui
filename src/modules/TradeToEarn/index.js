/* eslint-disable max-len */
import { useMutation } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import { getDibsRewarderContract } from '@/lib/contracts'
import { v4Client, v4ClientSubGraphT2E } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

const V4_DAILY_VOLUME = gql`
  query V4_DAILY_VOLUME($user: String!, $day: Int!) {
    userTradeToEarns(where: { user_eq: $user, day_eq: $day }) {
      amountAsUser
      amountPercent
      date
      day
      lastUpdate
      pair
    }
  }
`

export const fetchDailyVolume = async (user, day) => {
  try {
    const { userTradeToEarns } = await v4Client.request(V4_DAILY_VOLUME, {
      user,
      day,
    })
    return userTradeToEarns
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataDailyVolume = async (user, day) => {
  try {
    const data = await fetchDailyVolume(user, day)
    return data
  } catch (error) {
    return { error: true }
  }
}

const V4_TOTAL_VOLUME = gql`
  query V4_TOTAL_VOLUME($user: String!) {
    userTotalAmountVolumeAlpha(user: $user, day_gt: 17) {
      totalAmount
      user
    }
  }
`

export const fetchTotalVolume = async user => {
  try {
    const { userTotalAmountVolumeAlpha } = await v4Client.request(V4_TOTAL_VOLUME, {
      user,
    })
    return userTotalAmountVolumeAlpha
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataTotalVolume = async user => {
  try {
    const data = await fetchTotalVolume(user)
    return data
  } catch (error) {
    return { error: true }
  }
}

const V4_EARNINGS = gql`
  query V4_EARNINGS($user: String!, $offset: Int = 0) {
    userTradeToEarns(where: { user_eq: $user, day_gt: 17 }, offset: $offset, limit: 10, orderBy: day_DESC) {
      amountAsUser
      amountPercent
      date
      day
      lastUpdate
      pair
    }
  }
`

export const fetchEarnings = async (user, page) => {
  const offset = (page - 1) * 10

  try {
    const { userTradeToEarns } = await v4Client.request(V4_EARNINGS, {
      user,
      offset,
    })

    return userTradeToEarns
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataEarnings = async (user, page = 0) => {
  try {
    const data = await fetchEarnings(user, page)
    return data
  } catch (error) {
    return { error: true }
  }
}

const V4_TRADE_TO_EARN_COUNT = gql`
  query V4_TRADE_TO_EARN_COUNT($user: String!, $day: Int!) {
    userTradeToEarnTotalCount(user: $user, day_gt: $day)
  }
`

export const fetchTradeToEarnCount = async (user, day) => {
  try {
    const { userTradeToEarnTotalCount } = await v4Client.request(V4_TRADE_TO_EARN_COUNT, {
      day,
      user,
    })

    return userTradeToEarnTotalCount
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataTradeToEarnCount = async (user, day = 17) => {
  try {
    const data = await fetchTradeToEarnCount(user, day)
    return data
  } catch (error) {
    return { error: true }
  }
}

export const fetchMuon = async (account, day) => {
  const pair = '0x0000000000000000000000000000000000000000'
  const user = account
  const projectId = '0x1fdee74ea6c68fdce3c090e59eeb93943eeaadc99a89c65ac12024c85be84d41'

  const muonURL = `https://api-muon.thena.fi/v1/?app=thenaTrade2Earn&method=userVolume&params[projectId]=${projectId}&params[day]=${day}&params[pair]=${pair}&params[user]=${user}`

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 15000)

  const response = await fetch(muonURL, {
    signal: controller.signal,
  })
  clearTimeout(id)

  const res = await response.json()
  if (res.success) {
    return res
  }
  throw new Error('Not Found')
}

export const useGetMuonMutation = () => {
  const { account } = useWallet()
  return useMutation({
    mutationFn: async day => {
      const toastRes = await toast.promise(
        async () => await fetchMuon(account, day),
        {
          error: 'Request Muon data failed',
          success: 'Muon responded',
          pending: 'Request data from Muon...',
        },
        {
          className: '!bg-white text-black',
          autoClose: 3000,
        },
      )

      if (toastRes && toastRes.success) {
        return toastRes.result
      }
      return null
    },
  })
}

export const useClaimRewardMutation = () => {
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()
  const { chainId } = useWallet()

  return useMutation({
    mutationFn: async body => {
      const key = uuidv4()
      const claimuuid = uuidv4()

      const dibsRewarderContract = getDibsRewarderContract(chainId)

      startTxn({
        key,
        title: t('Claim Earnings'),
        transactions: {
          [claimuuid]: {
            desc: t('Claim Earnings'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      const isSuccess = await writeTxn(key, claimuuid, dibsRewarderContract, 'claim', body)
      if (!isSuccess) {
        return false
      }

      endTxn({
        key,
        final: 'Claimed',
      })

      return isSuccess
    },
  })
}

const V4_TOTAL_CLAIMED_REWARDS = gql`
  query V4_TOTAL_CLAIMED_REWARDS($user: String!) {
    totalClaimedRewards(where: { user: $user }) {
      id
      user
      amount
      token
      lastUpdate
    }
  }
`

export const fetchTotalClaimedRewards = async user => {
  try {
    const { totalClaimedRewards } = await v4ClientSubGraphT2E.request(V4_TOTAL_CLAIMED_REWARDS, {
      user,
    })
    return totalClaimedRewards
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataTotalClaimedRewards = async user => {
  try {
    const data = await fetchTotalClaimedRewards(user)
    return data
  } catch (error) {
    return { error: true }
  }
}
