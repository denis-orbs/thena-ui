'use client'

import { gql } from 'graphql-request'
import { cloneDeep, compact, sortBy } from 'lodash'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { PrimaryButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Modal, { ModalBody } from '@/components/modal'
import Tabs from '@/components/tabs'
import { INIT_VALUES, TC_STEPS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useTC } from '@/context/tcContext'
import { v4Client } from '@/lib/graphql'
import { addOrReplaceURLParams, objectToQuery } from '@/lib/tradingCompetition/utils'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import Create from '@/modules/CreateTradingCompetition/Create'
import Preview from '@/modules/CreateTradingCompetition/Preview'

import CompetitionItem from './CompetitionItem'
import FilterDropDown, { FILTERS } from './FilterDropDown'
import NoCompetition from './NoCompetition'
import Loading from '../loading'

const V4_COMPETITION_DATAS = gql`
  query V4_COMPETITION {
    tradingCompetitions(where: { isHidden_eq: false }) {
      name
      entryFee
      market
      id
      bannerUrl
      competitionRules {
        winningToken
        tradingTokens
        startingBalance
      }
      prize {
        totalPrize
        token
        weights
      }
      timestamp {
        endTimestamp
        startTimestamp
        registrationStart
        registrationEnd
      }
      participants {
        id
        participant {
          id
        }
      }
      maxParticipants
      participantCount
      owner {
        id
        isVerified
        avatar
        username
        nameColor
      }
      tradingCompetitionSpot
    }
  }
`

const fetchCompetition = async () => {
  try {
    const { tradingCompetitions } = await v4Client.request(V4_COMPETITION_DATAS)
    return tradingCompetitions
  } catch (error) {
    return { error: true }
  }
}

export default function ArenaPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const { account } = useWallet()
  const { isAllowed } = useTC()

  const { data: dataCompetitions } = useSWR('competition api', () => fetchCompetition())

  const assets = useAssets()

  const [firstTime, setFirstTime] = useState(true)

  const [showTab, setShowTab] = useState({
    upcoming: false,
    all: false,
    joined: false,
    live: false,
    hosted: false,
    ended: false,
  })

  const [showSubFilterTab, setShowSubFilterTab] = useState({
    upcoming: false,
    live: false,
    ended: false,
  })

  const [showModalCreateCompetition, setShowModalCreateCompetition] = useState(false)
  const [step, setStep] = useState(0)
  const [data, setData] = useState(INIT_VALUES)
  const [showPreview, setShowPreview] = useState(true)

  const [searchText, setSearchText] = useState(searchParams.get('search') ?? undefined)

  const [filter, setFilter] = useState({
    type: searchParams.get('type') ?? null,
    market: searchParams.get('market') ?? null,
    sortBy: searchParams.get('sortBy') ?? 'Default',
    free: !!searchParams.get('free'),
    status: searchParams.get('status') ?? null,
  })

  const competitions = useMemo(
    () =>
      (Array.isArray(dataCompetitions) ? dataCompetitions : []).map(comp => ({
        ...comp,
        prize: {
          ...comp.prize,
          token: assets.find(ele => ele.address.toLowerCase() === comp.prize.token.toLowerCase()),
        },
        competitionRules: {
          ...comp.competitionRules,
          winningToken: assets.find(
            ele => ele.address.toLowerCase() === comp.competitionRules.winningToken.toLowerCase(),
          ),
          tradingTokens: assets.filter(ele =>
            comp.competitionRules.tradingTokens.map(sub => sub.toLowerCase()).includes(ele.address),
          ),
        },
      })),
    [assets, dataCompetitions],
  )

  const filterCompetitions = useMemo(() => {
    if (!filter.type) {
      return []
    }
    let result = cloneDeep(competitions || []) ?? []
    if (!!filter.market && filter.market !== 'all') {
      result = result.filter(item => item.market.toLowerCase() === filter.market.toLowerCase())
    }
    switch (filter.sortBy) {
      case FILTERS.entryFee:
        result = sortBy(result, o => parseInt(o.entryFee, 10))
        break

      case FILTERS.totalPrize:
        result = sortBy(result, o => -parseInt(o.prize.totalPrize, 10))
        break

      case FILTERS.participantCount:
        result = sortBy(result, o => -parseInt(o.participantCount, 10))
        break

      default:
        result = cloneDeep(result)
    }

    switch (searchParams.get('type')) {
      case 'upcoming':
        result = result.filter(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
        break

      case 'joined':
        result = result.filter(item =>
          item.participants?.find(participant => participant?.participant.id === account?.toLowerCase()),
        )
        break

      case 'hosted':
        result = result.filter(item => account?.toLowerCase() === item.owner.id)
        break

      case 'ended':
        result = result.filter(
          item =>
            item.timestamp.endTimestamp < new Date().getTime() / 1000 &&
            item?.participant?.id === account?.toLowerCase(),
        )
        break

      case 'live':
        result = result.filter(
          item =>
            item.timestamp.endTimestamp >= new Date().getTime() / 1000 &&
            item.timestamp.startTimestamp <= new Date().getTime() / 1000,
        )
        break

      default:
        result = cloneDeep(result)
    }

    switch (searchParams.get('status')) {
      case 'upcoming':
        result = result.filter(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
        break

      case 'ended':
        result = result.filter(item => item.timestamp.endTimestamp < new Date().getTime() / 1000)
        break

      case 'live':
        result = result.filter(
          item =>
            item.timestamp.endTimestamp >= new Date().getTime() / 1000 &&
            item.timestamp.startTimestamp <= new Date().getTime() / 1000,
        )
        break

      default:
        result = cloneDeep(result)
    }

    if (filter.free) {
      result = result.filter(item => fromWei(item.entryFee).isZero())
    }

    return !searchText?.trim().length
      ? result
      : result.filter(
          item =>
            item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchText.toLowerCase()),
        )
  }, [filter.type, filter.market, filter.sortBy, filter.free, competitions, searchParams, searchText, account])

  const subTabs = useMemo(
    () =>
      compact([
        showTab.upcoming
          ? {
              label: t('Upcoming'),
              active: filter.type === 'upcoming',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  status: null,
                  type: 'upcoming',
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                type: 'upcoming',
                status: null,

                search: searchText,
              }),
            }
          : undefined,
        showTab.live
          ? {
              label: t('Live'),
              active: filter.type === 'live',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  type: 'live',
                  status: null,
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                type: 'live',
                search: searchText,
                status: null,
              }),
            }
          : undefined,
        {
          label: t('All'),
          active: filter.type === 'all',
          onClickHandler: () => {
            setFilter({
              ...filter,
              type: 'all',
              status: null,
            })
          },
          isLink: true,
          href: objectToQuery({
            ...filter,
            type: 'all',
            search: searchText,
            status: null,
          }),
        },
        showTab.joined
          ? {
              label: t('Joined'),
              active: filter.type === 'joined',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  type: 'joined',
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                type: 'joined',
                search: searchText,
              }),
            }
          : undefined,
        showTab.hosted
          ? {
              label: t('Hosted'),
              active: filter.type === 'hosted',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  type: 'hosted',
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                type: 'hosted',
                search: searchText,
              }),
            }
          : undefined,

        showTab.ended
          ? {
              label: t('Ended'),
              active: filter.type === 'ended',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  type: 'ended',
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                type: 'end',
                search: searchText,
                status: null,
              }),
            }
          : undefined,
      ]),
    [showTab.upcoming, showTab.live, showTab.joined, showTab.hosted, showTab.ended, t, filter, searchText],
  )

  const subFilterTabs = useMemo(
    () =>
      compact([
        showSubFilterTab.upcoming
          ? {
              label: t('Upcoming'),
              active: filter.status === 'upcoming',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  status: 'upcoming',
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                status: 'upcoming',
              }),
            }
          : undefined,
        showSubFilterTab.live
          ? {
              label: t('Live'),
              active: filter.status === 'live',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  status: 'live',
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                status: 'live',
              }),
            }
          : undefined,
        showSubFilterTab.ended
          ? {
              label: t('Ended'),
              active: filter.status === 'ended',
              onClickHandler: () => {
                setFilter({
                  ...filter,
                  status: 'ended',
                })
              },
              isLink: true,
              href: objectToQuery({
                ...filter,
                status: 'end',
              }),
            }
          : undefined,
      ]),
    [filter, showSubFilterTab.ended, showSubFilterTab.live, showSubFilterTab.upcoming, t],
  )

  useEffect(() => {
    addOrReplaceURLParams('type', filter.type !== 'all' ? filter.type : null)
    addOrReplaceURLParams('search', searchText || null)
    addOrReplaceURLParams('free', filter.free ? true : null)
    addOrReplaceURLParams('market', filter.market !== 'all' ? filter.market : null)
    addOrReplaceURLParams('sortBy', filter.sortBy !== 'Default' ? filter.sortBy : null)
    addOrReplaceURLParams('status', filter.type === 'joined' || filter.type === 'hosted' ? filter.status : null)
  }, [filter.free, filter.market, filter.sortBy, searchText, filter.type, filter.status])

  useEffect(() => {
    const saveToSessionStorage = (key, value) => {
      if (value) {
        sessionStorage.setItem(key, value)
      } else {
        sessionStorage.removeItem(key)
      }
    }

    saveToSessionStorage('type', filter.type !== 'all' ? filter.type : null)
    saveToSessionStorage('search', searchText?.length && searchText)
    saveToSessionStorage('free', filter.free && true)
    saveToSessionStorage('market', filter.market !== 'all' && filter.market)
    saveToSessionStorage('sortBy', filter.sortBy !== 'Default' && filter.sortBy)
    saveToSessionStorage('status', filter.type === 'joined' || filter.type === 'hosted' ? filter.status : null)
  }, [filter.free, filter.market, filter.sortBy, filter.status, filter.type, searchText])

  useEffect(() => {
    if (competitions.length) {
      const hasUpcoming = competitions?.some(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
      if (firstTime) {
        addOrReplaceURLParams(
          'type',
          searchParams.get('type') ? searchParams.get('type') : hasUpcoming ? 'upcoming' : null,
        )
        setFilter({
          ...filter,
          type: searchParams.get('type') ? searchParams.get('type') : hasUpcoming ? 'upcoming' : 'all',
        })
        setFirstTime(false)
      }
      setShowTab({
        all: true,
        ended: competitions?.some(
          item =>
            account &&
            item.timestamp.endTimestamp < new Date().getTime() / 1000 &&
            item.participant?.id === account.toLowerCase(),
        ),
        hosted: competitions?.some(item => account && account.toLowerCase() === item.owner.id),
        joined: competitions?.some(
          item =>
            account && item.participants?.find(participant => participant?.participant.id === account.toLowerCase()),
        ),
        live: competitions?.some(
          item =>
            item.timestamp.startTimestamp <= new Date().getTime() / 1000 &&
            item.timestamp.endTimestamp >= new Date().getTime() / 1000,
        ),
        upcoming: hasUpcoming,
      })

      setShowSubFilterTab({
        ended: competitions?.some(
          item =>
            account &&
            (account.toLowerCase() === item.owner.id ||
              item.participants?.find(participant => participant?.participant.id === account.toLowerCase())) &&
            item.timestamp.endTimestamp < new Date().getTime() / 1000,
        ),
        live: competitions?.some(
          item =>
            account &&
            (account.toLowerCase() === item.owner.id ||
              item.participants?.find(participant => participant?.participant.id === account.toLowerCase())) &&
            item.timestamp.startTimestamp <= new Date().getTime() / 1000 &&
            item.timestamp.endTimestamp >= new Date().getTime() / 1000,
        ),
        upcoming: competitions?.some(
          item =>
            account &&
            (account.toLowerCase() === item.owner.id ||
              item.participants?.find(participant => participant?.participant.id === account.toLowerCase())) &&
            item.timestamp.startTimestamp > new Date().getTime() / 1000,
        ),
      })
    }
  }, [account, competitions, firstTime, filter, searchParams])

  if (!filterCompetitions.length && !filter.type) return <Loading />

  return (
    <div className='mt-6 flex flex-col gap-4'>
      <div className='flex flex-col justify-between gap-4'>
        <div className='flex justify-between'>
          <h2>{t('Competitions')}</h2>
          {Boolean(isAllowed) && (
            <PrimaryButton onClick={() => setShowModalCreateCompetition(true)}>
              {t('Create Trading Competition')}
            </PrimaryButton>
          )}
        </div>
        <div className='flex flex-col justify-between gap-4 lg:w-auto lg:flex-row lg:gap-2'>
          <div className='rounded-lg bg-neutral-900 p-1 '>
            <Tabs data={subTabs} itemClassName='text-sm' />
          </div>
          <div className='flex gap-4'>
            <SearchInput
              className='h-11 w-full lg:w-[336px]'
              classNames={{ input: 'h-11' }}
              val={searchText}
              setVal={setSearchText}
            />
            <FilterDropDown filter={filter} setFilter={setFilter} />
          </div>
        </div>
      </div>
      <div className='w-full'>
        <h3>{t('All Competitions')}</h3>
      </div>
      {filterCompetitions?.length ? (
        <>
          {(filter.type === 'joined' || filter.type === 'hosted') && (
            <Tabs data={subFilterTabs} itemClassName='text-xs w-18' className='m-1 flex flex-1 justify-start' />
          )}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filterCompetitions.map(item => (
              <CompetitionItem competition={item} key={item.id} />
            ))}
          </div>
        </>
      ) : (
        <NoCompetition />
      )}
      {showModalCreateCompetition && (
        <Create
          data={data}
          setData={setData}
          step={step}
          setStep={setStep}
          showModalCreateCompetition={showModalCreateCompetition}
          handleClose={() => {
            setShowModalCreateCompetition(false)
            if (step === TC_STEPS.length - 1) {
              setShowPreview(true)
            }
          }}
        />
      )}
      {step === TC_STEPS.length && (
        <Modal
          isOpen={showPreview}
          closeModal={() => {}}
          showIconX={false}
          width='75%'
          style={{
            overflowY: 'hidden',
          }}
        >
          <ModalBody>
            <Preview
              data={data}
              step={step}
              setStep={setStep}
              setShowModalCreateCompetition={setShowModalCreateCompetition}
              setShowPreview={setShowPreview}
              setData={setData}
            />
          </ModalBody>
        </Modal>
      )}
    </div>
  )
}
