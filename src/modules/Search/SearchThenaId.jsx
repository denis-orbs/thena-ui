import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'

import { NeutralBadge } from '@/components/badges/Badge'
import CircleImage from '@/components/image/CircleImage'
import ImageThenaId from '@/components/image/ImageThenaId'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import Spinner from '@/components/spinner'
import { TextHeading } from '@/components/typography'
import RenderIfVisible from '@/components/virtualList'
import { readCall } from '@/lib/contractActions'
import { getThenaIDContract } from '@/lib/contracts'
import { ArenaClient } from '@/lib/graphql'

import { PAGE_SIZE, TYPE_SEE, V4_ID_SEARCH, V4_MINTED_ID_SEARCH } from './constants'
import { SearchSeeAll } from './SearchSeeAll'

function SearchThenaIdItem({ thenaId, setIsPopoverOpen }) {
  const t = useTranslations()

  return (
    <div className='my-2 flex items-center justify-start gap-2'>
      {thenaId.imageUrl ? (
        <CircleImage src={thenaId.imageUrl} alt='thenaId' className='size-8' />
      ) : (
        <ImageThenaId className='size-8 rounded-full' name='thenaId.name' />
      )}
      <div>
        <Link
          className='cursor-pointer'
          href={`/arena/thena-id/browse/${thenaId.name}`}
          onClick={() => setIsPopoverOpen(false)}
        >
          <TextHeading className='text-base'>{thenaId.name}</TextHeading>
        </Link>
        <div className='flex items-center justify-start gap-2'>
          {thenaId.available ? (
            <NeutralBadge className='bg-green-700 px-1 text-[10px] text-nowrap capitalize lg:text-[10px]'>
              {t('Available')}
            </NeutralBadge>
          ) : (
            <NeutralBadge className='px-1 text-[10px] text-nowrap capitalize lg:text-[10px]'>
              {t('Minted')}
            </NeutralBadge>
          )}
          {thenaId.owner && (
            <UserProfileCard
              user={thenaId.owner}
              enableFollow={false}
              userClassName='text-xs'
              disablePopover
              avatarSize='size-6'
              showVerified={thenaId.owner.isVerified}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const fetchThenaId = async (search, limit, offset) => {
  try {
    if (search) {
      const { usernameNfts } = await ArenaClient.request(V4_MINTED_ID_SEARCH, { search, limit, offset })

      return usernameNfts
    }
  } catch (error) {
    console.log('err', error)
    return []
  }
}

const fetchMintedId = async search => {
  try {
    const contract = getThenaIDContract()
    if (contract) {
      const [nameValid, tokkenvalid] = await Promise.all([
        readCall(contract, 'validateUsername', [search]),
        readCall(contract, 'usernameToTokenId', [search]),
      ])

      if (nameValid || !!tokkenvalid) {
        const { usernameNfts: idSearch } = await ArenaClient.request(V4_ID_SEARCH, { search })
        const _idSearch = idSearch.length
          ? {
              ...idSearch[0],
              available: false,
            }
          : {
              id: 'new',
              avatar: undefined,
              name: search,
              available: true,
            }
        return [_idSearch]
      }
    }
  } catch (error) {
    return []
  }
}

export function SearchThenaId({
  thenaIdTotalCount,
  searchText,
  thenaIds,
  showSeeAll,
  setSeeType,
  seeType,
  setIsPopoverOpen,
}) {
  const t = useTranslations()
  const rootRef = useRef(null)

  const { data, size, setSize } = useSWRInfinite(
    index => (seeType === TYPE_SEE.THENA_ID ? [searchText, index, 'thenaIdSearch'] : null),
    ([queryText, index]) => fetchThenaId(queryText, PAGE_SIZE, index * PAGE_SIZE),
  )

  const { data: mintedId } = useSWR(seeType === TYPE_SEE.THENA_ID ? ['minted thenaId', searchText] : null, () =>
    fetchMintedId(searchText),
  )

  const searchThenaId = useMemo(() => {
    const initialData = mintedId ?? []
    return data ? initialData.concat(...data) : initialData
  }, [data, mintedId])

  const isEmpty = thenaIdTotalCount === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE)

  return (
    <div>
      <TextHeading className='my-2'>{t('Thena Id')}</TextHeading>
      <div className='max-h-80 overflow-y-auto' ref={rootRef} id='scrollableThenaIdDiv'>
        {seeType === TYPE_SEE.ALL ? (
          thenaIds?.map(item => (
            <RenderIfVisible defaultHeight={60} root={rootRef.current}>
              <SearchThenaIdItem thenaId={item} key={item.id} setIsPopoverOpen={setIsPopoverOpen} />
            </RenderIfVisible>
          ))
        ) : (
          <InfiniteScroll
            dataLength={searchThenaId?.length ?? 0}
            hasMore={!isReachingEnd}
            next={() => setSize(size + 1)}
            loader={
              <div className='flex h-6 w-full items-center justify-center'>
                <Spinner className='size-4' />
              </div>
            }
            scrollableTarget='scrollableThenaIdDiv'
          >
            {searchThenaId?.map(item => (
              <RenderIfVisible defaultHeight={60} root={rootRef.current}>
                <SearchThenaIdItem thenaId={item} key={item.id} setIsPopoverOpen={setIsPopoverOpen} />
              </RenderIfVisible>
            ))}
          </InfiniteScroll>
        )}
      </div>
      {showSeeAll && (
        <SearchSeeAll
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            setSeeType(TYPE_SEE.THENA_ID)
          }}
          count={thenaIdTotalCount}
        />
      )}
    </div>
  )
}
