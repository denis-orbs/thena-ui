import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { PrimaryBadge } from '@/components/badges/Badge'
import { EmphasisButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Popover from '@/components/popover'
import Tabs from '@/components/tabs'
import Toggle from '@/components/toggle'
import { TC_MARKET_TYPES } from '@/constant'
import { SizeTypes } from '@/constant/type'
import { v4Client } from '@/lib/graphql'

import Loading from '../loading'

export const FILTERS = {
  Default: 'Default',
  totalPrize: 'Prize Pool',
  participantCount: 'Attendees',
  entryFee: 'Entry Fee',
}

export const DEFAULT_TAG_ALL_TC = 'All competitions'

const V4_TC_TAGS = gql`
  query V4_TC_TAGS {
    tcTags {
      id
      name
      description
    }
  }
`

const fetchTCTags = async () => {
  try {
    const { tcTags } = await v4Client.request(V4_TC_TAGS)
    return tcTags
  } catch (error) {
    return {}
  }
}

function FilterDropDown({ filter, setFilter, hasFilter }) {
  const t = useTranslations()

  const { data: tcTags, isLoading } = useSWR(['tcTags'], () => fetchTCTags(), {
    refreshInterval: 1000,
  })

  const allTcTags = useMemo(() => [DEFAULT_TAG_ALL_TC, ...(tcTags ?? []).map(tag => tag.name)], [tcTags])

  const FilterButton = useCallback(
    () => (
      <div className='relative'>
        {!!hasFilter && (
          <PrimaryBadge
            className='absolute -right-2 -top-2 z-10 rounded-full p-0 text-[10px] font-medium'
            childrenClassName='bg-primary-600 px-0.5 py-0.5 lg:px-1 lg:py-1 min-w-5 h-5 flex items-center justify-center'
          >
            {hasFilter}
          </PrimaryBadge>
        )}
        <EmphasisButton className=''>{t('Filter')}</EmphasisButton>
      </div>
    ),
    [hasFilter, t],
  )

  return (
    <div>
      <Popover position='left' triggerElement={<FilterButton />}>
        <p className='font-figtree text-xl font-semibold leading-6 text-white'>{t('Filters')}</p>
        <div className='my-2 rounded-lg bg-neutral-900 p-1'>
          <Tabs
            data={[
              {
                label: 'All',
                active: filter.market === TC_MARKET_TYPES.ALL.toLowerCase() || filter.market === null,
                onClickHandler: () => {
                  setFilter({
                    ...filter,
                    market: TC_MARKET_TYPES.ALL.toLowerCase(),
                  })
                },
              },
              {
                label: 'Spot',
                active: filter.market === TC_MARKET_TYPES.SPOT.toLowerCase(),
                onClickHandler: () => {
                  setFilter({
                    ...filter,
                    market: TC_MARKET_TYPES.SPOT.toLowerCase(),
                  })
                },
              },
              {
                label: 'Perpetual',
                active: filter.market === TC_MARKET_TYPES.PERPETUAL.toLowerCase(),
                onClickHandler: () => {
                  setFilter({
                    ...filter,
                    market: TC_MARKET_TYPES.PERPETUAL.toLowerCase(),
                  })
                },
              },
            ]}
            size={SizeTypes.Small}
            itemClassName='text-sm uppercase'
          />
        </div>
        <div className='my-2 flex items-center justify-between space-x-2.5'>
          <span className='whitespace-nowrap text-white'>{t('Sort By')}</span>
          <Dropdown
            className='w-full lg:w-[200px]'
            data={Object.values(FILTERS).map(item => ({
              label: item,
            }))}
            selected={filter.sortBy}
            setSelected={ele => setFilter({ ...filter, sortBy: ele.label })}
          />
        </div>
        <div className='my-2 flex items-center justify-between space-x-2.5'>
          <span className='whitespace-nowrap text-white'>{t('Show')}</span>
          {isLoading ? (
            <Loading />
          ) : (
            <>
              <Dropdown
                className='w-full capitalize lg:w-[200px]'
                data={allTcTags?.map(tagName => ({
                  label: tagName,
                }))}
                selected={filter.tag}
                setSelected={ele => setFilter({ ...filter, tag: ele.label })}
                isLocale={false}
              />
            </>
          )}
        </div>
        <Toggle
          className='my-2 lg:flex'
          checked={filter.free}
          onChange={() => setFilter({ ...filter, free: !filter.free })}
          toggleId='free-join'
          label='Free To Join'
        />
      </Popover>
    </div>
  )
}

export default FilterDropDown
