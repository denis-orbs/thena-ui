/* eslint-disable max-len */
import { gql, GraphQLClient } from 'graphql-request'

// const END_POINT = 'https://api.studio.thegraph.com/proxy/70764/thena-subgraph-3/version/latest'
const END_POINT = 'https://api.studio.thegraph.com/query/70764/thena-subgraph/version/latest'
// const END_POINT = 'https://api.studio.thegraph.com/query/70764/thena-subgraph/0.0.3'

export const v4Client = new GraphQLClient(END_POINT)

const V4_DAILY_VOLUME = gql`
  query V4_DAILY_VOLUME($user: String!, $day: String!, $pair: String!) {
    dailyGeneratedVolumes(where: { user: $user, day: $day, pair: $pair, amountAsReferrer_gt: 0 }) {
      id
      user
      amountAsUser
      day
    }
  }
`

export const fetchDailyVolume = async (user, day, pair) => {
  try {
    const { dailyGeneratedVolumes } = await v4Client.request(V4_DAILY_VOLUME, {
      user,
      day,
      pair,
    })
    return dailyGeneratedVolumes
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataDailyVolume = async (user, day, pair) => {
  try {
    const data = await fetchDailyVolume(user, day, pair)
    return data
  } catch (error) {
    return { error: true }
  }
}

const V4_TOTAL_VOLUME = gql`
  query V4_TOTAL_VOLUME($user: String!, $pair: String!) {
    dailyGeneratedVolumes(where: { user: $user, pair: $pair, amountAsReferrer_gt: 0 }) {
      id
      user
      amountAsUser
      day
    }
  }
`

export const fetchTotalVolume = async (user, pair) => {
  try {
    const { dailyGeneratedVolumes } = await v4Client.request(V4_TOTAL_VOLUME, {
      user,
      pair,
    })
    return dailyGeneratedVolumes
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataTotalVolume = async (user, pair) => {
  try {
    const data = await fetchTotalVolume(user, pair)
    return data
  } catch (error) {
    return { error: true }
  }
}

const V4_EARNINGS = gql`
  query V4_EARNINGS($user: String!) {
    dailyGeneratedVolumes(where: { user: $user }) {
      id
      user
      amountAsUser
      day
      lastUpdate
    }
  }
`

export const fetchEarnings = async user => {
  try {
    const { dailyGeneratedVolumes } = await v4Client.request(V4_EARNINGS, {
      user,
    })
    return dailyGeneratedVolumes
  } catch (error) {
    return { error: true }
  }
}

export const fetchDataEarnings = async user => {
  try {
    const data = await fetchEarnings(user)
    return data
  } catch (error) {
    return { error: true }
  }
}

export const fetchMuon = async (account, day) => {
  const pair = '0x0000000000000000000000000000000000000000'
  const user = account
  const projectId = '0x1fdee74ea6c68fdce3c090e59eeb93943eeaadc99a89c65ac12024c85be84d41'

  try {
    const muonURL = `https://dibs-shield.muon.net/v1/?app=dibsGlobal&method=userVolume&params[projectId]=${projectId}&params[day]=${day}&params[pair]=${pair}&params[user]=${user}`

    const response = await fetch(muonURL)
    const res = await response.json()

    return res
  } catch (error) {
    console.log(error)
    return false
  }
}
