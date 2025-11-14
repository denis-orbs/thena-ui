'use client'

import { gql } from 'graphql-request'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import AvailableDropdown from '@/components/dropdown/AvailableDropdown'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { ArenaClient } from '@/lib/graphql'
import { formatAmount } from '@/lib/utils'

import MenuTab from '../MenuTab'
import ThenaIdModal from '../../profile/ThenaIdModal'

const V4_AVAILABLE = gql`
  query V4_AVAILABLE(
    $offset: Int = 0
    $where: ThenaIdAvailableWhereInput = {}
    $q: whereInput = {}
    $orderBy: [ThenaIdAvailableOrderByInput!] = []
  ) {
    thenaIdAvailables(offset: $offset, orderBy: $orderBy, limit: 100, where: $where) {
      id
      cost
      name
      trait
    }
    thenaIdAvailableTotalCount(where: $q)
  }
`

const LIST_CATEGORY = {
  ALL: 'All',
  '1_LETTER_WORDS': '1 Letter Words',
  '2_LETTER_WORDS': '2 Letter Words',
  '3_LETTER_WORDS': '3 Letter Words',
  '4_LETTER_WORDS': '4 Letter Words',
  '5_LETTER_WORDS': '5 Letter Words',
  '6_LETTER_WORDS': '6 Letter Words',
  '7_LETTER_WORDS': '7 Letter Words',
  '8_LETTER_WORDS': '8 Letter Words',
  '9_LETTER_WORDS': '9 Letter Words',
  '10_LETTER_WORDS': '10 Letter Words',
  '11_LETTER_WORDS': '11 Letter Words',
  '12_LETTER_WORDS': '12 Letter Words',
  '13_LETTER_WORDS': '13 Letter Words',
  '14_LETTER_WORDS': '14 Letter Words',
  '15_LETTER_WORDS': '15 Letter Words',
  ADJECTIVES: 'Adjectives',
  CAPITALS: 'Capitals',
  CITIES: 'Cities',
  COMPANIES: 'Companies',
  CONTINENTS: 'Continents',
  COUNTRIES: 'Countries',
  COUNTRY_CODES: 'Country Codes',
  FEMALE_NAMES: 'Female Names',
  FIRST_NAMES: ' First Names',
  FRUITS: 'Fruits',
  GREEK_GODS: 'Greek Gods',
  LAST_NAMES: 'Last Names',
  MALE_NAMES: ' Male Names',
  NOUNS: 'Nouns',
  VEGETABLES: 'Vegetables',
  VERBS: 'Verbs',
}

const fetchAvailable = async (sort, currentPage, whereQuery = {}, whereTotal = {}) => {
  const offset = (currentPage - 1) * 100

  try {
    const orderBy = ['id_ASC']

    switch (sort.value) {
      case 'name':
        orderBy.unshift(sort.isDesc ? 'name_DESC' : 'name_ASC')
        break
      case 'trait':
        orderBy.unshift(sort.isDesc ? 'trait_DESC' : 'trait_ASC')
        break
      default:
        break
    }

    const { thenaIdAvailables, thenaIdAvailableTotalCount } = await ArenaClient.request(V4_AVAILABLE, {
      offset,
      where: whereQuery,
      q: whereTotal,
      orderBy,
    })

    return { thenaIdAvailables, thenaIdAvailableTotalCount }
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function AvailablePage() {
  const t = useTranslations()
  const { account } = useWallet()

  const sortOptions = useMemo(() => {
    const arr = [
      {
        label: 'THENA ID',
        value: 'name',
        width: 'w-[33%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Cost',
        value: 'cost',
        width: 'w-[33%]',
        isDesc: true,
        disabled: true,
      },
      {
        label: 'Category',
        value: 'trait',
        width: 'w-[35%]',
        isDesc: false,
        disabled: false,
      },
    ]

    return arr
  }, [])

  const listCategory = useMemo(
    () =>
      Object.entries(LIST_CATEGORY).map(([key, value]) => ({
        label: value,
        value: key,
      })),
    [],
  )

  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[2])
  const [dataFetch, setDataFetch] = useState([])
  const [totalItem, setTotalItem] = useState(0)
  const [nameChoose, setNameChoose] = useState(undefined)
  const [showModal, setShowModal] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectFilterField, setSelectFilterField] = useState(listCategory[0])

  const assets = useAssets()
  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  const debounceSearch = useDebounce(searchText.trim(), 300)

  const whereQuery = useMemo(() => {
    let filter = {}
    if (debounceSearch) {
      filter = {
        name_containsInsensitive: debounceSearch,
      }
    }
    if (selectFilterField) {
      if (selectFilterField.value !== 'ALL') {
        filter = {
          ...filter,
          trait_eq: selectFilterField.value,
        }
      }
    }
    return filter
  }, [debounceSearch, selectFilterField])

  const whereTotal = useMemo(() => {
    let filter = {}
    if (debounceSearch) {
      filter = {
        name_contain: debounceSearch,
      }
    }
    if (selectFilterField) {
      if (selectFilterField.value !== 'ALL') {
        filter = {
          ...filter,
          trait_eq: selectFilterField.value,
        }
      }
    }
    return filter
  }, [debounceSearch, selectFilterField])

  const { data, isLoading } = useSWR(
    ['available api', currentPage, debounceSearch, sort, selectFilterField],
    () => fetchAvailable(sort, currentPage, whereQuery, whereTotal),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  useEffect(() => {
    if (!isLoading) {
      if (data) {
        if (Array.isArray(data.thenaIdAvailables)) {
          setDataFetch(data.thenaIdAvailables)
        } else {
          setDataFetch([])
        }

        setTotalItem(data.thenaIdAvailableTotalCount || 0)
      } else {
        setDataFetch([])
        setTotalItem(0)
      }
    }
  }, [data, isLoading])

  useEffect(() => {
    setCurrentPage(1)
  }, [debounceSearch, selectFilterField, sort])

  const sortedData = useMemo(
    () =>
      dataFetch?.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'name':
            res = a.name.localeCompare(b.name) * (sort.isDesc ? -1 : 1)
            break
          case 'cost':
            res = (a.cost - b.cost) * (sort.isDesc ? -1 : 1)
            break
          case 'trait':
            res = a.trait.localeCompare(b.trait) * (sort.isDesc ? -1 : 1)
            break
          default:
            break
        }
        return res
      }),
    [dataFetch, sort],
  )

  const formatCategory = useCallback(category => {
    const arr = Object.entries(LIST_CATEGORY).map(([key, value]) => ({ key, value }))
    const index = arr.findIndex(item => category === item.key)
    if (index !== -1) {
      return arr[index].value
    }
    return category
  }, [])

  const finalData = useMemo(
    () =>
      sortedData?.map(item => ({
        name: (
          <Link href={`/arena/thena-id/browse/${item.name}`}>
            <Paragraph>{item.name}</Paragraph>
          </Link>
        ),
        cost: (
          <div className='flex items-center justify-center gap-2'>
            {USDTAsset?.logoURI && (
              <Image
                alt='token'
                src={`${USDTAsset.logoURI ?? ''}`}
                className='shrink-0'
                width={24}
                height={24}
                loading='lazy'
              />
            )}
            <Paragraph>
              {item.cost ? formatAmount(item.cost) : 0} {USDTAsset?.symbol}
            </Paragraph>
          </div>
        ),
        trait: <Paragraph>{formatCategory(item.trait)}</Paragraph>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [USDTAsset?.symbol, JSON.stringify(sortedData)],
  )

  return (
    <div>
      <div className='mt-6'>
        <h2>{t('THENA ID')}</h2>
      </div>
      <MenuTab />
      {/* NEED TO CHECK THIS FIRST */}
      <div className='mt-6 flex flex-col items-center justify-between gap-2 md:flex-row md:gap-3'>
        <SearchInput
          className='h-11 w-full md:w-[336px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
        />

        <AvailableDropdown
          className='h-11 w-full lg:w-[200px]'
          data={listCategory}
          selected={selectFilterField}
          setSelected={ele => {
            setSelectFilterField(ele)
          }}
          placeHolder='Select Category'
          listClassNames='max-h-[400px]'
        />
      </div>
      <div className='mt-6 w-full'>
        <Table
          data={finalData}
          sortOptions={sortOptions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sort={sort}
          setSort={setSort}
          tableBasic
          pageSize={100}
          totalItems={totalItem}
          showPopoverPagination
          loading={isLoading}
        />
      </div>
      {showModal && nameChoose && (
        <ThenaIdModal
          tab='get'
          targetAddress={account}
          onClose={() => {
            setShowModal(false)
            setNameChoose(undefined)
          }}
          defaultThenaIdsData={[
            {
              id: 1,
              username: nameChoose.name,
              errorMessage: '',
              cost: undefined,
            },
          ]}
        />
      )}
    </div>
  )
}

export default AvailablePage
