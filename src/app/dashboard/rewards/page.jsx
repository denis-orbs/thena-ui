'use client'

import { useTranslations } from 'next-intl'
import React, { useContext, useMemo, useState } from 'react'
import useSWR from 'swr'

import { VeRewardsContext } from '@/app/dashboard/VeRewardsContext'
import { useVeTHEsContext } from '@/app/dashboard/VeTHEsContext'
import { Info } from '@/components/alert'
import { TertiaryButton } from '@/components/buttons/Button'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import VeTheDropdown from '@/components/dropdown/VeTheDropdown'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import usePrices from '@/hooks/usePrices'
import { useClaimAll, useClaimAllV2 } from '@/hooks/useVeThe'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getVeTHEContract } from '@/lib/contracts'
import { useChainSettings } from '@/state/settings/hooks'
import { formatAmount, ZERO_VALUE } from '@/utils/utils'

import CoinsStackedIcon from '~/svgs/coins-stacked.svg'

import CurrentRewards from './currentRewards'
import VotingHistory from './votingHistory'
import NotConnected from '../NotConnected'

const RewardsTab = {
  CURRENT: 'current',
  HISTORY: 'history',
  V2_REWARDS: 'v2_rewards',
}

export default function RewardsPage() {
  const t = useTranslations()

  const prices = usePrices()
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { veRewardsV3, veRewardsV3Mutate, veRewardsV2, veRewardsV2Mutate } = useContext(VeRewardsContext)
  const { veTHEs } = useVeTHEsContext()

  const [activeTab, setActiveTab] = useState(RewardsTab.CURRENT)
  const [approvedId, setApprovedId] = useState('All')
  const [veTHEId, setVeTHEId] = useState('All')
  const debouncedId = useDebounce(approvedId)
  const { handleClaimAllV2, pending: allPendingV2 } = useClaimAllV2()
  const { handleClaimAll, pending: allPendingV3 } = useClaimAll()

  const filteredVeTHEs = useMemo(() => veTHEs.filter(ele => ele.rebase_amount.gt(0)), [veTHEs])

  const { data: isApproved } = useSWR(
    debouncedId && account && networkId && ['vethe/approved', debouncedId, account, networkId],
    async () => {
      const veTHEContract = getVeTHEContract(networkId)
      return await readCall(veTHEContract, 'isApprovedOrOwner', [account, debouncedId], networkId)
    },
    {
      refreshInterval: 0,
    },
  )
  const veTHE = useMemo(() => {
    const list = [...veTHEs]
    return veTHEId ? list.find(item => Number(item?.id) === Number(veTHEId)) : null
  }, [veTHEs, veTHEId])

  const currentRewards = useMemo(() => [...filteredVeTHEs, ...veRewardsV3], [filteredVeTHEs, veRewardsV3])

  const totalUsd = useMemo(() => {
    let total = [...veRewardsV3].reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE)
    filteredVeTHEs.forEach(ele => {
      total = total?.plus(ele?.rebase_amount?.times(prices.THE))
    })
    return total
  }, [veRewardsV3, filteredVeTHEs, prices.THE])

  const totalUsdV2 = useMemo(
    () => veRewardsV2?.reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE) ?? ZERO_VALUE,
    [veRewardsV2],
  )

  const typeSelections = useMemo(() => {
    const selections = [
      {
        label: 'Current Epoch',
        active: activeTab === RewardsTab.CURRENT,
        onClickHandler: () => {
          setActiveTab(RewardsTab.CURRENT)
        },
      },
      {
        label: 'Voting History',
        active: activeTab === RewardsTab.HISTORY,
        onClickHandler: () => {
          setActiveTab(RewardsTab.HISTORY)
        },
      },
    ]

    if (veRewardsV2.length > 0) {
      selections.push({
        label: 'V2 Rewards',
        active: activeTab === RewardsTab.V2_REWARDS,
        onClickHandler: () => {
          setActiveTab(RewardsTab.V2_REWARDS)
        },
      })
    }

    return selections
  }, [activeTab, veRewardsV2])

  return (
    <LayoutWithBackButton backUrl='/dashboard'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col justify-between gap-4 lg:flex-row'>
          <div className='flex flex-col gap-2'>
            <h2>{t('Rewards')}</h2>
            <Paragraph>{t('Rewards Description')}</Paragraph>
          </div>

          {account && (
            <Info className='flex w-auto justify-between lg:w-[550px] lg:p-8'>
              <div className='flex items-center gap-4'>
                <CoinsStackedIcon className='stroke-primary-600 h-4 w-4 min-w-4 lg:h-8 lg:w-8 lg:min-w-8' />
                <p className='text-base leading-tight lg:text-xl'>
                  {t('Total Rewards:')} ${formatAmount(activeTab === RewardsTab.V2_REWARDS ? totalUsdV2 : totalUsd)}
                </p>
              </div>

              {activeTab !== RewardsTab.HISTORY && (
                <TertiaryButton
                  className='min-w-fit'
                  onClick={() => {
                    if (activeTab === RewardsTab.V2_REWARDS) {
                      handleClaimAllV2(veRewardsV2, [], () => veRewardsV2Mutate())
                    } else {
                      handleClaimAll(veRewardsV3, filteredVeTHEs, () => veRewardsV3Mutate())
                    }
                  }}
                  disabled={allPendingV3 || allPendingV2 || totalUsd.isZero()}
                >
                  {t('Claim All')}
                </TertiaryButton>
              )}
            </Info>
          )}
        </div>

        {account ? (
          <>
            <div className='flex flex-col justify-between gap-4 lg:flex-row'>
              <Selection className='h-11 w-fit' data={typeSelections} />
              {activeTab === RewardsTab.HISTORY && (
                <VeTheDropdown
                  className='w-full md:w-[200px]'
                  data={[{ id: 'All' }, ...veTHEs].map(item => ({
                    ...item,
                    label: item.id === 'All' ? 'All' : `veTHE #${item.id}`,
                  }))}
                  selected={veTHE ? `veTHE #${veTHE.id}` : ''}
                  setSelected={ele => setVeTHEId(ele.id)}
                  placeHolder={t('Select veTHE')}
                  isLocale={false}
                  isApproved={isApproved}
                  approvedId={approvedId}
                  setApprovedId={setApprovedId}
                />
              )}
            </div>

            {activeTab === RewardsTab.HISTORY && <VotingHistory veTHEId={veTHEId} />}
            {activeTab === RewardsTab.CURRENT && (
              <CurrentRewards rewards={currentRewards} currentMutate={veRewardsV3Mutate} version={3} />
            )}
            {activeTab === RewardsTab.V2_REWARDS && (
              <CurrentRewards rewards={veRewardsV2} currentMutate={veRewardsV2Mutate} version={2} />
            )}
          </>
        ) : (
          <NotConnected />
        )}
      </div>
    </LayoutWithBackButton>
  )
}
