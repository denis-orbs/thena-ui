'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'

import { BribeABI } from '@/abis/ve/BribeABI'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import { ItemToken } from '@/modules/TokenModal/ItemToken'

export function TokenModal({ popup, setPopup, pair, selectedAsset, setSelectedAsset, otherAsset, setOtherAsset }) {
  const t = useTranslations()

  const { data: tokenLength = 0 } = useReadContract({
    abi: BribeABI,
    address: pair?.gauge?.bribe,
    functionName: 'rewardsListLength',
    query: {
      enabled: !!pair?.gauge?.bribe,
    },
  })

  const { data: whiteList } = useReadContracts({
    contracts: Array.from({ length: Number(tokenLength) }, (_, i) => ({
      abi: BribeABI,
      address: pair?.gauge?.bribe,
      functionName: 'rewardTokens',
      args: [i],
    })),
    enabled: Boolean(tokenLength),
  })

  const baseAssets = useAssets()
  const [searchText, setSearchText] = useState('')
  const search = useDebounce(searchText)

  const tokenList = useMemo(() => {
    const whiteListToken = new Set()
    whiteList?.forEach(element => {
      whiteListToken.add(element?.result?.toLowerCase())
    })

    return baseAssets.filter(asset => whiteListToken.has(asset.address.toLowerCase()))
  }, [baseAssets, whiteList])

  const filteredAssets = useMemo(() => {
    if (search) {
      return tokenList.filter(
        asset =>
          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
          asset.address.toLowerCase().includes(search.toLowerCase()),
      )
    }
    return tokenList
  }, [search, tokenList])

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
          placeholder='Search by name, symbol or address'
          autoFocus
        />
      </div>

      <div className='h-px w-full border border-neutral-700' />

      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='px-3'>{t('Assets')}</Paragraph>

        <div className='max-h-[340px] overflow-auto' id='scrollableDiv'>
          {filteredAssets.map(item => (
            <ItemToken
              key={item.address}
              item={item}
              setPopup={setPopup}
              selectedAsset={selectedAsset}
              setSelectedAsset={setSelectedAsset}
              otherAsset={otherAsset}
              setOtherAsset={setOtherAsset}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
