import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useMemo, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'

import CircleImage from '@/components/image/CircleImage'
import Spinner from '@/components/spinner'
import Tag from '@/components/tag'
import { TextHeading, TextSubHeading } from '@/components/typography'
import RenderIfVisible from '@/components/virtualList'
import { v4Client } from '@/lib/graphql'
import { cn, sliceAddress } from '@/lib/utils'

import { TYPE_SEE, V4_USERS_COUNT, V4_USERS_SEARCH } from './constants'
import { SearchSeeAll } from './SearchSeeAll'
import { VerifyPopover } from '../Profile/VerifyPopover'

function SearchUserItem({ user }) {
  const t = useTranslations()

  const { avatar, username, id, nameColor, checkMarkIcon, isAdmin, isSuperAdmin, verifiedAt, isVerified } = user

  return (
    <div className='my-1 flex items-center gap-1'>
      <Link
        className='flex cursor-pointer items-center justify-center gap-2'
        href={`/arena/profile/${username ? encodeURIComponent(username.toLowerCase()) : id.toLowerCase()}`}
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
            {isVerified && <VerifyPopover verifyImage={checkMarkIcon} verifiedAt={verifiedAt} />}
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

const fetchCountUser = async search => {
  try {
    if (search) {
      const { usersTotalCount } = await v4Client.request(V4_USERS_COUNT, { search })
      return { usersTotalCount }
    }
  } catch (error) {
    return { usersTotalCount: 0 }
  }
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

export function SearchUsers({ users, showSeeAll, setSeeType, seeType, searchText, userCount }) {
  const t = useTranslations()
  const rootRef = useRef(null)

  const { data, size, setSize } = useSWRInfinite(
    index => (seeType === TYPE_SEE.USER ? [searchText, index, 'userSearch'] : null),
    ([queryText, index]) => fetchUser(queryText, 10, index * 10),
  )

  const { data: usersTotalCount } = useSWR(seeType === TYPE_SEE.USER ? ['count user', searchText] : null, () =>
    fetchCountUser(searchText),
  )

  const searchUsers = useMemo(() => (data ? [].concat(...data) : []), [data])

  const isEmpty = usersTotalCount === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 10)

  return (
    <div>
      <TextHeading className='mb-4 mt-2'>{t('Users')}</TextHeading>
      <div className='mt-2 max-h-80 overflow-y-auto' ref={rootRef} id='scrollableDiv'>
        {seeType === TYPE_SEE.ALL ? (
          users?.map(item => (
            <RenderIfVisible defaultHeight={60} visibleOffset={700} root={rootRef.current}>
              <SearchUserItem user={item} key={item.id} />
            </RenderIfVisible>
          ))
        ) : (
          <InfiniteScroll
            dataLength={searchUsers?.length ?? 0}
            hasMore={!isReachingEnd}
            next={() => setSize(size + 1)}
            loader={<Spinner className='size-4' />}
            endMessage={
              <p style={{ textAlign: 'center' }}>
                <b>{t('You have seen it all')}</b>
              </p>
            }
            scrollableTarget='scrollableDiv'
          >
            {searchUsers?.map(item => (
              <RenderIfVisible defaultHeight={60} visibleOffset={700} root={rootRef.current}>
                <SearchUserItem user={item} key={item.id} />
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
