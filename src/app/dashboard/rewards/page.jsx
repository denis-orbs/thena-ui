'use client'

import BigNumber from 'bignumber.js'
import React, { useContext, useMemo, useState } from 'react'

import { Info } from '@/components/alert'
import { TertiaryButton } from '@/components/buttons/Button'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import { rewardsContext } from '@/context/rewardsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import usePrices from '@/hooks/usePrices'
import { useClaimAll } from '@/hooks/useVeThe'
import { formatAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { CoinsStackedIcon } from '@/svgs'

import CurrentRewards from './currentRewards'
import NextRewards from './nextRewards'
import NotConnected from '../NotConnected'

export default function RewardsPage() {
  const [isExpected, setIsExpected] = useState(false)
  const { account } = useWallet()
  const prices = usePrices()
  const { veTHEs } = useVeTHEsContext()
  const { current, next } = useContext(rewardsContext)
  const { rewards: veRewards, currentMutate } = current
  const { rewards: expectedRewards } = next
  const { onClaimAll, pending: allPending } = useClaimAll()

  const filteredVeTHEs = useMemo(() => veTHEs.filter(ele => ele.rebase_amount.gt(0)), [veTHEs])

  const currentRewards = useMemo(() => [...filteredVeTHEs, ...veRewards], [filteredVeTHEs, veRewards])

  const totalUsd = useMemo(() => {
    let total = [...veRewards].reduce((sum, curr) => sum.plus(curr.totalUsd), new BigNumber(0))
    filteredVeTHEs.forEach(ele => {
      total = total.plus(ele.rebase_amount.times(prices.THE))
    })
    return total
  }, [veRewards, filteredVeTHEs, prices])

  const totalExpectedUsd = useMemo(
    () => expectedRewards.reduce((sum, curr) => sum.plus(curr.totalUsd), new BigNumber(0)),
    [expectedRewards],
  )

  const typeSelections = useMemo(
    () => [
      {
        label: 'Current epoch',
        active: !isExpected,
        onClickHandler: () => {
          setIsExpected(false)
        },
      },
      {
        label: 'Next epoch',
        active: isExpected,
        onClickHandler: () => {
          setIsExpected(true)
        },
      },
    ],
    [setIsExpected, isExpected],
  )

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col items-center justify-between gap-4 lg:flex-row'>
        <div className='flex flex-col gap-2'>
          <h2>Rewards</h2>
          <Paragraph>Claim your voting incentives, fees and veTHE rebase here.</Paragraph>
        </div>
        {account && (
          <Info className='w-auto justify-between lg:w-[550px] lg:p-8'>
            <div className='flex items-center gap-4'>
              <CoinsStackedIcon className='h-4 w-4 min-w-fit stroke-primary-600 lg:h-8 lg:w-8' />
              <p className='text-base leading-tight lg:text-xl'>
                Total Rewards: ${formatAmount(isExpected ? totalExpectedUsd : totalUsd)}
              </p>
            </div>
            {!isExpected && (
              <TertiaryButton
                className='min-w-fit'
                onClick={() => {
                  onClaimAll(veRewards, filteredVeTHEs, () => currentMutate())
                }}
                disabled={allPending || totalUsd.isZero()}
              >
                Claim all rewards
              </TertiaryButton>
            )}
          </Info>
        )}
      </div>
      {!account && <NotConnected />}
      {account && (
        <>
          <Selection className='w-fit' data={typeSelections} />
          {isExpected ? (
            <NextRewards rewards={expectedRewards} />
          ) : (
            <CurrentRewards rewards={currentRewards} currentMutate={currentMutate} />
          )}
        </>
      )}
    </div>
  )
}
