import { useTranslations } from 'next-intl'
import { memo, useCallback, useState } from 'react'

import { TextButton } from '@/components/buttons/Button'
import Spinner from '@/components/spinner'
import { ArrowLeftIcon } from '@/svgs'

import { TYPE_SEE } from './constants'
import { SearchTCs } from './SearchTCs'
import { SearchThenaId } from './SearchThenaId'
import { SearchUsers } from './SearchUsers'

function SearchContent({
  thenaIds,
  thenaIdTotalCount,
  users,
  usersTotalCount,
  tradingCompetitions,
  isLoading,
  searchText,
  setIsPopoverOpen,
  width = 360,
}) {
  const t = useTranslations()

  const [seeType, setSeeType] = useState(TYPE_SEE.ALL)

  const viewContentByType = useCallback(
    type => {
      switch (type) {
        case TYPE_SEE.USER:
          return (
            <SearchUsers
              users={users}
              showSeeAll={false}
              setSeeType={setSeeType}
              seeType={seeType}
              searchText={searchText}
              userCount={usersTotalCount}
              setIsPopoverOpen={setIsPopoverOpen}
            />
          )
        case TYPE_SEE.TC:
          return (
            <SearchTCs
              tradingCompetitions={tradingCompetitions}
              showSeeAll={false}
              setSeeType={setSeeType}
              seeType={seeType}
              setIsPopoverOpen={setIsPopoverOpen}
            />
          )
        case TYPE_SEE.THENA_ID:
          return (
            <SearchThenaId
              thenaIds={thenaIds}
              showSeeAll={false}
              setSeeType={setSeeType}
              seeType={seeType}
              setIsPopoverOpen={setIsPopoverOpen}
              searchText={searchText}
              thenaIdTotalCount={thenaIdTotalCount}
            />
          )
        default:
          return (
            <>
              {!!tradingCompetitions.length && (
                <SearchTCs
                  tradingCompetitions={tradingCompetitions}
                  showSeeAll={tradingCompetitions.length > 3}
                  setSeeType={setSeeType}
                  seeType={seeType}
                  setIsPopoverOpen={setIsPopoverOpen}
                />
              )}
              {!!tradingCompetitions.length && !!users.length && type === TYPE_SEE.ALL && (
                <hr className='my-5 border-neutral-600' />
              )}
              {!!users.length && (
                <SearchUsers
                  users={users}
                  showSeeAll={usersTotalCount > 3}
                  setSeeType={setSeeType}
                  seeType={seeType}
                  userCount={usersTotalCount}
                  searchText={searchText}
                  setIsPopoverOpen={setIsPopoverOpen}
                />
              )}
              {(!!tradingCompetitions.length || !!users.length) && !!thenaIds.length && type === TYPE_SEE.ALL && (
                <hr className='my-5 border-neutral-600' />
              )}
              {!!thenaIds.length && (
                <SearchThenaId
                  thenaIds={thenaIds}
                  showSeeAll={thenaIdTotalCount > 3}
                  setSeeType={setSeeType}
                  seeType={seeType}
                  searchText={searchText}
                  setIsPopoverOpen={setIsPopoverOpen}
                  thenaIdTotalCount={thenaIdTotalCount}
                />
              )}
            </>
          )
      }
    },
    [users, seeType, searchText, tradingCompetitions, usersTotalCount, setIsPopoverOpen, thenaIds, thenaIdTotalCount],
  )

  if (isLoading) {
    return (
      <div
        className='flex h-60 w-[360px] items-center justify-center rounded-md border border-neutral-600 bg-neutral-800 p-3'
        style={{
          width: `${width}px`,
        }}
      >
        <Spinner className='size-10' />
      </div>
    )
  }

  if (!users?.length && !tradingCompetitions?.length && !thenaIds?.length) {
    return (
      <div
        className='max-h-64 w-[360px] overflow-y-hidden rounded-md border border-neutral-600 bg-neutral-800 p-3'
        style={{
          width: `${width}px`,
        }}
      >
        {t('No Users Or Trading Competitions')}
      </div>
    )
  }

  return (
    <div
      className='max-h-[550px] overflow-y-auto rounded-md border border-neutral-600 bg-neutral-800 p-5'
      style={{
        width: `${width}px`,
      }}
    >
      {seeType !== TYPE_SEE.ALL && (
        <TextButton
          className='pb-2 pl-0 pt-0 outline-0 outline-offset-0'
          LeadingIcon={ArrowLeftIcon}
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            setSeeType(TYPE_SEE.ALL)
          }}
        >
          {t('Back')}
        </TextButton>
      )}
      {viewContentByType(seeType)}
    </div>
  )
}

export default memo(SearchContent)
