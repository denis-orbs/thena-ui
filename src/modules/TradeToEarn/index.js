/* eslint-disable max-len */
import { gql, GraphQLClient } from 'graphql-request'

const END_POINT = 'https://api.studio.thegraph.com/proxy/70764/thena-subgraph-3/version/latest'

export const v4Client = new GraphQLClient(END_POINT)

const V4_DAILY_VOLUME = gql`
  query V4_DAILY_VOLUME($user: String!, $day: String!, $pair: String!) {
    dailyGeneratedVolumes(user: $user, day: $day, pair: $pair, amountAsReferrer_gt: 0) {
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
    dailyGeneratedVolumes(user: $user, pair: $pair, amountAsReferrer_gt: 0) {
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
