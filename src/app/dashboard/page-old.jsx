'use client'

import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Highlight from '@/components/highlight'
import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Toggle from '@/components/toggle'
// import NextImage from '@/components/common/NextImage'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES, THE_LOGO } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useManuals } from '@/context/manualsContext'
import { rewardsContext } from '@/context/rewardsContext'
import { useVaults } from '@/context/vaultsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useGaugeAllHarvest } from '@/hooks/useGauge'
import useWallet from '@/hooks/useWallet'
import { useWeightedPositionList } from '@/hooks/weightedPool/useWeigtedPool'
import InfoIcon from '@/icons/InfoIcon'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'
import { FarmingPosition } from '@/modules/Position/FarmingPosition'
import ManualPosition from '@/modules/Position/ManualPosition'
import NotStaked from '@/modules/Position/NotStaked'
import Staked from '@/modules/Position/Staked'
import { WeightedPoolPosition } from '@/modules/Position/WeightedPoolPosition'
import { useFarmRewards } from '@/state/farmReward/store'
import { usePools } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import NotConnected from './NotConnected'

const FILTERS = {
  All: 'All Positions',
  ICHI: 'ICHI',
  Gamma: 'Gamma',
  DefiEdge: 'DefiEdge',
  Manual: 'Manual',
  WEIGHTED: 'Weighted',
  Legacy: 'V1',
}

const updateWalletBalance = positions => {
  const groupedPositions = positions.reduce((map, position) => {
    if (!map[position.address]) {
      map[position.address] = []
    }
    map[position.address].push(position)
    return map
  }, {})

  Object.values(groupedPositions).forEach(group => {
    const posV2 = group.find(pos => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pos.type) && pos.version === 2)
    const posV3 = group.find(pos => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pos.type) && pos.version === 3)

    if (posV2 && posV3 && !isInvalidAmount(posV2.account.walletBalance)) {
      // Update walletBalance for the version 2 position
      posV2.account.walletBalance = new BigNumber(0)
    }
  })

  return positions
}

export default function HoldingsPage() {
  const { account } = useWallet()
  const [stakedOnly, setStakedOnly] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState(FILTERS.All)
  const router = useRouter()
  const { push } = router
  const assets = useAssets()
  const pools = usePools()
  const vaults = useVaults()
  const { veTHEs } = useVeTHEsContext()
  const userManuals = useManuals()
  const { current } = useContext(rewardsContext)
  const { rewards: veRewards } = current
  const { networkId } = useChainSettings()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])
  const farmedPools = pools.filter(item => item.account.gaugeEarned.gt(0))
  const { onGaugeAllHarvest, pending } = useGaugeAllHarvest()
  const t = useTranslations()
  const weightedPositionList = useWeightedPositionList()

  const theAsset = useMemo(
    () => assets.find(asset => asset.address.toLowerCase() === Contracts.THE[networkId].toLowerCase()),
    [assets, networkId],
  )

  const veTHEholdings = useMemo(
    () => veTHEs.reduce((sum, curr) => sum.plus(curr.voting_amount), new BigNumber(0)),
    [veTHEs],
  )

  const { rewards } = useFarmRewards()
  const totalFarmed = useMemo(() => {
    let total = BigNumber(0)
    Object.values(rewards).forEach(list => {
      list.forEach(val => {
        total = total.plus(val.amount)
      })
    })
    return total
  }, [rewards])

  const totalCurrentUsd = useMemo(
    () => veRewards.reduce((sum, curr) => sum.plus(curr.totalUsd), new BigNumber(0)),
    [veRewards],
  )

  const filteredPools = useMemo(() => {
    let result = []
    const stakedPools = userPools.filter(ele => (stakedOnly ? ele.account.gaugeBalance.gt(0) : true))
    const farmed = userManuals.filter(ele => ele.isFarming)

    switch (filter) {
      case FILTERS.ICHI:
        result = stakedPools.filter(ele => ICHI_TYPES.includes(ele.title))
        break

      case FILTERS.DefiEdge:
        result = stakedPools.filter(ele => ele.title === 'DefiEdge')
        break

      case FILTERS.Legacy:
        result = stakedPools.filter(ele => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(ele.title))
        break

      case FILTERS.Gamma:
        result = stakedPools.filter(ele => GAMMA_TYPES.includes(ele.title))
        break

      case FILTERS.Manual:
        result = stakedOnly ? farmed : userManuals
        break

      case FILTERS.WEIGHTED:
        result = weightedPositionList
        break

      default:
        result = stakedOnly
          ? stakedPools.concat(farmed, weightedPositionList)
          : [...userPools, ...userManuals, ...weightedPositionList]
        break
    }
    const filtered = !searchText
      ? result
      : result &&
        result.filter(item => {
          const withSpace = item.symbol.replace('/', ' ')
          const withComma = item.symbol.replace('/', ',')
          return (
            item.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
            withSpace.toLowerCase().includes(searchText.toLowerCase()) ||
            withComma.toLowerCase().includes(searchText.toLowerCase())
          )
        })

    return updateWalletBalance(filtered)
  }, [userPools, filter, searchText, stakedOnly, userManuals, weightedPositionList])

  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch('/dashboard/lock')
    router.prefetch('/dashboard/vote')
    router.prefetch('/dashboard/rewards')
    router.prefetch('/dashboard/thenft')
  }, [router])

  const isShowMigrationWarning = useMemo(() => userManuals.some(ele => ele.version === 2), [userManuals])
  return (
    <div className='flex flex-col gap-4'>
      <h2>{t('Assets')}</h2>
      {account ? (
        <div className='flex flex-col gap-10'>
          <div className='flex flex-col items-center gap-2 lg:flex-row lg:gap-6'>
            <Box className='flex w-full flex-col gap-2'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-5 w-5' src={THE_LOGO} alt='thena logo' />
                <TextHeading className='text-2xl'>{formatAmount(theAsset?.balance || 0)}</TextHeading>
              </div>
              <Paragraph className='text-sm'>{t('THE Holdings')}</Paragraph>
            </Box>
            <Box className='flex w-full flex-col gap-2'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-5 w-5' src={THE_LOGO} alt='thena logo' />
                <TextHeading className='text-2xl'>{formatAmount(veTHEholdings)}</TextHeading>
              </div>
              <Paragraph className='text-sm'>{t('veTHE Holdings')}</Paragraph>
            </Box>

            <Box className='flex w-full items-center justify-between'>
              <div className='flex-col gap-2'>
                <div className='flex items-center gap-1'>
                  <CircleImage className='h-5 w-5' src={THE_LOGO} alt='thena logo' />
                  <TextHeading className='text-2xl'>{formatAmount(totalFarmed)}</TextHeading>
                </div>
                <Paragraph className='text-sm'>{t('THE Farmed')}</Paragraph>
              </div>
              {networkId === ChainId.BSC && farmedPools.length > 0 && (
                <div
                  className={cn(
                    'text-primary-600 hover:text-primary-700 cursor-pointer text-sm font-medium transition-all duration-150 ease-out',
                    pending && 'text-neutral-700',
                  )}
                  onClick={() => {
                    if (!pending) onGaugeAllHarvest(farmedPools)
                  }}
                >
                  {t('Harvest')}
                </div>
              )}
            </Box>
            <Box className='flex w-full flex-col gap-2'>
              <div className='flex items-center gap-1'>
                <TextHeading className='text-2xl'>${formatAmount(totalCurrentUsd)}</TextHeading>
              </div>
              <Paragraph className='text-sm'>{t('Voting Rewards')}</Paragraph>
            </Box>
          </div>

          <Box
            className={cn(
              'border-primary-800 bg-primary-950 mt-[30px] flex flex-row items-center justify-between gap-4 border',
              !isShowMigrationWarning && 'hidden',
            )}
          >
            <div className='h-8 w-8'>
              <InfoIcon className='stroke-primary-600 size-8' />
            </div>

            <div className='flex flex-col'>
              <TextHeading className='text-xl text-neutral-100'>
                {t('Migrate Your Conc Liquidity Positions')}
              </TextHeading>
              <TextSubHeading className='text-primary-100 text-base'>
                {t('Migrate Your Conc Liquidity Positions description')}
                &nbsp;
                <span>
                  <Link className='text-primary-600' href='/'>
                    {/* TODO: Link */}
                    {t('Learn more')}
                  </Link>
                </span>
              </TextSubHeading>
            </div>
          </Box>

          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <TextHeading className='text-xl'>{t('My Positions')}</TextHeading>
                <Toggle
                  className='lg:hidden'
                  checked={stakedOnly}
                  onChange={() => setStakedOnly(!stakedOnly)}
                  toggleId='active'
                  label='Staked Only'
                />
              </div>
              <div className='flex w-full flex-col gap-4 lg:w-auto lg:flex-row lg:gap-2'>
                <SearchInput className='w-full lg:w-auto' val={searchText} setVal={setSearchText} />
                <Dropdown
                  className='w-full lg:w-[200px]'
                  data={Object.values(FILTERS).map(item => ({
                    label: item,
                  }))}
                  selected={filter}
                  setSelected={ele => setFilter(ele.label)}
                  placeHolder='Choose Category'
                />
                <Toggle
                  className='hidden lg:flex'
                  checked={stakedOnly}
                  onChange={() => setStakedOnly(!stakedOnly)}
                  toggleId='active'
                  label='Staked Only'
                />
              </div>
            </div>

            {userPools.length > 0 || userManuals.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {filteredPools.map((pool, idx) =>
                  pool.type === 'Manual' ? (
                    <React.Fragment key={`pool-${idx}`}>
                      {pool?.deployer === zeroAddress ? (
                        <FarmingPosition position={pool} key={`pool-${idx}`} />
                      ) : (
                        <ManualPosition position={pool} key={`pool-${idx}`} />
                      )}
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={`pool-${idx}`}>
                      {pool.tokens && Array.isArray(pool.tokens) ? (
                        <>
                          {!stakedOnly && pool.notStaked && <WeightedPoolPosition pool={pool} isStake={false} />}
                          {pool.staked && <WeightedPoolPosition pool={pool} isStake />}
                        </>
                      ) : (
                        <>
                          {pool.account.gaugeBalance.gt(0) && <Staked pool={pool} />}
                          {!stakedOnly && pool.account.walletBalance.gt(0) && <NotStaked pool={pool} />}
                        </>
                      )}
                    </React.Fragment>
                  ),
                )}
              </div>
            ) : (
              <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
                <Highlight>
                  <InfoIcon className='stroke-neutral-50' />
                </Highlight>
                <div className='flex flex-col items-center gap-3'>
                  <h2>{t('No Position Found')}</h2>
                  <Paragraph className='mt-3 text-center'>
                    {t('No positions to display')}
                    <br />
                    {t('Add liquidity to get started')}
                  </Paragraph>
                </div>
                <PrimaryButton onClick={() => push('/pools')}>{t('Explore Pools')}</PrimaryButton>
              </div>
            )}
          </div>
        </div>
      ) : (
        <NotConnected />
      )}
    </div>
  )
}
