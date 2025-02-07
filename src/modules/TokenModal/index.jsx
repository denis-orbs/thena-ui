'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { formatUnits, getAddress, isAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import RenderIfVisible from '@/components/virtualList'
import { ERC20Abi } from '@/constant/abi'
import { CHAIN_ID } from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { cn, wrappedAddress } from '@/lib/utils'
import { useLocalTokens } from '@/state/localTokens/store'

import { ItemToken } from './ItemToken'

const TRENDING_TOKENS = [
  {
    address: 'BNB',
    name: 'Binance Coin',
    symbol: 'BNB',
    decimals: 18,
    logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
    chainId: 56,
  },
  {
    name: 'BTCB Token',
    symbol: 'BTCB',
    decimals: 18,
    chainId: 56,
    address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
    logoURI: 'https://cdn.thena.fi/assets/BTCB.png',
  },
  {
    name: 'BUSD Token',
    symbol: 'BUSD',
    decimals: 18,
    chainId: 56,
    address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    logoURI: 'https://cdn.thena.fi/assets/BUSD.png',
  },
  {
    name: 'Ethereum Token',
    symbol: 'ETH',
    decimals: 18,
    chainId: 56,
    address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    logoURI: 'https://cdn.thena.fi/assets/ETH.png',
  },
  {
    name: 'Frax',
    symbol: 'FRAX',
    decimals: 18,
    chainId: 56,
    address: '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40',
    logoURI: 'https://cdn.thena.fi/assets/FRAX.png',
  },
  {
    name: 'THENA',
    symbol: 'THE',
    decimals: 18,
    chainId: 56,
    address: '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11',
    logoURI: 'https://cdn.thena.fi/assets/THE.png',
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 18,
    chainId: 56,
    address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    logoURI: 'https://cdn.thena.fi/assets/USDC.png',
  },
  {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 18,
    chainId: 56,
    address: '0x55d398326f99059ff775485246999027b3197955',
    logoURI: 'https://cdn.thena.fi/assets/USDT.png',
  },
]

function TokenModal({
  popup,
  setPopup,
  selectedAsset,
  setSelectedAsset,
  otherAsset,
  setOtherAsset,
  onAssetSelect = () => {},
  hiddenTokens = [],
  isHideTrending = false,
}) {
  const t = useTranslations()
  const { account, chainId } = useWallet()
  const rootRef = useRef(null)

  const assets = useAssets()

  const baseAssets = useMemo(
    () =>
      hiddenTokens && Array.isArray(hiddenTokens) && hiddenTokens.length > 0
        ? assets.filter(
            asset => !hiddenTokens.filter(Boolean).some(token => wrappedAddress(asset).includes(token.toLowerCase())),
          )
        : assets,
    [assets, hiddenTokens],
  )

  const [customToken, setCustomToken] = useState()
  const [searchText, setSearchText] = useState('')

  const search = useDebounce(searchText)
  const { localTokens } = useLocalTokens()

  const filteredAssets = useMemo(() => {
    const tokenList = localTokens.concat(baseAssets)

    const result = search
      ? tokenList.filter(
          asset =>
            asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
            asset.address.toLowerCase().includes(search.toLowerCase()),
        )
      : tokenList

    if (result.length === 0 && customToken) {
      result.push(customToken)
    }

    return result
  }, [baseAssets, customToken, localTokens, search])

  const { data: newToken, isSuccess } = useReadContracts({
    contracts: [
      {
        abi: ERC20Abi,
        functionName: 'name',
        address: search,
      },
      {
        abi: ERC20Abi,
        functionName: 'symbol',
        address: search,
      },
      {
        abi: ERC20Abi,
        functionName: 'decimals',
        address: search,
      },
      {
        abi: ERC20Abi,
        functionName: 'balanceOf',
        address: search,
        args: [account],
      },
    ],
    query: {
      enable: isAddress(search) && filteredAssets.length === 0 && chainId,
    },
  })

  useEffect(() => {
    if (isSuccess && newToken) {
      const [name, symbol, decimals, balanceOf] = newToken
      if (name.status !== 'success') return

      if (customToken?.address === getAddress(search)) return
      setCustomToken({
        address: search,
        name: name.result,
        symbol: symbol?.result,
        decimals: Number(decimals?.result ?? 18),
        balance: formatUnits(balanceOf?.result ?? 0, decimals?.result ?? 18),
        isCustom: true,
        chainId: chainId ?? 56,
      })
    }
  }, [isSuccess, newToken, search, customToken?.address, chainId])

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Select Asset'
    >
      <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
        <SearchInput
          className='w-full'
          val={searchText}
          setVal={setSearchText}
          placeholder='Search by Name, Symbol or Address'
          autoFocus
        />
        <Paragraph className={cn((chainId === CHAIN_ID.TEST_BSC || isHideTrending) && 'hidden')}>
          {t('Trending Assets')}
        </Paragraph>
        <div className={cn('flex flex-wrap gap-2', (chainId === CHAIN_ID.TEST_BSC || isHideTrending) && 'hidden')}>
          {TRENDING_TOKENS.map((item, idx) => (
            <div
              key={idx}
              className='flex cursor-pointer items-center gap-2 rounded-lg bg-neutral-800 p-3'
              onClick={() => {
                if (otherAsset && otherAsset.address === item.address) {
                  const temp = selectedAsset
                  setSelectedAsset(otherAsset)
                  setOtherAsset(temp)
                } else {
                  setSelectedAsset(item)
                }
                onAssetSelect()
                setPopup(false)
              }}
            >
              <CircleImage src={item.logoURI} className='h-8 w-8' alt='thena token' />
              <div>
                <TextHeading className='text-sm'>{item.symbol}</TextHeading>
                {/* <TextSubHeading>{formatAmount(item.balance)}</TextSubHeading> */}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='h-px w-full border border-neutral-700' />

      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='px-3'>{t('Assets')}</Paragraph>

        <div className='max-h-[340px] overflow-auto' id='scrollableDiv'>
          <InfiniteScroll dataLength={filteredAssets.length}>
            {filteredAssets?.map(item => (
              <RenderIfVisible key={item.address} root={rootRef.current}>
                <ItemToken
                  item={item}
                  setPopup={setPopup}
                  selectedAsset={selectedAsset}
                  setSelectedAsset={setSelectedAsset}
                  otherAsset={otherAsset}
                  setOtherAsset={setOtherAsset}
                  onAssetSelect={onAssetSelect}
                />
              </RenderIfVisible>
            ))}
          </InfiniteScroll>
        </div>
      </div>
    </Modal>
  )
}

export default TokenModal
