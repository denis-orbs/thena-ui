'use client'

import { getBalance } from '@wagmi/core'
import BigNumber from 'bignumber.js'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import useSWRImmutable from 'swr/immutable'
import { formatEther, formatUnits } from 'viem'

import { ERC20Abi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { wagmiConfig } from '@/context/Web3Modal'
import { fetchAssets } from '@/lib/api'
import { callMulti } from '@/lib/contractActions'
import useWallet from '@/lib/wallets/useWallet'

import { updateAssets } from './actions'
import { useChainSettings } from '../settings/hooks'

const fetchAssetsBalances = async (assets, account, networkId) => {
  console.log('----------------- user assets ------------------')
  const res = await callMulti(
    assets.map(asset => ({
      address: asset.address,
      abi: ERC20Abi,
      functionName: 'balanceOf',
      args: [account],
      chainId: networkId,
    })),
  )
  return res.map((ele, index) => formatUnits(ele ?? 0, assets[index].decimals || 18))
}

const fetchUserAssetsData = async (assets, account, networkId) => {
  const nonBnbAssets = assets.slice(1)
  const { value: bnbBalance } = await getBalance(wagmiConfig, {
    address: account,
  })
  const userBalances = await fetchAssetsBalances(nonBnbAssets, account, networkId)

  const bnbAssetInfo = {
    ...assets[0],
    balance: formatEther(bnbBalance),
  }

  const nonBnbAssetsInfo = nonBnbAssets.map((asset, index) => ({
    ...asset,
    balance: userBalances[index],
  }))
  return [bnbAssetInfo, ...nonBnbAssetsInfo]
}

function Updater() {
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const dispatch = useDispatch()
  const { data: assets, error, isLoading } = useSWRImmutable('assets api', { fetcher: fetchAssets })

  const fetchInfo = useCallback(async () => {
    if (!assets || error || isLoading) return

    const wbnbPrice = assets.find(
      asset => asset.address.toLowerCase() === Contracts.WBNB[networkId].toLowerCase(),
    )?.price
    const nativeBNB = {
      address: 'BNB',
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
      logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
      price: wbnbPrice,
    }
    const filteredAssets = assets.filter(item => item.chainId === networkId)
    filteredAssets.unshift(nativeBNB)
    let result = filteredAssets.map(item => ({
      ...item,
      balance: 0,
    }))
    if (account) {
      try {
        const data = await fetchUserAssetsData(filteredAssets, account, networkId)
        const sortedData = data.sort((a, b) => {
          if (new BigNumber(a.balance).times(a.price).lt(new BigNumber(b.balance).times(b.price))) return 1
          if (new BigNumber(a.balance).times(a.price).gt(new BigNumber(b.balance).times(b.price))) return -1
          return 0
        })
        result = sortedData
      } catch (e) {
        console.error('User Assets fetch had error', e)
      }
    }
    dispatch(
      updateAssets({
        assets: result.map(item => ({
          ...item,
          chainId: networkId,
        })),
        networkId,
      }),
    )
  }, [dispatch, assets, error, isLoading, account, networkId])

  useEffect(() => {
    fetchInfo()
  }, [fetchInfo])

  return null
}

export default Updater
