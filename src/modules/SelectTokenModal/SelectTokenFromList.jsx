import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'

import { ItemToken } from '../TokenModal/ItemToken'

export default function SelectTokenFromList({ isOpen, setIsOpen, tokens, setToken, selectedAsset }) {
  const t = useTranslations()
  const handleSelect = useCallback(
    token => {
      setToken(token)
      setIsOpen(false)
    },
    [setIsOpen, setToken],
  )

  const [searchText, setSearchText] = useState('')
  const search = useDebounce(searchText)

  const filteredAssets = useMemo(() => {
    if (search) {
      return (tokens || []).filter(
        asset =>
          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
          asset.address.toLowerCase().includes(search.toLowerCase()),
      )
    }
    return tokens
  }, [search, tokens])

  return (
    <Modal
      isOpen={isOpen}
      closeModal={() => {
        setIsOpen(false)
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
      </div>

      <div className='h-px w-full border border-neutral-700' />

      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='px-3'>{t('Assets')}</Paragraph>

        <div className='max-h-[340px] overflow-auto' id='scrollableDiv'>
          {filteredAssets.map(item => (
            <ItemToken
              key={item.address}
              item={item}
              setPopup={setIsOpen}
              selectedAsset={selectedAsset}
              setSelectedAsset={handleSelect}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
