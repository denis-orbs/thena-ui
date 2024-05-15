'use client'

import { gql } from 'graphql-request'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { PrimaryButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { formatAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import ThenaIdModal from '../../profile/ThenaIdModal'

const V4_AVAILABLE = gql`
  query V4_AVAILABLE($offset: Int = 0, $where: ThenaIdAvailableWhereInput = {}, $q: String = "") {
    thenaIdAvailables(offset: $offset, limit: 100, orderBy: trait_DESC, where: $where) {
      id
      createdAt
      cost
      isMinted
      name
      proof
      trait
      updatedAt
    }
    thenaIdAvailableTotalCount(q: $q)
  }
`

const FILTERS = ['THENA ID', 'Category']

const fetchAvailable = async (offset = 0, whereQuery = {}, search = '') => {
  try {
    const { thenaIdAvailables, thenaIdAvailableTotalCount } = await v4Client.request(V4_AVAILABLE, {
      offset,
      where: whereQuery,
      q: search,
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
        width: account ? 'w-[25%]' : 'w-[33%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Cost',
        value: 'cost',
        width: account ? 'w-[25%]' : 'w-[33%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Category',
        value: 'trait',
        width: 'w-[35%]',
        isDesc: true,
        disabled: false,
      },
    ]

    if (account) {
      arr.push({
        label: '',
        value: 'action',
        width: 'w-[15%]',
        isDesc: true,
        disabled: true,
      })
    }

    return arr
  }, [account])

  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[2])
  const [dataFetch, setDataFetch] = useState([])
  const [totalItem, setTotalItem] = useState(0)
  const [nameChoose, setNameChoose] = useState(undefined)
  const [showModal, setShowModal] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectFilterField, _] = useState(FILTERS[0])

  const assets = useAssets()
  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  const debounceSearch = useDebounce(searchText.trim(), 300)
  const offset = useMemo(() => (currentPage - 1) * 100, [currentPage])

  const whereQuery = useMemo(() => {
    let filter = {}
    if (debounceSearch) {
      if (selectFilterField === FILTERS[0]) {
        filter = {
          name_containsInsensitive: debounceSearch,
        }
      } else {
        filter = {
          trait_containsInsensitive: debounceSearch,
        }
      }
    }
    return filter
  }, [debounceSearch, selectFilterField])

  const { data, isLoading } = useSWR(
    ['available api', offset, whereQuery],
    () => fetchAvailable(offset, whereQuery, debounceSearch),
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
  }, [debounceSearch])

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

  const finalData = useMemo(
    () =>
      sortedData?.map(item => ({
        name: <Paragraph>{item.name}</Paragraph>,
        cost: (
          <div className='flex items-center justify-center space-x-2'>
            {USDTAsset?.logoURI && (
              <Image
                alt='token'
                src={`${USDTAsset.logoURI ?? ''}`}
                className='flex-shrink-0'
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
        trait: <Paragraph>{item.trait}</Paragraph>,
        action: (
          <div>
            <PrimaryButton
              onClick={() => {
                setNameChoose(item)
                setShowModal(true)
              }}
            >
              Mint
            </PrimaryButton>
          </div>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [USDTAsset?.symbol, JSON.stringify(sortedData)],
  )

  return (
    <div>
      <div className='mt-6'>
        <h2>{t('Available THENA IDs')}</h2>
      </div>
      <div className='mt-6 flex flex-row items-center justify-between'>
        <SearchInput
          className='h-11 w-full md:w-[336px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
        />
        {/* <div className='my-2 flex items-center space-x-2.5'>
          <span className='whitespace-nowrap text-white'>{t('Filter By')}</span>
          <Dropdown
            className='w-full lg:w-[200px]'
            data={FILTERS.map(item => ({
              label: item,
            }))}
            selected={selectFilterField}
            setSelected={ele => setSelectFilterField(ele.label)}
          />
        </div> */}
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
