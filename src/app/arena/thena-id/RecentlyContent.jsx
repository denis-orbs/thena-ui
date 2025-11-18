import { gql } from 'graphql-request'
import moment from 'moment'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { ArenaClient } from '@/lib/graphql'
import { VerifyPopover } from '@/modules/Profile/VerifyPopover'
import { useLocaleSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

import MenuTab from './MenuTab'

const V4_RECENTLY_MINTED = gql`
  query V4_RECENTLY_MINTED {
    usernameNfts(orderBy: id_DESC) {
      id
      index
      name
      timestamp
      cost
      owner {
        id
        firstInteractAt
        biography
        websiteUrl
        xProfileUrl
        username
        theme
        nameColor
        avatar
        balance
        isSuperAdmin
        checkMarkIcon
        verifiedAt
        isAdmin
        isVerified
      }
    }
  }
`

const V4_RECENTLY_GIFTED = gql`
  query V4_RECENTLY_GIFTED {
    usernameNfts(where: { isGift_eq: true }, orderBy: id_DESC) {
      id
      index
      name
      timestamp
      cost
      owner {
        id
        firstInteractAt
        biography
        websiteUrl
        xProfileUrl
        username
        theme
        nameColor
        avatar
        balance
        isSuperAdmin
        checkMarkIcon
        verifiedAt
        isAdmin
        isVerified
      }
      giftFrom {
        id
        firstInteractAt
        biography
        websiteUrl
        xProfileUrl
        username
        theme
        nameColor
        avatar
        balance
        isSuperAdmin
        checkMarkIcon
        verifiedAt
        isAdmin
        isVerified
      }
    }
  }
`

const fetchRecentlyMinted = async (isMinted = false) => {
  try {
    const { usernameNfts } = await ArenaClient.request(isMinted ? V4_RECENTLY_MINTED : V4_RECENTLY_GIFTED)
    return usernameNfts
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function RecentlyContent({ isMinted = true }) {
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
        label: 'Time Ago',
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
  const { page } = useParams()
  const [currentPage, setCurrentPage] = useState(page ? Number(page) : 1)
  const [sort, setSort] = useState(sortOptions[0])
  const [dataFetch, setDataFetch] = useState([])

  const assets = useAssets()

  const { locale } = useLocaleSettings()

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

  const getData = useCallback(async () => {
    if (!isLoading) {
      if (data && Array.isArray(data)) {
        const arr = data.map(item => ({
          index: item.index,
          name: item.name,
          owner: item.owner,
          ownerUsername: item.owner.username,
          timestamp: item.timestamp,
          cost: item.cost,
          giftFrom: item.giftFrom || undefined,
          giftTo: item.owner,
        }))
        setDataFetch(arr)
      } else {
        setDataFetch([])
      }
    } else {
      setDataFetch(undefined)
    }
  }, [data, isLoading])

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
            res =
              (a.owner.username || a.owner.id).localeCompare(b.owner.username || b.owner.id) * (sort.isDesc ? -1 : 1)
            break
          case 'cost':
            res = (a.cost - b.cost) * (sort.isDesc ? -1 : 1)
            break
          case 'giftFrom':
            res =
              (a.giftFrom?.username || a.giftFrom.id).localeCompare(b.giftFrom?.username || b.giftFrom?.id) *
              (sort.isDesc ? -1 : 1)
            break
          case 'giftTo':
            res =
              (a.giftTo?.username || a.giftTo.id).localeCompare(b.giftTo?.username || b.giftTo?.id) *
              (sort.isDesc ? -1 : 1)

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
        timestamp: <Paragraph>{moment(item.timestamp).locale(locale).fromNow()}</Paragraph>,
        name: (
          <Link
            className='flex cursor-pointer items-center justify-center gap-2'
            href={`/arena/thena-id/browse/${encodeURIComponent(item.name)}`}
          >
            <div className='mr-1 flex flex-col gap-1'>
              <TextHeading
                className={cn(
                  'text-base text-nowrap',
                  item.owner.nameColor && !String(item.owner.nameColor).startsWith('#') ? item.owner.nameColor : '',
                )}
              >
                <span
                  style={{
                    color: item.owner.nameColor
                      ? String(item.owner.nameColor).startsWith('#')
                        ? item.owner.nameColor
                        : ''
                      : '',
                  }}
                >
                  {item.name}
                </span>
              </TextHeading>
            </div>
            {item.owner.isVerified && (
              <VerifyPopover verifyImage={item.owner.checkMarkIcon} verifiedAt={item.owner.verifiedAt} />
            )}
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
        owner: <UserProfileCard user={item.owner} showVerified={item.owner.isVerified} />,
        giftFrom: <UserProfileCard user={item.giftFrom} showVerified={item.giftFrom?.isVerified} />,
        giftTo: <UserProfileCard user={item.giftTo} showVerified={item.giftTo?.isVerified} />,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [USDTAsset?.symbol, JSON.stringify(sortedData), locale],
  )

  useEffect(() => {
    getData()
  }, [getData])

  useEffect(() => {
    if (!page) {
      setCurrentPage(1)
    }
  }, [isMinted, page])

  return (
    <div>
      <div className='mt-6'>
        <h2>{t('THENA ID')}</h2>
      </div>
      <MenuTab />
      <div className='align-right mt-6 flex justify-end'>
        <Link href={`/arena/thena-id/recently-${isMinted ? 'gifted' : 'minted'}`}>
          <Toggle toggleId='seeGiftedOnly' checked={!isMinted} onChange={() => {}} />
        </Link>
        <TextHeading>{t('See Gifted Only')}</TextHeading>
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
          pageSize={50}
          showPopoverPagination
        />
      </div>
    </div>
  )
}

export default RecentlyContent
