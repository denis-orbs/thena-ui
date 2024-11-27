'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import VeTheDropdown from '@/components/dropdown/VeTheDropdown'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { fetchVeTHEFromId, useVeTHEsContext } from '@/context/veTHEsContext'
import useDebounce from '@/hooks/useDebounce'
import { useEpochTimer, useVoteEmissions } from '@/hooks/useGeneral'
import usePrices from '@/hooks/usePrices'
import { usePoke, useReset, useVote } from '@/hooks/useVeThe'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getFeeContract, getVeTHEContract } from '@/lib/contracts'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, fromWei } from '@/lib/utils'
import { usePools } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Pair',
    value: 'pair',
    width: 'lg:w-[20%]',
    isDesc: true,
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'lg:w-[14%]',
    isDesc: true,
  },
  {
    label: 'Total Votes',
    value: 'votes',
    width: 'lg:w-[14%]',
    isDesc: true,
  },
  {
    label: 'Rewards',
    value: 'rewards',
    width: 'lg:w-[14%]',
    isDesc: true,
  },
  {
    label: 'Reward Estimate',
    value: 'estimate',
    width: 'lg:w-[14%]',
    isDesc: true,
  },
  {
    label: 'My Vote',
    value: 'your',
    width: 'lg:w-[14%]',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-[200px]',
    disabled: true,
  },
]

// const HIDDEN_POOLS = [
//   '0x5f28dccd24d1fcb6805e6d71ec15fa93cb0cf360', // SolvBTC/BTCB - DefiEdge
//   '0x7ddb9392376359a36847b351db5c3562499fa373', // SolvBTC/BNB - DefiEdge
// ]

export default function VotePage() {
  const [searchText, setSearchText] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isVoted, setIsVoted] = useState(false)
  const [veTHEId, setVeTHEId] = useState(null)
  const [sort, setSort] = useState(sortOptions[3])
  const [currentPage, setCurrentPage] = useState(1)
  const [percent, setPercent] = useState({})
  const { account } = useWallet()
  const { veTHEs, updateVeTHEs } = useVeTHEsContext()
  const pools = usePools()
  const prices = usePrices()
  const { voteEmssions } = useVoteEmissions()
  const { days, hours, mins, epoch } = useEpochTimer()
  const { onVote, pending: votePending } = useVote()
  const { onReset, pending: resetPending } = useReset()
  const { onPoke, pending: pokePending } = usePoke()
  const [approvedId, setApprovedId] = useState('')
  const { networkId } = useChainSettings()
  const debouncedId = useDebounce(approvedId)
  const t = useTranslations()
  const { data: isApproved } = useSWR(
    debouncedId && account && networkId === ChainId.BSC && ['vethe/approved', debouncedId, account],
    async () => {
      const veTHEContract = getVeTHEContract(networkId)
      return await readCall(veTHEContract, 'isApprovedOrOwner', [account, debouncedId], networkId)
    },
    {
      refreshInterval: 0,
    },
  )
  const { data: approvedInfo } = useSWR(
    account && isApproved && networkId === ChainId.BSC ? ['vethes/approved api', debouncedId, networkId] : null,
    () => fetchVeTHEFromId(debouncedId, networkId),
  )

  useEffect(() => {
    if (isApproved) {
      setVeTHEId(approvedId)
    }
  }, [isApproved, approvedId])

  const veTHE = useMemo(() => {
    const list = [...veTHEs, approvedInfo]
    return veTHEId ? list.find(item => Number(item?.id) === Number(veTHEId)) : null
  }, [veTHEs, veTHEId, approvedInfo])

  const totalPercent = useMemo(
    () => Object.values(percent).reduce((sum, current) => sum + (!current || current === '' ? 0 : Number(current)), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(percent), percent],
  )

  const [updatedFeesPools, setUpdatedFeePools] = useState([])
  const ref = useRef(0)
  const assets = useAssets()

  useEffect(() => {
    if (pools && Array.isArray(pools) && pools.length && !updatedFeesPools.length && !ref.current && assets) {
      // eslint-disable-next-line no-inner-declarations
      async function getUpdatedFeesPools() {
        const results = []
        for (const pair of pools) {
          // TODO: Check for THE pools
          if (pair.title !== 'DefiEdge' && pair.gauge.address !== zeroAddress && pair.gauge.isAlive) {
            if (
              pair?.token0?.address === '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11' ||
              pair?.token1?.address === '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11'
            ) {
              const feeContract = getFeeContract(pair?.gauge?.fee, networkId)

              if (feeContract) {
                const nextEpochTime = await readCall(feeContract, 'getNextEpochStart', [])
                const [fee0, fee1] = await Promise.all([
                  readCall(feeContract, 'rewardData', [pair.token0.address, nextEpochTime]),
                  readCall(feeContract, 'rewardData', [pair.token1.address, nextEpochTime]),
                ])

                if ((fee0 && fee1 && Array.isArray(fee0) && fee0?.[1]) || (Array.isArray(fee1) && fee1?.[1])) {
                  const fee = [
                    {
                      address: pair.token0.address,
                      decimals: pair.token0.decimals,
                      amount: fromWei(fee0[1], pair.token0.decimals) || 0,
                      symbol: pair.token0.symbol,
                    },
                    {
                      address: pair.token1.address,
                      decimals: pair.token1.decimals,
                      amount: fromWei(fee1[1], pair.token1.decimals) || 0,
                      symbol: pair.token1.symbol,
                    },
                  ]

                  const token0Asset = assets.find(item => item.address === pair.token0.address)
                  const token1Asset = assets.find(item => item.address === pair.token1.address)

                  let bribeUsd = fee[0].amount * (token0Asset.price || 0) + fee[1].amount * (token1Asset.price || 0)
                  if (pair.gauge.bribes.bribe) {
                    const gaugeAsset = assets.find(item => item.address === pair.gauge.bribes.bribe[0].address)
                    bribeUsd += pair.gauge.bribes.bribe[0].amount * (gaugeAsset || 0)
                  }

                  results.push({
                    ...pair,
                    gauge: {
                      ...pair.gauge,
                      bribes: {
                        ...pair.gauge.bribes,
                        fee,
                      },
                      bribeUsd,
                    },
                  })
                }
              }
            }
          }
        }

        setUpdatedFeePools(results)
      }

      getUpdatedFeesPools()
      ref.current = 1
    }
  }, [assets, networkId, pools, updatedFeesPools.length])

  const userPools = useMemo(
    () =>
      pools
        // .filter(pair => !HIDDEN_POOLS.includes(pair.address))
        .filter(pair => pair.title !== 'DefiEdge') // hide all DeFi Edge
        .filter(pair => pair.gauge.address !== zeroAddress && pair.gauge.isAlive)
        .map(pair => {
          // TODO: Hard-coded for THE pools
          if (updatedFeesPools.length) {
            const foundPair = updatedFeesPools.find(item => item.address === pair.address)
            if (foundPair && pair.gauge.bribes) {
              pair.gauge.bribeUsd = new BigNumber(foundPair.gauge.bribeUsd)
              pair.gauge.bribes = {
                ...pair.gauge.bribes,
                fee: foundPair.gauge.bribes.fee,
              }
            }
          }
          const perRewards = pair.gauge.bribeUsd.div(pair.gauge.weight.plus(1000)).times(1000)
          let votes = {
            weight: new BigNumber(0),
            weightPercent: new BigNumber(0),
            rewards: new BigNumber(0),
            perRewards,
          }
          if (veTHE && veTHE.votes.length > 0) {
            const found = veTHE.votes.find(ele => ele.address.toLowerCase() === pair.address.toLowerCase())
            if (found) {
              const rewards =
                !veTHE.votedCurrentEpoch || pair.gauge.weight.isZero()
                  ? new BigNumber(0)
                  : pair.gauge.bribeUsd.div(pair.gauge.weight).times(found.weight)
              votes = {
                ...found,
                rewards,
                perRewards,
              }
            }
          }
          return {
            ...pair,
            votes,
          }
        }),
    [pools, veTHE, updatedFeesPools],
  )

  const filteredPools = useMemo(() => {
    const result = userPools.filter(pool => (isVoted && !pool.votes.weight.isZero()) || !isVoted)
    if (!searchText || searchText === '') {
      return result
    }
    return (
      result &&
      result.filter(item => {
        const withSpace = item.symbol.replace('/', ' ')
        const withComma = item.symbol.replace('/', ',')
        return (
          item.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
          withSpace.toLowerCase().includes(searchText.toLowerCase()) ||
          withComma.toLowerCase().includes(searchText.toLowerCase())
        )
      })
    )
  }, [userPools, searchText, isVoted])

  const sortedPools = useMemo(
    () =>
      filteredPools.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'pair':
            res = a.symbol.localeCompare(b.symbol) * (sort.isDesc ? -1 : 1)
            break
          case 'apr':
            res = a.gauge.voteApr
              .minus(b.gauge.voteApr)
              .times(sort.isDesc ? -1 : 1)
              .toNumber()
            break
          case 'votes':
            res = a.gauge.weight
              .minus(b.gauge.weight)
              .times(sort.isDesc ? -1 : 1)
              .toNumber()
            break
          case 'rewards':
            res = a.gauge.bribeUsd
              .minus(b.gauge.bribeUsd)
              .times(sort.isDesc ? -1 : 1)
              .toNumber()
            break
          case 'estimate':
            res = a.votes.perRewards
              .minus(b.votes.perRewards)
              .times(sort.isDesc ? -1 : 1)
              .toNumber()
            break
          case 'your':
            res = a.votes.weight
              .minus(b.votes.weight)
              .times(sort.isDesc ? -1 : 1)
              .toNumber()
            break

          default:
            break
        }
        return res
      }),
    [filteredPools, sort],
  )

  const finalPools = useMemo(
    () =>
      sortedPools.map(pool => ({
        pair: (
          <div className='flex items-center gap-3'>
            <IconGroup
              className='-space-x-2'
              classNames={{
                image: 'outline-2 w-7 h-7',
              }}
              logo1={pool.token0.logoURI}
              logo2={pool.token1.logoURI}
            />
            <div className='flex flex-col'>
              <TextHeading>{pool.symbol}</TextHeading>
              <Paragraph className='text-sm'>{pool.title}</Paragraph>
            </div>
          </div>
        ),
        apr: <Paragraph>{formatAmount(pool.gauge.voteApr, true)}%</Paragraph>,
        votes: (
          <div className='flex flex-col'>
            <Paragraph>{formatAmount(pool.gauge.weight)}</Paragraph>
            <TextSubHeading className='text-base leading-tight'>
              {formatAmount(Math.ceil(pool.gauge.weightPercent.toNumber()))}%
            </TextSubHeading>
          </div>
        ),
        rewards: (
          <div className='flex items-center gap-1'>
            <Paragraph>
              $
              {formatAmount(
                // pool.title === 'DefiEdge' ||
                pool.address === '0xf7369b1d005f2cbb1887233b5aa0cb0b39fb9891' ||
                  pool.address === '0xac7042fed4e724107fd5778f4a9cad894a5e18ab'
                  ? 0
                  : pool.gauge.bribeUsd,
              )}
            </Paragraph>
            {pool.gauge.bribeUsd.gt(0) &&
              // pool.title !== 'DefiEdge' &&
              pool.address !== '0xf7369b1d005f2cbb1887233b5aa0cb0b39fb9891' &&
              pool.address !== '0xac7042fed4e724107fd5778f4a9cad894a5e18ab' && (
                <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`projected-${pool.gauge.address}`} />
              )}
            <CustomTooltip className='min-w-[136px]' id={`projected-${pool.gauge.address}`}>
              <div className='flex flex-col gap-1'>
                {pool.gauge.bribes && pool.gauge.bribes.bribe && (
                  <>
                    <TextHeading>{t('Voting Incentives')}</TextHeading>
                    <div className='flex flex-col'>
                      {pool.gauge.bribes.bribe.map((bribe, idx) => (
                        <Paragraph key={`bribe-${idx}`}>
                          {formatAmount(bribe.amount)} {bribe.symbol}
                        </Paragraph>
                      ))}
                    </div>
                  </>
                )}
                {pool.gauge.bribes && pool.gauge.bribes.fee && (
                  <>
                    <TextHeading>{t('Projected Fees')}</TextHeading>
                    <div className='flex flex-col'>
                      {pool.gauge.bribes.fee.map((fee, idx) => (
                        <Paragraph key={`fee-${idx}`}>
                          {formatAmount(fee.amount)} {fee.symbol}
                        </Paragraph>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CustomTooltip>
          </div>
        ),
        estimate: (
          <div className='flex flex-col'>
            <Paragraph>
              $
              {formatAmount(
                // pool.title === 'DefiEdge' ||
                pool.address === '0xf7369b1d005f2cbb1887233b5aa0cb0b39fb9891' ||
                  pool.address === '0xac7042fed4e724107fd5778f4a9cad894a5e18ab'
                  ? 0
                  : pool.votes.perRewards,
              )}
            </Paragraph>
            <TextSubHeading className='text-base leading-tight'>{t('Per 1000 Votes')}</TextSubHeading>
          </div>
        ),
        your: (
          <div className='flex flex-col'>
            <Paragraph>{formatAmount(pool.votes.weight)}</Paragraph>
            <TextSubHeading className='text-base leading-tight'>
              {formatAmount(Math.ceil(pool.votes.weightPercent.toNumber()))}%
            </TextSubHeading>
          </div>
        ),
        action: (
          <Input
            className='w-full'
            min={0}
            step={1}
            val={percent[pool.address] || ''}
            onChange={e => {
              const val = isNaN(Number(percent[pool.address])) ? 0 : Number(percent[pool.address])
              const newVal =
                isNaN(Number(e.target.value)) || Number(e.target.value) < 0 ? 0 : Math.floor(Number(e.target.value))
              const maxValue = 100 - totalPercent + val === 0 ? '' : 100 - totalPercent + val
              const final = newVal === 0 ? '' : Math.min(newVal, maxValue)
              setPercent({
                ...percent,
                [pool.address]: !e.target.value ? '' : final,
              })
            }}
            placeholder='Enter vote'
            TrailingButton={
              // eslint-disable-next-line react/jsx-wrap-multilines
              <EmphasisButton
                className='p-2'
                onClick={() => {
                  const val = isNaN(Number(percent[pool.address])) ? 0 : Number(percent[pool.address])
                  const maxValue = 100 - totalPercent + val
                  setPercent({
                    ...percent,
                    [pool.address]: maxValue === 0 ? '' : maxValue,
                  })
                }}
              >
                {t('Max')}
              </EmphasisButton>
            }
          />
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedPools), JSON.stringify(percent), t],
  )

  const expectedRewards = useMemo(
    () => userPools.reduce((acc, cur) => acc.plus(cur.votes.rewards), new BigNumber(0)),
    [userPools],
  )

  const avgApr = useMemo(() => {
    if (userPools && userPools.length > 0 && prices) {
      const totalBribe = userPools.reduce((sum, cur) => sum.plus(cur.gauge.bribeUsd), new BigNumber(0))
      const totalWeight = userPools.reduce((sum, cur) => sum.plus(cur.gauge.weight), new BigNumber(0))
      const totalVoteUsd = totalWeight.times(prices.THE)
      return totalVoteUsd.isZero() ? 0 : totalBribe.times(52).div(totalVoteUsd).times(100)
    }
    return new BigNumber(0)
  }, [userPools, prices])

  const errorMsg = useMemo(() => {
    if (!veTHE) {
      return 'Select veTHE'
    }
    if (veTHE.voting_amount.isZero()) {
      return 'Voting power is zero'
    }
    if (totalPercent !== 100) {
      return 'Total should be 100%'
    }
    return null
  }, [totalPercent, veTHE])

  useEffect(() => {
    if (!veTHEId && !!veTHEs.length) {
      setVeTHEId(veTHEs[0].id)
    }
  }, [veTHEId, veTHEs])

  useEffect(() => {
    setCurrentPage(1)
  }, [isVoted, searchText])

  return (
    <div className='flex flex-col gap-4'>
      <h2>{t('Vote')}</h2>
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col items-center gap-2 lg:flex-row lg:gap-6'>
          <Box className='flex w-full flex-col gap-2'>
            <div className='flex items-center gap-1'>
              <TextHeading className='text-2xl'>{account ? `$${formatAmount(expectedRewards)}` : '-'} </TextHeading>
            </div>
            <Paragraph className='text-sm'>{t('Expected Rewards')}</Paragraph>
          </Box>
          <Box className='flex w-full flex-col gap-2'>
            <div className='flex items-center gap-1'>
              <CircleImage className='h-5 w-5' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
              <TextHeading className='text-2xl'>{veTHE ? formatAmount(veTHE.voting_amount) : '-'}</TextHeading>
            </div>
            <Paragraph className='text-sm'>{t('veTHE Balance')}</Paragraph>
          </Box>
          <Box className='flex w-full flex-col gap-2'>
            <TextHeading className='text-2xl'>{`$${formatAmount(voteEmssions)}`}</TextHeading>
            <Paragraph className='text-sm'>{t('Emissions vote')}</Paragraph>
          </Box>
          <Box className='flex w-full flex-col gap-2'>
            <TextHeading className='text-2xl'>{`${formatAmount(avgApr)}%`}</TextHeading>
            <Paragraph className='text-sm'>{t('Average Voting APR')}</Paragraph>
          </Box>
          <Box className='flex w-full flex-col gap-2'>
            <TextHeading className='text-2xl'>
              {days}d {hours}h {mins}m
            </TextHeading>
            <Paragraph className='text-sm'>{t('EPOCH [epoch] Ends in', { epoch })}</Paragraph>
          </Box>
        </div>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col items-center justify-between gap-4 lg:flex-row'>
            <div className='flex w-full items-center justify-between lg:w-fit'>
              <TextHeading className='text-xl'>{t('Votes')}</TextHeading>
              <Toggle
                className='lg:hidden'
                checked={isVoted}
                onChange={() => setIsVoted(!isVoted)}
                toggleId='voted'
                label='Voted Only'
              />
            </div>
            <div className='flex w-full flex-col-reverse gap-4 lg:w-auto lg:flex-row lg:gap-2'>
              <div className='flex items-center justify-between gap-2 lg:hidden'>
                <Paragraph>Sort By</Paragraph>
                <Dropdown
                  data={sortOptions.slice(0, sortOptions.length - 1)}
                  selected={sort ? `${sort.label}` : ''}
                  setSelected={ele => setSort(ele)}
                />
              </div>
              <Toggle
                className='hidden lg:flex'
                checked={isVoted}
                onChange={() => setIsVoted(!isVoted)}
                toggleId='active'
                label='Voted Only'
              />
              <VeTheDropdown
                className='w-full lg:w-[220px]'
                data={veTHEs.map(item => ({
                  ...item,
                  label: `veTHE #${item.id}`,
                }))}
                selected={veTHE ? `veTHE #${veTHE.id}` : ''}
                setSelected={ele => setVeTHEId(ele.id)}
                placeHolder={t('Select veTHE')}
                isLocale={false}
                isApproved={isApproved}
                approvedId={approvedId}
                setApprovedId={setApprovedId}
              />
              <SearchInput className='w-full lg:w-auto' val={searchText} setVal={setSearchText} />
            </div>
          </div>
          <Table
            sortOptions={sortOptions}
            data={finalPools}
            sort={sort}
            setSort={setSort}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            showNumberOfPage
            pageSize={itemsPerPage}
            setNumberOfPage={item => {
              setItemsPerPage(item)
              setCurrentPage(1)
            }}
          />
        </div>
        {account && (
          <div className='fixed bottom-0 left-0 right-0 z-30 mx-auto w-full items-center bg-neutral-700 px-5 py-3 lg:bottom-8 lg:flex lg:w-fit lg:rounded-lg'>
            <div className='flex items-center justify-center'>
              <TextHeading>{t('Voting Power Used')}:&nbsp;</TextHeading>
              <span
                className={cn('font-medium', veTHE && veTHE.votedCurrentEpoch ? 'text-success-600' : 'text-error-600')}
              >
                {t(veTHE && veTHE.votedCurrentEpoch ? 'Yes' : 'No')}
              </span>
            </div>
            <div className='ml-0 mt-3 flex flex-col gap-2 lg:ml-2 lg:mt-0 lg:flex-row'>
              <PrimaryButton
                className='px-2.5 py-2'
                disabled={votePending}
                onClick={() => {
                  if (errorMsg) {
                    warnToast(errorMsg)
                    return
                  }
                  onVote(veTHE.id, percent, () => {
                    updateVeTHEs()
                  })
                }}
              >
                {t('Cast Votes')}
              </PrimaryButton>
              <div className='flex gap-2'>
                <TextButton
                  className='w-full px-2.5 py-2'
                  onClick={() => {
                    onReset(veTHE.id, () => {
                      updateVeTHEs()
                    })
                  }}
                  disabled={!veTHE || !veTHE.voted || resetPending}
                >
                  {t('Reset')}
                </TextButton>
                <TextButton
                  className='w-full px-2.5 py-2'
                  onClick={() => {
                    onPoke(veTHE.id, () => {
                      updateVeTHEs()
                    })
                  }}
                  disabled={!veTHE || !veTHE.voted || pokePending}
                >
                  {t('Revote')}
                </TextButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
