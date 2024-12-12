import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'use-intl'

import Loading from '@/app/loading'
import { TertiaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import { Collapse } from '@/components/collapse'
import Input from '@/components/input'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { LOCALES } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { fetVotingHistory } from '@/lib/api'
import { cn, formatAmount } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'
import { ArrowLeftIcon, ChevronDownIcon, InfoIcon, XIcon } from '@/svgs'

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
  dataLength,
  showPopoverPagination = false,
}) {
  const [inputPage, setInputPage] = useState(undefined)
  const [showPopover, setShowPopover] = useState(false)

  const pageCount = useMemo(() => {
    const count = Math.ceil((totalItems || dataLength) / pageSize)

    return limitPage && limitPage < count ? limitPage : count
  }, [dataLength, limitPage, pageSize, totalItems])
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

  return (
    <div className='flex w-full flex-col justify-between gap-4 px-4 py-5 lg:flex-row lg:px-6'>
      <div className='flex flex-[10] flex-row justify-between lg:flex-[3]'>
        <div className='flex flex-row gap-1'>
          <TextHeading className='text-xl'>{t('Epoch')}</TextHeading>
          <Paragraph className='text-xl'>{formatAmount(epochNumber)}</Paragraph>
        </div>
        <div className={cn('h-4 w-5 lg:hidden', open ? 'rotate-180' : 'rotate-0')}>
          <ChevronDownIcon />
        </div>
      </div>
      <div className='grid w-full grid-cols-2 gap-y-4 lg:flex-[7] lg:grid-cols-4'>
        <div className='flex flex-col'>
          <TextHeading>{t('Time Period')}</TextHeading>
          <Paragraph className='hidden sm:block'>{`${timePeriod[0]} - ${timePeriod[1]}`}</Paragraph>
          <Paragraph className='hidden max-sm:block'>{timePeriod[0]}</Paragraph>
          <Paragraph className='hidden max-sm:block'>- {timePeriod[1]}</Paragraph>
        </div>
        <div className='flex flex-col'>
          <TextHeading>{t('My Votes')}</TextHeading>
          <Paragraph>{formatAmount(epoch?.totalVetheBalance)}</Paragraph>
        </div>
        <div className='flex flex-col'>
          <TextHeading>{t('Total Votes')}</TextHeading>
          <Paragraph>{formatAmount(epoch?.totalVote)}</Paragraph>
        </div>
        <div className='flex flex-col'>
          <TextHeading>{t('Total Rewards')}</TextHeading>
          <div className='flex flex-row items-center gap-1'>
            <Paragraph>TODO API</Paragraph>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`vethe-${epoch?.epoch}`} />
            <CustomTooltip className='min-w-[136px]' id={`vethe-${epoch?.epoch}`}>
              1234 THE
            </CustomTooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

const fetVotingHistoryData = async (account, limit = 10, skip = 0) => {
  try {
    const data = await fetVotingHistory(account?.toLowerCase(), skip, limit)
    if (data) {
      const groupedData = Object.values(
        data.reduce((acc, item) => {
          const { epochStartTimestamp, vetheBalance, userVotes } = item
          const userVotesWithVetheBalance = (userVotes || []).map(vote => ({
            ...vote,
            vetheBalance,
          }))
          if (!acc[epochStartTimestamp]) {
            acc[epochStartTimestamp] = {
              ...item,
              totalVetheBalance: parseFloat(vetheBalance),
              userVotes: userVotesWithVetheBalance,
            }
          } else {
            acc[epochStartTimestamp].totalVetheBalance += parseFloat(vetheBalance) // Sum vetheBalance
            acc[epochStartTimestamp].userVotes.push(...userVotesWithVetheBalance)
          }

          return acc
        }, {}),
      )

      return groupedData
    }
    return null
  } catch (error) {
    console.trace(error)
    return null
  }
}

function VotingHistory() {
  const { account } = useWallet()
  const [currentPage, setCurrentPage] = useState(0)

  const { data: epochVotingHistory, isLoading } = useSWR(
    account && ['epochVotingHistory', account],
    () => fetVotingHistoryData(account, 10, 0),
    {
      refreshInterval: 0,
    },
  )
  const [isOpenArray, setIsOpenArray] = useState([])

  useEffect(() => {
    if (epochVotingHistory?.length) {
      setIsOpenArray(Array(epochVotingHistory.length).fill(false))
    }
  }, [epochVotingHistory])

  const toggleCollapse = index => {
    setIsOpenArray(prevState => prevState.map((isOpen, i) => (i === index ? !isOpen : false)))
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className='flex flex-col divide-y divide-neutral-700 rounded-xl border border-neutral-700 bg-neutral-900'>
      {(epochVotingHistory || []).map((epoch, index) => (
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
            <VotingHistoryTable userVotes={epoch} />
          </div>
        </Collapse>
      ))}
      <Paging currentPage={currentPage} setCurrentPage={setCurrentPage} dataLength={epochVotingHistory.length} />
    </div>
  )
}

export default VotingHistory
