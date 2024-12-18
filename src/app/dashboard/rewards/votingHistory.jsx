import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'use-intl'

import { TertiaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import { Collapse } from '@/components/collapse'
import Highlight from '@/components/highlight'
import Input from '@/components/input'
import Skeleton from '@/components/skeleton'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { LOCALES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { fetchVotingHistory } from '@/lib/api'
import { cn, formatAmount } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'
import { ArrowLeftIcon, ChevronDownIcon, InfoCircleWhite, InfoIcon, XIcon } from '@/svgs'

import VotingHistoryTable from './VotingHistoryTable'

const getTimeUTC = (unixTime, locale) => {
  const date = new Date(unixTime * 1000)
  const year = date.getUTCFullYear()
  const month = date.toLocaleString(locale === LOCALES.zh ? 'zh-CN' : 'en-US', { month: 'short', timeZone: 'UTC' })
  const day = date.getUTCDate()

  return `${month} ${day}, ${year}`
}

function PaginateCell({ children, className, active, onClick, disabled }) {
  return (
    <li
      role='presentation'
      className={cn(
        'flex h-8 w-fit min-w-8 items-center justify-center stroke-neutral-300 px-[2px] text-neutral-300',
        'hover:bg-neutral-700 hover:stroke-neutral-200 hover:text-neutral-200',
        'outline outline-2 outline-offset-4 outline-transparent',
        'cursor-pointer rounded transition-all duration-150 ease-out',
        'text-sm active:outline-focus',
        active && 'bg-neutral-800',
        disabled && 'cursor-not-allowed hover:bg-inherit active:outline-none active:outline-transparent',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </li>
  )
}

function Popover({ inputPage = '', setInputPage, showPopover = false, setShowPopover, pageCount, onClick = () => {} }) {
  return (
    <div
      data-popover
      id='popover-default-1'
      role='tooltip'
      className={`absolute ${
        showPopover ? '' : 'invisible opacity-0'
        // eslint-disable-next-line max-len
      } left-1/2 top-12 z-10 inline-block -translate-x-1/2 rounded-lg border border-neutral-600 bg-neutral-800 text-sm text-neutral-500 shadow-sm transition-opacity duration-300 lg:left-1/2`}
    >
      <div className='flex items-center justify-between rounded-t-lg border-b border-neutral-600 bg-neutral-700 px-3 py-2'>
        <TextSubHeading className='text-nowrap text-white'>Go to page</TextSubHeading>
        <TextIconButton
          Icon={XIcon}
          classNames='p-[2px]'
          className='!h-5 !w-5 stroke-neutral-400'
          onClick={() => {
            setShowPopover(false)
            setInputPage('')
          }}
        />
      </div>
      <div className='flex flex-row items-center justify-between gap-2 px-3 py-2'>
        <Input
          className='w-[100px]'
          classNames={{
            input: 'p-2',
          }}
          autoFocus
          type='number'
          val={inputPage}
          onChange={e => {
            if (e.target.value === '') {
              setInputPage('')
            } else {
              setInputPage(Math.min(Math.max(Number(e.target.value), 1), pageCount))
            }
            e.stopPropagation()
          }}
        />
        <TertiaryButton className='h-[42px]' onClick={onClick}>
          Go
        </TertiaryButton>
      </div>
      <div data-popper-arrow />
    </div>
  )
}

function Paging({
  currentPage,
  setCurrentPage,
  pageSize = 10,
  totalItems = undefined,
  limitPage = undefined,
  totalRecord,
  showPopoverPagination = false,
}) {
  const [inputPage, setInputPage] = useState(undefined)
  const [showPopover, setShowPopover] = useState(false)

  const pageCount = useMemo(() => {
    const count = Math.ceil((totalItems || totalRecord) / pageSize)

    return limitPage && limitPage < count ? limitPage : count
  }, [totalRecord, limitPage, pageSize, totalItems])

  if (pageSize >= totalRecord) return <></>

  return (
    <div className='flex justify-center sm:justify-end'>
      <ul className='relative flex w-fit items-center justify-center gap-2 px-5 py-3 lg:justify-end'>
        <PaginateCell
          onClick={() => {
            if (currentPage !== 1) {
              setCurrentPage(Math.max(currentPage - 1, 1))
            }
          }}
          disabled={currentPage === 1}
        >
          <ArrowLeftIcon className={`h-4 w-4${currentPage === 1 ? ' stroke-gray-700' : ''}`} />
        </PaginateCell>
        {pageCount < 6 &&
          new Array(pageCount).fill(0).map((item, idx) => (
            <PaginateCell
              key={`paginate-${idx}`}
              active={currentPage === idx + 1}
              onClick={() => {
                setCurrentPage(idx + 1)
              }}
            >
              {idx + 1}
            </PaginateCell>
          ))}
        {pageCount >= 6 && (
          <>
            <PaginateCell
              active={currentPage === 1}
              onClick={() => {
                setCurrentPage(1)
              }}
            >
              1
            </PaginateCell>
            <PaginateCell
              active={currentPage === 2}
              onClick={() => {
                setCurrentPage(2)
              }}
            >
              2
            </PaginateCell>
            {currentPage > 3 && (
              <PaginateCell
                onClick={() => {
                  if (showPopoverPagination) {
                    setShowPopover(true)
                  } else {
                    setCurrentPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
                  }
                }}
              >
                ...
              </PaginateCell>
            )}
            {currentPage > 2 && currentPage < pageCount - 1 && (
              <PaginateCell
                active
                onClick={() => {
                  setCurrentPage(currentPage)
                }}
              >
                {currentPage}
              </PaginateCell>
            )}
            {currentPage < pageCount - 2 && (
              <PaginateCell
                onClick={() => {
                  if (showPopoverPagination) {
                    setShowPopover(true)
                  } else {
                    setCurrentPage(currentPage > pageCount - 2 ? currentPage - 1 : currentPage + 1)
                  }
                }}
              >
                ...
              </PaginateCell>
            )}
            <PaginateCell
              active={currentPage === pageCount - 1}
              onClick={() => {
                setCurrentPage(pageCount - 1)
              }}
            >
              {pageCount - 1}
            </PaginateCell>
            <PaginateCell
              active={currentPage === pageCount}
              onClick={() => {
                setCurrentPage(pageCount)
              }}
            >
              {pageCount}
            </PaginateCell>
          </>
        )}
        <PaginateCell
          onClick={() => {
            if (currentPage !== pageCount) {
              setCurrentPage(Math.min(currentPage + 1, pageCount))
            }
          }}
          disabled={currentPage === pageCount}
        >
          <ArrowLeftIcon className={`h-4 w-4 rotate-180${currentPage === pageCount ? ' stroke-gray-700' : ''}`} />
        </PaginateCell>
        {showPopoverPagination && (
          <Popover
            inputPage={inputPage}
            setInputPage={setInputPage}
            setCurrentPage={setCurrentPage}
            showPopover={showPopover}
            setShowPopover={setShowPopover}
            pageCount={pageCount}
            onClick={() => {
              const newPage = Number(inputPage)
              if (newPage && newPage !== currentPage) {
                setCurrentPage(newPage)
              }
              setShowPopover(false)
              setInputPage('')
            }}
          />
        )}
      </ul>
    </div>
  )
}

function TitleEpoch({ epoch, open }) {
  const { locale } = useLocaleSettings()
  const assets = useAssets()
  const t = useTranslations()

  const timePeriod = useMemo(() => {
    const { epochStartTimestamp } = epoch
    const period = +epochStartTimestamp + 7 * 24 * 60 * 60

    const startTime = getTimeUTC(epochStartTimestamp, locale)
    const endTime = getTimeUTC(period, locale)
    return [startTime, endTime]
  }, [epoch, locale])

  const epochNumber = useMemo(() => {
    const epoch5 = 1675900800
    return Math.floor((+epoch.epochStartTimestamp - epoch5) / 604800) + 5
  }, [epoch.epochStartTimestamp])

  const finalData = useMemo(() => {
    const { votes } = epoch

    const tokenRewards = {}

    votes.forEach(vote => {
      vote.poolVotes.forEach(poolVote => {
        poolVote.rewards.forEach(reward => {
          const { token, amount } = reward

          const asset = assets.find(item => item.address.toLowerCase() === token.toLowerCase())

          if (!tokenRewards[token]) {
            tokenRewards[token] = {
              ...asset,
              amount: 0,
            }
          }

          tokenRewards[token].amount += parseFloat(amount)
        })
      })
    })

    const rewardUsd = (Object.values(tokenRewards) || []).reduce((sum, token) => sum + token.amount * token.price, 0)

    return {
      ...epoch,
      totalRewards: Object.values(tokenRewards),
      rewardUsd,
    }
  }, [epoch, assets])

  return (
    <div className='flex w-full flex-col justify-between gap-4 px-4 py-5 lg:flex-row lg:px-6'>
      <div className='flex flex-[10] flex-row justify-between lg:flex-[2.5]'>
        <div className='flex flex-row gap-1'>
          <TextHeading className='text-xl'>{t('Epoch')}</TextHeading>
          <Paragraph className='text-xl'>{formatAmount(epochNumber)}</Paragraph>
        </div>
        <div className={cn('h-4 w-5 lg:hidden', open ? 'rotate-180' : 'rotate-0')}>
          <ChevronDownIcon />
        </div>
      </div>
      <div className='grid w-full grid-cols-2 gap-y-4 lg:flex-[7.5] lg:grid-cols-4'>
        <div className='flex flex-col'>
          <TextHeading>{t('Time Period')}</TextHeading>
          <Paragraph className='hidden sm:block'>{`${timePeriod[0]} - ${timePeriod[1]}`}</Paragraph>
          <Paragraph className='hidden max-sm:block'>{timePeriod[0]}</Paragraph>
          <Paragraph className='hidden max-sm:block'>- {timePeriod[1]}</Paragraph>
        </div>
        <div className='flex flex-col lg:items-end'>
          <TextHeading>{t('My Votes')}</TextHeading>
          <Paragraph>{formatAmount(epoch?.totalVetheBalance)}</Paragraph>
        </div>
        <div className='flex flex-col lg:items-end'>
          <TextHeading>{t('Total Votes')}</TextHeading>
          <Paragraph>{formatAmount(epoch?.totalVotesEpoch)}</Paragraph>
        </div>
        <div className='flex flex-col lg:items-end'>
          <TextHeading>{t('Total Rewards')}</TextHeading>
          <div className='flex flex-row items-center gap-1'>
            <Paragraph>${formatAmount(finalData.rewardUsd)}</Paragraph>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`vethe-${epoch?.epochStartTimestamp}`} />
            <CustomTooltip className='min-w-[136px]' id={`vethe-${epoch?.epochStartTimestamp}`}>
              {finalData?.totalRewards.every(item => item?.amount === 0) ? (
                <>
                  {(finalData?.totalRewards || []).map((reward, index) => (
                    <p key={`${reward.address}-total-${index}`}>
                      {`${formatAmount(reward?.amount)} ${reward?.symbol || 'UNKNOWN'}`}
                    </p>
                  ))}
                </>
              ) : (
                <>
                  {(finalData?.totalRewards || []).map((reward, index) => (
                    <p key={`${reward.address}-total-${index}`}>
                      {reward?.amount > 0 ? (
                        <>
                          {formatAmount(reward?.amount)} {reward?.symbol || 'UNKNOWN'}
                        </>
                      ) : (
                        <></>
                      )}
                    </p>
                  ))}
                </>
              )}
            </CustomTooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

function VotingHistory() {
  const { account } = useWallet()
  const [currentPage, setCurrentPage] = useState(1)

  const t = useTranslations()

  const fetchVotingHistoryData = useCallback(
    async (limit = 10, skip = 0) => {
      try {
        const data = await fetchVotingHistory(account?.toLowerCase(), skip, limit)
        if (data?.data) {
          const result = data.data.map(item => ({
            ...item,
            totalVetheBalance: (item.votes || []).reduce((sum, vote) => sum + parseFloat(vote?.vetheBalance || 0), 0),
            totalVotesEpoch: (item.votes || []).reduce(
              (sum, vote) =>
                sum + (vote.poolVotes || []).reduce((curr, poolVote) => curr + parseFloat(poolVote.totalVote), 0),
              0,
            ),
          }))

          return { ...data, data: result }
        }
        return null
      } catch (error) {
        console.trace(error)
        return null
      }
    },
    [account],
  )

  const { data: epochVotingHistory, isLoading } = useSWR(
    account && ['epochVotingHistory', account, currentPage],
    () => fetchVotingHistoryData(10, (currentPage - 1) * 10),
    {
      refreshInterval: 60000,
    },
  )
  const [isOpenArray, setIsOpenArray] = useState([])

  useEffect(() => {
    if (epochVotingHistory?.data?.length) {
      setIsOpenArray(Array(epochVotingHistory.data.length).fill(false))
    }
  }, [epochVotingHistory?.data])

  const toggleCollapse = useCallback(index => {
    setIsOpenArray(prevState => prevState.map((isOpen, i) => (i === index ? !isOpen : false)))
  }, [])

  if (isLoading) {
    return (
      <div className='flex flex-col divide-y divide-neutral-700 rounded-xl border border-neutral-700 bg-neutral-900'>
        {[1, 2, 3].map((_, index) => (
          <div key={index} className='flex w-full flex-col justify-between gap-4 px-4 py-5 lg:flex-row lg:px-6'>
            <div className='flex flex-[10] flex-row justify-between lg:flex-[2.5]'>
              <div className='flex w-full flex-row gap-1'>
                <Skeleton className='h-6 w-[40%]' />
              </div>
              <div className='h-4 w-5 lg:hidden'>
                <ChevronDownIcon />
              </div>
            </div>
            <div className='grid w-full grid-cols-2 gap-y-4 lg:flex-[7.5] lg:grid-cols-4'>
              <div className='flex flex-col gap-2'>
                <Skeleton className='h-6 w-[20%]' />
                <Skeleton className='h-6 w-[40%]' />
              </div>
              <div className='flex flex-col gap-2'>
                <Skeleton className='h-6 w-[20%]' />
                <Skeleton className='h-6 w-[40%]' />
              </div>
              <div className='flex flex-col gap-2'>
                <Skeleton className='h-6 w-[20%]' />
                <Skeleton className='h-6 w-[40%]' />
              </div>
              <div className='flex flex-col gap-2'>
                <Skeleton className='h-6 w-[20%]' />
                <Skeleton className='h-6 w-[40%]' />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return epochVotingHistory?.data?.length > 0 ? (
    <div className='flex flex-col divide-y divide-neutral-700 rounded-xl border border-neutral-700 bg-neutral-900'>
      {(epochVotingHistory?.data || []).map((epoch, index) => (
        <Collapse
          key={index}
          onToggle={() => toggleCollapse(index)}
          className='bg-transparent'
          defaultShow={false}
          title={<TitleEpoch epoch={epoch} open={isOpenArray[index]} />}
          isOpen={isOpenArray[index]}
          classNames={{ chevron: 'mr-6 max-lg:hidden' }}
        >
          <div className='border-t border-t-neutral-700 bg-neutral-950 p-3 lg:p-6'>
            {isOpenArray[index] && <VotingHistoryTable userVotes={epoch} />}
          </div>
        </Collapse>
      ))}
      <Paging currentPage={currentPage} setCurrentPage={setCurrentPage} totalRecord={epochVotingHistory.total} />
    </div>
  ) : (
    <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
      <Highlight>
        <InfoCircleWhite className='h-4 w-4' />
      </Highlight>
      <div className='flex flex-col items-center gap-3'>
        <h2>{t('No Voting History Found')}</h2>
        <Paragraph className='mt-3 text-center'>{t('No Voting History to display')}</Paragraph>
      </div>
    </div>
  )
}

export default VotingHistory
