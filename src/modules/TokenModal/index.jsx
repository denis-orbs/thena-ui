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
import { useAssets } from '@/context/assetsContext'
import { useTokens } from '@/context/tokensContext'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { cn, wrappedAddress } from '@/lib/utils'
import { useLocalTokens } from '@/state/localTokens/store'

import { ItemToken } from './ItemToken'

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
  const { tokens } = useTokens()

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

  const trendingTokens = useMemo(() => (!tokens || tokens.length < 8 ? tokens : tokens.slice(0, 8)), [tokens])

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

    // Sort tokens - first match tokens list order, then sort alphabetically
    return result.sort((a, b) => {
      const tokensList = tokens ?? []
      const aIndex = tokensList.findIndex(token => token.address.toLowerCase() === a.address.toLowerCase())
      const bIndex = tokensList.findIndex(token => token.address.toLowerCase() === b.address.toLowerCase())

      // If both tokens are in the tokens list, maintain their order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }

      // If only one token is in the tokens list, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1

      // If neither token is in the tokens list, sort alphabetically by symbol
      return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase())
    })
  }, [baseAssets, customToken, localTokens, search, tokens])

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
        {trendingTokens.length > 0 && !isHideTrending && (
          <>
            <Paragraph>{t('Trending Assets')}</Paragraph>
            <div className='grid grid-cols-4 gap-2'>
              {trendingTokens.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-800 p-3 hover:bg-neutral-600',
                    item.symbol.length > 5 && 'gap-1.5 px-2',
                  )}
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
                  <CircleImage src={item.logoURI} className='h-8 w-8' alt={item.symbol} />
                  <div>
                    <TextHeading className='text-sm'>{item.symbol}</TextHeading>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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
