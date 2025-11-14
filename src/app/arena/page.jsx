'use client'

import { gql } from 'graphql-request'
import { cloneDeep, compact, omit, sortBy } from 'lodash'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody } from '@/components/modal'
import Tabs from '@/components/tabs'
import { INIT_VALUES, TC_MARKET_TYPES, TC_STEPS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useTC } from '@/context/tcContext'
import useWallet from '@/hooks/useWallet'
import { ArenaClient } from '@/lib/graphql'
import { addOrReplaceURLParams, objectToQuery } from '@/lib/tradingCompetition/utils'
import { fromWei, objectDiff } from '@/lib/utils'
import Create from '@/modules/CreateTradingCompetition/Create'
import Preview from '@/modules/CreateTradingCompetition/Preview'

import CompetitionItem from './CompetitionItem'
import FilterDropDown, { DEFAULT_TAG_ALL_TC, FILTERS } from './FilterDropDown'
import NoCompetition from './NoCompetition'
import Loading from '../loading'

const V4_COMPETITION_DATAS = gql`
  query V4_COMPETITION {
    tradingCompetitions(where: { isHidden_eq: false }) {
      name
      entryFeeUpdate
      entryFeeUSD
      market
      id
      bannerUrl
      competitionRules {
        winningToken
        tradingTokens
        startingBalance
        minimumBalance
      }
      prizeUpdate {
        token
        totalPrize
        weights
      }
      totalPrizeUSD
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
        checkMarkIcon
        verifiedAt
        isAdmin
        isSuperAdmin
      }
      tcAddress
      tcTagAssignments {
        id
        tcTag {
          description
          id
          name
        }
      }
    }
  }
`

const fetchCompetition = async () => {
  try {
    const { tradingCompetitions } = await ArenaClient.request(V4_COMPETITION_DATAS)
    return tradingCompetitions
  } catch (error) {
    return { error: true }
  }
}

const defaultFilter = {
  market: 'all',
  free: false,
  tag: DEFAULT_TAG_ALL_TC,
}

export default function ArenaPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const { account } = useWallet()
  const { isAllowed } = useTC()

  // const handleCreateTC = async (protocolFee, protocolFeeToken, mainData) => {
  //   if (fromWei(protocolFee, protocolFeeToken?.decimals).gt(protocolFeeToken?.balance)) {
  //     warnToast('Insufficient [Asset] Balance', { symbol: protocolFeeToken?.symbol })
  //   } else {
  //     // eslint-disable-next-line unused-imports/no-unused-vars
  //     const { tag, ...dataSubmit } = mainData
  //     // const txHash = await onCreate(dataSubmit)
  //     const txHash = '0x6a76e10a7d0903ba844394bf41f55b37d1eb1a02c8a326bf31615d575aafefda'
  //     // if (!txHash) {
  //     //   setShowModalCreateCompetition(true)
  //     //   setStep(step - 1)
  //     // } else {
  //     //   setShowModalCreateCompetition(false)
  //     //   setData(INIT_VALUES)
  //     //   setStep(0)
  //     // }
  //     // setShowPreview(false)
  //     if (txHash) {
  //       const tcId = await handleGetTCId(txHash)
  //       if (tcId) {
  //         // await addTCTemporary(tcId, account)
  //         if (data?.tag?.id) {
  //           await assignTCTag(
  //             { tradingCompetitionId: tcId, tcTagId: data.tag.id },
  //             () => {
  //               console.log(123)
  //             },
  //             () => {
  //               console.log(2222)
  //             },
  //           )
  //         }
  //       }
  //       // closeTxnModal()
  //       // return router.push(`/arena/trading-competitions/${tcId}`)
  //     }
  //   }
  // }

  const { data: dataCompetitions, isLoading } = useSWR('competition api', () => fetchCompetition())

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

  const [filter, setFilter] = useState({
    type: searchParams.get('type') ?? null,
    market: searchParams.get('market') ?? 'all',
    sortBy: searchParams.get('sortBy') ?? 'Default',
    free: !!searchParams.get('free'),
    status: searchParams.get('status') ?? null,
    tag: searchParams.get('tag') ?? DEFAULT_TAG_ALL_TC,
  })

  const hasFilter = useMemo(() => objectDiff(omit(filter, ['type', 'status', 'sortBy']), defaultFilter), [filter])

  const competitions = useMemo(
    () =>
      (Array.isArray(dataCompetitions) ? dataCompetitions : []).map(comp => ({
        ...comp,
        prizeUpdate: {
          ...comp.prizeUpdate,
          token: comp.prizeUpdate.token.map(token => {
            const asset = assets.find(ele => ele.address.toLowerCase() === token.toLowerCase())
            return asset
          }),
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
    if (!!filter.market && filter.market !== TC_MARKET_TYPES.ALL.toLowerCase()) {
      result = result.filter(item => item.market.toLowerCase() === filter.market.toLowerCase())
    }
    if (filter.tag && filter.tag !== DEFAULT_TAG_ALL_TC) {
      result = result.filter(item =>
        item.tcTagAssignments.find(tcTagAssigned => tcTagAssigned.tcTag.name === filter.tag),
      )
    }
    switch (filter.sortBy) {
      case FILTERS.entryFee:
        result = sortBy(result, o => Number(o.entryFeeUSD))
        break

      case FILTERS.totalPrize:
        result = sortBy(result, o => -Number(o.totalPrizeUSD))
        break

      case FILTERS.participantCount:
        result = sortBy(result, o => -parseInt(o.participantCount, 10))
        break

      default:
        result = cloneDeep(result)
    }

    let tcUpcoming = result.filter(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
    let tcLive = result.filter(
      item =>
        item.timestamp.endTimestamp >= new Date().getTime() / 1000 &&
        item.timestamp.startTimestamp <= new Date().getTime() / 1000,
    )
    const tcEnded = result.filter(item => item.timestamp.endTimestamp < new Date().getTime() / 1000)

    let tcJoined = result.filter(item =>
      item.participants?.find(participant => participant?.participant.id === account?.toLowerCase()),
    )

    let tcHosted = result.filter(item => account?.toLowerCase() === item.owner.id)

    const sortUpcomingWhenDefault = array => {
      let res = [...array]
      res.sort((a, b) => a.timestamp.startTimestamp - b.timestamp.startTimestamp)
      const tcUpcomingTop = res
        .filter(tc => tc.owner.isAdmin || tc.owner.isSuperAdmin || tc.owner.isVerified)
        .sort((a, b) => Number(a.totalPrizeUSD) - Number(b.totalPrizeUSD))
      res = res.filter(tc => !tcUpcomingTop.map(item => item.id).includes(tc.id))
      res = [...tcUpcomingTop, ...res]
      return res
    }

    const sortLiveWhenDefault = array => {
      let res = [...array]
      res.sort((a, b) => a.timestamp.endTimestamp - b.timestamp.endTimestamp)
      const tcLiveTop = res
        .filter(tc => tc.owner.isAdmin || tc.owner.isSuperAdmin || tc.owner.isVerified)
        .sort((a, b) => Number(a.totalPrizeUSD) - Number(b.totalPrizeUSD))
      res = res.filter(tc => !tcLiveTop.map(item => item.id).includes(tc.id))
      res = [...tcLiveTop, ...res]
      return res
    }

    if (filter.sortBy === FILTERS.Default) {
      tcUpcoming = sortUpcomingWhenDefault(tcUpcoming)
      tcLive = sortLiveWhenDefault(tcLive)
      tcEnded.sort((a, b) => b.timestamp.endTimestamp - a.timestamp.endTimestamp)

      // tcJoined
      let tcJoinedUpcoming = tcJoined.filter(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
      tcJoinedUpcoming = sortUpcomingWhenDefault(tcJoinedUpcoming)

      let tcJoinedLive = tcJoined.filter(
        item =>
          item.timestamp.endTimestamp >= new Date().getTime() / 1000 &&
          item.timestamp.startTimestamp <= new Date().getTime() / 1000,
      )
      tcJoinedLive = sortLiveWhenDefault(tcJoinedLive)

      const tcJoinedEnd = tcJoined.filter(
        item =>
          item.timestamp.endTimestamp < new Date().getTime() / 1000 &&
          item.participants?.find(participant => participant?.participant.id === account?.toLowerCase()),
      )
      tcJoined = [...tcJoinedUpcoming, ...tcJoinedLive, ...tcJoinedEnd]

      // tcHosted
      let tcHostedUpcoming = tcHosted.filter(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
      tcHostedUpcoming = sortUpcomingWhenDefault(tcHostedUpcoming)

      let tcHostedLive = tcHosted.filter(
        item =>
          item.timestamp.endTimestamp >= new Date().getTime() / 1000 &&
          item.timestamp.startTimestamp <= new Date().getTime() / 1000,
      )
      tcHostedLive = sortLiveWhenDefault(tcHostedLive)

      const tcHostedEnd = tcHosted.filter(item => item.timestamp.endTimestamp < new Date().getTime() / 1000)
      tcHosted = [...tcHostedUpcoming, ...tcHostedLive, ...tcHostedEnd]
    }

    switch (searchParams.get('type')) {
      case 'upcoming':
        result = cloneDeep(tcUpcoming)
        break

      case 'joined':
        result = cloneDeep(tcJoined)
        break

      case 'hosted':
        result = cloneDeep(tcHosted)
        break

      case 'ended':
        result = cloneDeep(tcEnded)
        break

      case 'live':
        result = cloneDeep(tcLive)
        break

      default:
        result = [...tcUpcoming, ...tcLive, ...tcEnded]
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

    return result
  }, [filter.type, filter.market, filter.sortBy, filter.free, competitions, searchParams, account, filter.tag])

  const subTabs = useMemo(
    () =>
      compact([
        {
          label: 'All',
          active: filter.type === 'all',
          onClickHandler: () => {
            if (filter.type !== 'all') {
              setFilter({
                ...filter,
                type: 'all',
                status: null,
              })
            }
          },
          isLink: filter.type !== 'all',
          href: objectToQuery({
            ...filter,
            type: 'all',
            status: null,
          }),
        },
        showTab.upcoming
          ? {
              label: 'Upcoming',
              active: filter.type === 'upcoming',
              onClickHandler: () => {
                if (filter.type !== 'upcoming') {
                  setFilter({
                    ...filter,
                    status: null,
                    type: 'upcoming',
                  })
                }
              },
              isLink: filter.type !== 'upcoming',
              href: objectToQuery({
                ...filter,
                type: 'upcoming',
                status: null,
              }),
            }
          : undefined,
        showTab.live
          ? {
              label: 'Live',
              active: filter.type === 'live',
              onClickHandler: () => {
                if (filter.type !== 'live') {
                  setFilter({
                    ...filter,
                    type: 'live',
                    status: null,
                  })
                }
              },
              isLink: filter.type !== 'live',
              href: objectToQuery({
                ...filter,
                type: 'live',
                status: null,
              }),
            }
          : undefined,
        showTab.ended
          ? {
              label: 'Ended',
              active: filter.type === 'ended',
              onClickHandler: () => {
                if (filter.type !== 'ended') {
                  setFilter({
                    ...filter,
                    type: 'ended',
                  })
                }
              },
              isLink: filter.type !== 'ended',
              href: objectToQuery({
                ...filter,
                type: 'end',
                status: null,
              }),
            }
          : undefined,
        showTab.joined
          ? {
              label: 'Joined',
              active: filter.type === 'joined',
              onClickHandler: () => {
                if (filter.type !== 'joined') {
                  setFilter({
                    ...filter,
                    type: 'joined',
                  })
                }
              },
              isLink: filter.type !== 'joined',
              href: objectToQuery({
                ...filter,
                type: 'joined',
              }),
            }
          : undefined,
        showTab.hosted
          ? {
              label: 'Hosted',
              active: filter.type === 'hosted',
              onClickHandler: () => {
                if (filter.type !== 'hosted') {
                  setFilter({
                    ...filter,
                    type: 'hosted',
                  })
                }
              },
              isLink: filter.type !== 'hosted',
              href: objectToQuery({
                ...filter,
                type: 'hosted',
              }),
            }
          : undefined,
      ]),
    [showTab.upcoming, showTab.live, showTab.joined, showTab.hosted, showTab.ended, filter],
  )

  const subFilterTabs = useMemo(
    () =>
      compact([
        showSubFilterTab.upcoming
          ? {
              label: 'Upcoming',
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
              label: 'Live',
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
              label: 'Ended',
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
    [filter, showSubFilterTab.ended, showSubFilterTab.live, showSubFilterTab.upcoming],
  )

  const filterTabToLabel = useMemo(() => {
    switch (filter.type) {
      case 'upcoming':
        return `${t('Upcoming')} ${t('Competitions')}`
      case 'live':
        return `${t('Live')} ${t('Competitions')}`
      case 'ended':
        return `${t('Ended')} ${t('Competitions')}`
      case 'hosted':
        return `${t('Hosted')} ${t('Competitions')}`
      case 'joined':
        return `${t('Joined')} ${t('Competitions')}`
      default:
        return t('All Competitions')
    }
  }, [filter.type, t])

  useEffect(() => {
    addOrReplaceURLParams('type', filter.type !== 'all' ? filter.type : null)
    addOrReplaceURLParams('tag', filter.tag !== DEFAULT_TAG_ALL_TC ? filter.tag : null)
    addOrReplaceURLParams('free', filter.free ? true : null)
    addOrReplaceURLParams('market', filter.market !== TC_MARKET_TYPES.ALL.toLowerCase() ? filter.market : null)
    addOrReplaceURLParams('sortBy', filter.sortBy !== 'Default' ? filter.sortBy : null)
    addOrReplaceURLParams('status', filter.type === 'joined' || filter.type === 'hosted' ? filter.status : null)
    addOrReplaceURLParams('tag', filter.tag !== DEFAULT_TAG_ALL_TC ? filter.tag : null)
  }, [filter.free, filter.market, filter.tag, filter.sortBy, filter.type, filter.status])

  useEffect(() => {
    const saveToSessionStorage = (key, value) => {
      if (value) {
        sessionStorage.setItem(key, value)
      } else {
        sessionStorage.removeItem(key)
      }
    }

    saveToSessionStorage('type', filter.type !== 'all' ? filter.type : null)
    saveToSessionStorage('free', filter.free && true)
    saveToSessionStorage('market', filter.market !== TC_MARKET_TYPES.ALL.toLowerCase() && filter.market)
    saveToSessionStorage('sortBy', filter.sortBy !== 'Default' && filter.sortBy)
    saveToSessionStorage('status', filter.type === 'joined' || filter.type === 'hosted' ? filter.status : null)
    saveToSessionStorage('tag', filter.tag !== DEFAULT_TAG_ALL_TC && filter.tag)
  }, [filter.free, filter.tag, filter.market, filter.sortBy, filter.status, filter.type])

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
          tag: searchParams.get('tag') ? searchParams.get('tag') : DEFAULT_TAG_ALL_TC,
        })
        setFirstTime(false)
      }
      setShowTab({
        all: true,
        ended: competitions?.some(
          item =>
            account &&
            item.timestamp.endTimestamp < new Date().getTime() / 1000 &&
            item.participants?.find(participant => participant?.participant.id === account.toLowerCase()),
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

  if (isLoading) return <Loading />

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col justify-between gap-4'>
        <div className='flex flex-col justify-between gap-2 sm:flex-row'>
          <h2>{t('Competitions')}</h2>
        </div>
        <div className='flex flex-col justify-between gap-4 lg:w-auto lg:flex-row lg:gap-2'>
          <div className='flex gap-4'>
            <div className='w-fit rounded-lg bg-neutral-900 p-1'>
              <Tabs data={subTabs} itemClassName='text-sm' />
            </div>
            <FilterDropDown filter={filter} setFilter={setFilter} hasFilter={hasFilter} />
          </div>
          {Boolean(isAllowed) && (
            <PrimaryButton onClick={() => setShowModalCreateCompetition(true)}>
              {t('Create Trading Competition')}
            </PrimaryButton>
          )}
        </div>
      </div>
      <div className='w-full'>
        <h3>{filterTabToLabel}</h3>
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
