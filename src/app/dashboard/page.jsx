'use client'

import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Highlight from '@/components/highlight'
import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Toggle from '@/components/toggle'
// import NextImage from '@/components/common/NextImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useManuals } from '@/context/manualsContext'
import { rewardsContext } from '@/context/rewardsContext'
import { useVaults } from '@/context/vaultsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useGuageAllHarvset } from '@/hooks/useGauge'
import { cn, formatAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import ManualPosition from '@/modules/Position/ManualPosition'
import NotStaked from '@/modules/Position/NotStaked'
import Staked from '@/modules/Position/Staked'
import { usePools } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import NotConnected from './NotConnected'

export const FILTERS = {
  All: 'All Positions',
  ICHI: 'ICHI',
  Gamma: 'Gamma',
  DefiEdge: 'DefiEdge',
  Manual: 'Manual',
  Legacy: 'V1',
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
  const { current, next } = useContext(rewardsContext)
  const { rewards: veRewards } = current
  const { rewards: expectedRewards } = next
  const { networkId } = useChainSettings()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])
  const farmedPools = pools.filter(item => item.account.gaugeEarned.gt(0))
  const { onGaugeAllHarvest, pending } = useGuageAllHarvset()

  const theAsset = useMemo(() => assets.find(asset => asset.address === Contracts.THE[networkId]), [assets, networkId])

  const veTHEholdings = useMemo(
    () => veTHEs.reduce((sum, curr) => sum.plus(curr.voting_amount), new BigNumber(0)),
    [veTHEs],
  )

  const totalFarmed = useMemo(
    () => pools.reduce((sum, curr) => sum.plus(curr.account.gaugeEarned), new BigNumber(0)),
    [pools],
  )

  const totalCurrentUsd = useMemo(
    () => veRewards.reduce((sum, curr) => sum.plus(curr.totalUsd), new BigNumber(0)),
    [veRewards],
  )

  const totalExpectedUsd = useMemo(
    () => expectedRewards.reduce((sum, curr) => sum.plus(curr.totalUsd), new BigNumber(0)),
    [expectedRewards],
  )

  const filteredPools = useMemo(() => {
    let result = []
    const stakedPools = userPools.filter(ele => (stakedOnly ? ele.account.gaugeBalance.gt(0) : true))
    switch (filter) {
      case FILTERS.ICHI:
        result = stakedPools.filter(ele => ele.title === 'ICHI')
        break

      case FILTERS.DefiEdge:
        result = stakedPools.filter(ele => ele.title === 'DefiEdge')
        break

      case FILTERS.Legacy:
        result = stakedPools.filter(ele => ['Stable', 'Volatile'].includes(ele.title))
        break

      case FILTERS.Gamma:
        result = stakedPools.filter(ele => GAMMA_TYPES.includes(ele.title))
        break

      case FILTERS.Manual:
        result = userManuals
        break

      default:
        result = stakedOnly ? stakedPools : [...userPools, ...userManuals]
        break
    }
    return !searchText
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
  }, [userPools, userManuals, filter, searchText, stakedOnly])

  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch('/dashboard/lock')
    router.prefetch('/dashboard/vote')
    router.prefetch('/dashboard/rewards')
    router.prefetch('/dashboard/thenft')
  }, [router])

  return (
    <div className='flex flex-col gap-4'>
      <h2>Assets</h2>
      {account ? (
        <div className='flex flex-col gap-10'>
          <div className='flex flex-col items-center gap-2 lg:flex-row lg:gap-6'>
            <Box className='flex w-full flex-col gap-2'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-5 w-5' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
                <TextHeading className='text-2xl'>{formatAmount(theAsset?.balance || 0)}</TextHeading>
              </div>
              <Paragraph className='text-sm'>THE Holdings</Paragraph>
            </Box>
            <Box className='flex w-full flex-col gap-2'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-5 w-5' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
                <TextHeading className='text-2xl'>{formatAmount(veTHEholdings)}</TextHeading>
              </div>
              <Paragraph className='text-sm'>veTHE Holdings</Paragraph>
            </Box>
            <Box className='flex w-full items-center justify-between'>
              <div className='flex-col gap-2'>
                <div className='flex items-center gap-1'>
                  <CircleImage className='h-5 w-5' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
                  <TextHeading className='text-2xl'>{formatAmount(totalFarmed)}</TextHeading>
                </div>
                <Paragraph className='text-sm'>THE Farmed</Paragraph>
              </div>
              {networkId === ChainId.BSC && farmedPools.length > 0 && (
                <div
                  className={cn(
                    'cursor-pointer text-sm font-medium text-primary-600 transition-all duration-150 ease-out hover:text-primary-700',
                    pending && 'text-neutral-700',
                  )}
                  onClick={() => {
                    if (!pending) onGaugeAllHarvest(farmedPools)
                  }}
                >
                  Harvest
                </div>
              )}
            </Box>
            <Box className='flex w-full flex-col gap-2'>
              <div className='flex items-center gap-1'>
                <TextHeading className='text-2xl'>${formatAmount(totalCurrentUsd)}</TextHeading>
              </div>
              <Paragraph className='text-sm'>Voting Rewards</Paragraph>
            </Box>
            <Box className='flex w-full flex-col gap-2'>
              <div className='flex items-center gap-1'>
                <TextHeading className='text-2xl'>${formatAmount(totalExpectedUsd)}</TextHeading>
              </div>
              <Paragraph className='text-sm'>Next Epoch Rewards</Paragraph>
            </Box>
          </div>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <TextHeading className='text-xl'>My Positions</TextHeading>
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
                  placeHolder='Choose category'
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
                    <ManualPosition pool={pool} key={`pool-${idx}`} />
                  ) : (
                    <React.Fragment key={`pool-${idx}`}>
                      {pool.account.gaugeBalance.gt(0) && <Staked pool={pool} />}
                      {!stakedOnly && pool.account.walletBalance.gt(0) && <NotStaked pool={pool} />}
                    </React.Fragment>
                  ),
                )}
              </div>
            ) : (
              <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
                <Highlight>
                  <InfoCircleWhite className='h-4 w-4' />
                </Highlight>
                <div className='flex flex-col items-center gap-3'>
                  <h2>No Position Found</h2>
                  <Paragraph className='mt-3 text-center'>
                    Currently, there are no positions to display.
                    <br />
                    Add liquidity to get started!
                  </Paragraph>
                </div>
                <PrimaryButton onClick={() => push('/pools')}>Explore Pools</PrimaryButton>
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
