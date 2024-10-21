import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo, useRef } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import { TextHeading } from '@/components/typography'
import RenderIfVisible from '@/components/virtualList'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'
import { cn } from '@/lib/utils'

import { TYPE_SEE } from './constants'
import { SearchSeeAll } from './SearchSeeAll'

export function SearchTCItem({ competition, setIsPopoverOpen }) {
  const t = useTranslations()
  const eventType = useMemo(() => getEventType(competition?.timestamp), [competition?.timestamp])

  const bgStatus = useMemo(() => {
    if (eventType) {
      switch (eventType) {
        case EVENT_TYPES.UPCOMING:
          return 'bg-green-700'
        case EVENT_TYPES.LIVE:
          return 'bg-blue-500'
        case EVENT_TYPES.ENDED:
          return 'bg-red-600'
        default:
          return ''
      }
    }
    return ''
  }, [eventType])

  return (
    <div className='my-2 flex w-full items-center justify-start gap-2'>
      <div className='h-9 w-9 shrink-0 rounded-md'>
        {competition?.bannerUrl || competition?.defaultBannerUrl ? (
          <Image
            alt='tc-banner'
            src={competition?.bannerUrl ?? competition?.defaultBannerUrl}
            layout='fill'
            className='!relative !h-auto !w-9 rounded-md'
          />
        ) : (
          <div className='h-9 w-9 rounded-md bg-primary-600' />
        )}
      </div>

      <div className='flex-1'>
        <Link
          className='cursor-pointer'
          href={`/arena/trading-competitions/${competition.id}`}
          onClick={() => setIsPopoverOpen(false)}
        >
          <TextHeading className='ellipsis-1 text-base'>{competition.name}</TextHeading>
        </Link>
        <div className='mt-1 flex items-center justify-start gap-2'>
          <NeutralBadge className='text-nowrap px-1 text-[10px] capitalize lg:text-[10px]'>
            {competition.market.toLowerCase()}
          </NeutralBadge>
          {eventType && (
            <NeutralBadge className={cn('text-nowrap px-1 text-[10px] lg:text-[10px]', bgStatus)}>
              {t(eventType)}
            </NeutralBadge>
          )}
          <UserProfileCard
            user={competition.owner}
            disableLink
            enableFollow={false}
            userClassName='text-xs'
            avatarSize='size-6'
          />
        </div>
      </div>
    </div>
  )
}

export function SearchTCs({ tradingCompetitions, showSeeAll, setSeeType, seeType, setIsPopoverOpen }) {
  const t = useTranslations()
  const rootRef = useRef(null)

  return (
    <div>
      <TextHeading className='my-2'>{t('Trading Competitions')}</TextHeading>
      <div className='max-h-80 overflow-y-auto' ref={rootRef}>
        {tradingCompetitions.slice(0, seeType !== TYPE_SEE.ALL ? tradingCompetitions.length : 3).map(tc => (
          <RenderIfVisible defaultHeight={60} root={rootRef.current}>
            <SearchTCItem competition={tc} key={tc.id} setIsPopoverOpen={setIsPopoverOpen} />
          </RenderIfVisible>
        ))}
      </div>
      {showSeeAll && (
        <SearchSeeAll
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            setSeeType(TYPE_SEE.TC)
          }}
          count={tradingCompetitions.length}
        />
      )}
    </div>
  )
}
