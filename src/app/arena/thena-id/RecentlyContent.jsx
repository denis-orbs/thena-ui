import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import moment from 'moment'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Table from '@/components/table'
import Toggle from '@/components/toggle'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useUSDTCostPerToken } from '@/hooks/useThenaIdContract'
import { readCall } from '@/lib/contractActions'
import { getThenaIDContract } from '@/lib/contracts'
import { v4Client } from '@/lib/graphql'
import { formatAmount, fromWei, sliceAddress } from '@/lib/utils'

const V4_RECENTLY_MINTED = gql`
  query V4_RECENTLY_MINTED {
    usernameNfts {
      id
      index
      name
      timestamp
      owner {
        id
        username
      }
    }
  }
`

const V4_RECENTLY_GIFTED = gql`
  query V4_RECENTLY_GIFTED {
    usernameNfts(where: { isGift_eq: true }) {
      id
      index
      name
      timestamp
      owner {
        id
        username
      }
      giftFrom {
        id
        username
      }
    }
  }
`

const fetchRecentlyMinted = async (isMinted = false) => {
  try {
    const { usernameNfts } = await v4Client.request(isMinted ? V4_RECENTLY_MINTED : V4_RECENTLY_GIFTED)
    return usernameNfts
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function RecentlyContent() {
  const pathname = usePathname()
  const isMinted = pathname.includes('minted')

  const sortOptions = useMemo(() => {
    const arr = [
      {
        label: <span>#</span>,
        value: 'index',
        width: 'w-[10%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Time ago',
        value: 'timestamp',
        width: 'w-[15%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'THENA ID',
        value: 'name',
        width: 'w-[20%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Cost',
        value: 'cost',
        width: 'w-[15%]',
        isDesc: true,
        disabled: false,
      },
    ]

    if (isMinted) {
      arr.push({
        label: 'Owner',
        value: 'owner',
        width: 'w-[25%]',
        isDesc: true,
        disabled: false,
      })
    } else {
      arr.push({
        label: 'Gift From',
        value: 'giftFrom',
        width: 'w-[25%]',
        isDesc: true,
        disabled: false,
      })

      arr.push({
        label: 'Gift To',
        value: 'giftTo',
        width: 'w-[25%]',
        isDesc: true,
        disabled: false,
      })
    }

    return arr
  }, [isMinted])

  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])
  const [dataFetch, setDataFetch] = useState([])
  const { costPerToken } = useUSDTCostPerToken()
  const assets = useAssets()

  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  const { data, isLoading } = useSWR(['recently minted api', isMinted], () => fetchRecentlyMinted(isMinted), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const calculateCost = useCallback(
    thenaIdLength => {
      if (costPerToken) {
        if (costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]) {
          return costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]
        }
        if (new BigNumber(thenaIdLength).toNumber() > costPerToken.length) {
          return costPerToken[costPerToken.length - 1]
        }
      }
      return undefined
    },
    [costPerToken],
  )

  const getData = useCallback(async () => {
    if (!isLoading) {
      if (data && Array.isArray(data)) {
        const contract = getThenaIDContract()
        const arr = []
        for (const item of data) {
          const length = await readCall(contract, 'getLength', [item.name])
          const cost = calculateCost(length || 0)
          arr.push({
            index: item.index,
            name: item.name,
            owner: item.owner.id,
            ownerUsername: item.owner.username,
            timestamp: item.timestamp,
            cost: cost ? fromWei(cost, USDTAsset?.decimals) : 0,
            giftFrom: item.giftFrom || undefined,
            giftTo: item.owner.id,
            giftToUsername: item.owner.username,
          })
        }

        setDataFetch(arr)
      } else {
        setDataFetch([])
      }
    } else {
      setDataFetch(undefined)
    }
  }, [USDTAsset?.decimals, calculateCost, data, isLoading])

  useEffect(() => {
    getData()
  }, [getData])

  const sortedData = useMemo(
    () =>
      dataFetch?.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'index':
            res = (a.index - b.index) * (sort.isDesc ? -1 : 1)
            break
          case 'timestamp':
            res = (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * (sort.isDesc ? -1 : 1)
            break
          case 'name':
            res = a.name.localeCompare(b.name) * (sort.isDesc ? -1 : 1)
            break
          case 'owner':
            res = a.owner.localeCompare(b.owner) * (sort.isDesc ? -1 : 1)
            break
          case 'cost':
            res = (a.cost - b.cost) * (sort.isDesc ? -1 : 1)
            break
          case 'giftFrom':
            res =
              (a.giftFrom.username || a.giftFrom.id).localeCompare(b.giftFrom.username || b.giftFrom.id) *
              (sort.isDesc ? -1 : 1)
            break
          case 'giftTo':
            res = a.giftTo.localeCompare(b.giftTo) * (sort.isDesc ? -1 : 1)
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
        index: <Paragraph>{item.index}</Paragraph>,
        timestamp: <Paragraph>{moment(item.timestamp).fromNow()}</Paragraph>,
        name: <Paragraph>{item.name}</Paragraph>,
        cost: (
          <Paragraph>
            {item.cost ? formatAmount(item.cost) : 0} {USDTAsset?.symbol}
          </Paragraph>
        ),
        owner: (
          <Paragraph className='block w-full text-left'>
            <Link href={`/arena/profile/${item.ownerUsername ? item.ownerUsername : item.owner}`}>
              {sliceAddress(item.owner)}
            </Link>
          </Paragraph>
        ),
        giftFrom: (
          <Paragraph className='block w-full text-left'>
            <Link href={`/arena/profile/${item.giftFrom?.username ? item.giftFrom.username : item.giftFrom?.id}`}>
              {item.giftFrom?.username ? item.giftFrom.username : sliceAddress(item.giftFrom?.id || '')}
            </Link>
          </Paragraph>
        ),
        giftTo: (
          <Paragraph className='block w-full text-left'>
            <Link href={`/arena/profile/${item.giftToUsername ? item.giftToUsername : item.giftTo}`}>
              {sliceAddress(item.giftTo)}
            </Link>
          </Paragraph>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [USDTAsset?.symbol, JSON.stringify(sortedData)],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [isMinted])

  return (
    <div>
      <div className='mt-6 flex flex-col items-start justify-center gap-3 md:flex-row md:items-center md:justify-between'>
        <h2>{t(isMinted ? 'Recently minted THENA IDs' : 'Recently gifted THENA IDs')}</h2>
        <div className='flex items-center gap-1'>
          <Link href={`/arena/thena-id/recently-${isMinted ? 'gifted' : 'minted'}`}>
            <Toggle toggleId='seeGiftedOnly' checked={!isMinted} onChange={() => {}} />
          </Link>
          <TextHeading>{t('See gifted only')}</TextHeading>
        </div>
      </div>
      <div className='mt-6 w-full'>
        <Table
          data={finalData || []}
          sortOptions={sortOptions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sort={sort}
          setSort={setSort}
          tableBasic
          enabledRedirectOnClickPagination
          loading={isLoading || !dataFetch}
        />
      </div>
    </div>
  )
}

export default RecentlyContent
