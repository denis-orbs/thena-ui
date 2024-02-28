import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useChainSettings } from '../settings/hooks'

export const useAssets = () => {
  const { data } = useSelector(state => state.assets)
  const { networkId } = useChainSettings()

  return useMemo(
    () =>
      data[networkId].map(ele => ({
        ...ele,
        balance: new BigNumber(ele.balance),
      })),
    [data, networkId],
  )
}
