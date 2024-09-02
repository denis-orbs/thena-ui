import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useMemo, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import useSWRInfinite from 'swr/infinite'

import CircleImage from '@/components/image/CircleImage'
import Spinner from '@/components/spinner'
import Tag from '@/components/tag'
import { TextHeading, TextSubHeading } from '@/components/typography'
import RenderIfVisible from '@/components/virtualList'
import { v4Client } from '@/lib/graphql'
import { cn, sliceAddress } from '@/lib/utils'

import { PAGE_SIZE, TYPE_SEE, V4_USERS_SEARCH } from './constants'
import { SearchSeeAll } from './SearchSeeAll'
import { VerifyPopover } from '../Profile/VerifyPopover'

function SearchUserItem({ user, setIsPopoverOpen }) {
  const t = useTranslations()

  const { avatar, username, id, nameColor, checkMarkIcon, isAdmin, isSuperAdmin, verifiedAt, isVerified } = user

  return (
    <div className='my-1 flex items-center gap-1'>
      <Link
        className='flex cursor-pointer items-center justify-center gap-2'
        href={`/arena/profile/${username ? encodeURIComponent(username.toLowerCase()) : id.toLowerCase()}`}
        onClick={() => setIsPopoverOpen(false)}
      >
        <CircleImage src={avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar} alt='avatar' className='size-8' />
        <div>
          <div className='mb-1 mr-1 flex items-center gap-1'>
            <TextHeading
              className={cn('text-nowrap text-base', nameColor && !String(nameColor).startsWith('#') ? nameColor : '')}
            >
              <span
                style={{
                  color: nameColor ? (String(nameColor).startsWith('#') ? nameColor : '') : '',
                }}
              >
                {username || sliceAddress(id)}
              </span>
            </TextHeading>
            {isVerified && <VerifyPopover verifyImage={checkMarkIcon} verifiedAt={verifiedAt} disablePopover />}
          </div>
          {isSuperAdmin ? (
            <Tag className='text-xs'>{t('Super Admin')}</Tag>
          ) : isAdmin ? (
            <Tag className='text-xs'>{t('Admin')}</Tag>
          ) : (
            <TextSubHeading>{sliceAddress(id)}</TextSubHeading>
          )}
        </div>
      </Link>
    </div>
  )
}

const fetchUser = async (search, limit, offset) => {
  try {
    if (search) {
      const { users } = await v4Client.request(V4_USERS_SEARCH, { search, limit, offset })

      return users
    }
  } catch (error) {
    console.log('err', error)
    return []
  }
}

export function SearchUsers({ users, showSeeAll, setSeeType, seeType, searchText, userCount, setIsPopoverOpen }) {
  const t = useTranslations()
  const rootRef = useRef(null)

  const { data, size, setSize } = useSWRInfinite(
    index => (seeType === TYPE_SEE.USER ? [searchText, index, 'userSearch'] : null),
    ([queryText, index]) => fetchUser(queryText, PAGE_SIZE, index * PAGE_SIZE),
  )

  const searchUsers = useMemo(() => (data ? [].concat(...data) : []), [data])

  const isEmpty = userCount === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE)

  return (
    <div>
      <TextHeading className='mb-4 mt-2'>{t('Users')}</TextHeading>
      <div className='mt-2 max-h-80 overflow-y-auto' ref={rootRef} id='scrollableDiv'>
        {seeType === TYPE_SEE.ALL ? (
          users?.map(item => (
            <RenderIfVisible defaultHeight={60} visibleOffset={700} root={rootRef.current}>
              <SearchUserItem user={item} key={item.id} setIsPopoverOpen={setIsPopoverOpen} />
            </RenderIfVisible>
          ))
        ) : (
          <InfiniteScroll
            dataLength={searchUsers?.length ?? 0}
            hasMore={!isReachingEnd}
            next={() => setSize(size + 1)}
            loader={
              <div className='flex h-6 w-full items-center justify-center'>
                <Spinner className='size-4' />
              </div>
            }
            scrollableTarget='scrollableDiv'
          >
            {searchUsers?.map(item => (
              <RenderIfVisible defaultHeight={60} visibleOffset={700} root={rootRef.current}>
                <SearchUserItem user={item} key={item.id} setIsPopoverOpen={setIsPopoverOpen} />
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
            setSeeType(TYPE_SEE.USER)
          }}
          count={userCount}
        />
      )}
    </div>
  )
}
