'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useContext, useMemo, useState } from 'react'
import useSWR from 'swr'

import { Info } from '@/components/alert'
import { TertiaryButton } from '@/components/buttons/Button'
import VeTheDropdown from '@/components/dropdown/VeTheDropdown'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import { rewardsContext } from '@/context/rewardsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import useDebounce from '@/hooks/useDebounce'
import usePrices from '@/hooks/usePrices'
import { useClaimAll } from '@/hooks/useVeThe'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getVeTHEContract } from '@/lib/contracts'
import { formatAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { CoinsStackedIcon } from '@/svgs'

import CurrentRewards from './currentRewards'
import VotingHistory from './votingHistory'
import NotConnected from '../NotConnected'

const RewardsTab = {
  CURRENT: 'current',
  HISTORY: 'history',
  V2_REWARDS: 'v2_rewards',
}

// TODO: V2 rewards
export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState(RewardsTab.CURRENT)
  const { account } = useWallet()
  const prices = usePrices()
  const { veTHEs } = useVeTHEsContext()
  const { current } = useContext(rewardsContext)
  const { rewards: veRewards, currentMutate } = current
  const { onClaimAll, pending: allPending } = useClaimAll()
  const t = useTranslations()

  const [approvedId, setApprovedId] = useState('All')
  const { networkId } = useChainSettings()
  const debouncedId = useDebounce(approvedId)

  const filteredVeTHEs = useMemo(() => veTHEs.filter(ele => ele.rebase_amount.gt(0)), [veTHEs])

  const [veTHEId, setVeTHEId] = useState('All')
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

  const currentRewards = useMemo(() => [...filteredVeTHEs, ...veRewards], [filteredVeTHEs, veRewards])

  const totalUsd = useMemo(() => {
    let total = [...veRewards].reduce((sum, curr) => sum.plus(curr.totalUsd), new BigNumber(0))
    filteredVeTHEs.forEach(ele => {
      total = total?.plus(ele?.rebase_amount?.times(prices.THE))
    })
    return total
  }, [veRewards, filteredVeTHEs, prices.THE])

  const typeSelections = useMemo(
    () => [
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
    ],
    [activeTab],
  )

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col justify-between gap-4 lg:flex-row'>
        <div className='flex flex-col gap-2'>
          <h2>{t('Rewards')}</h2>
          <Paragraph>{t('Rewards Description')}</Paragraph>
        </div>
        {account && (
          <Info className='flex w-auto justify-between lg:w-[550px] lg:p-8'>
            <div className='flex items-center gap-4'>
              <CoinsStackedIcon className='h-4 w-4 min-w-4 stroke-primary-600 lg:h-8 lg:w-8 lg:min-w-8' />
              <p className='text-base leading-tight lg:text-xl'>
                {t('Total Rewards:')} ${formatAmount(totalUsd)}
              </p>
            </div>
            {activeTab !== RewardsTab.HISTORY && (
              <TertiaryButton
                className='min-w-fit'
                onClick={() => {
                  onClaimAll(veRewards, filteredVeTHEs, () => currentMutate())
                }}
                disabled={allPending || totalUsd.isZero()}
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
          {activeTab === RewardsTab.HISTORY ? (
            <VotingHistory veTHEId={veTHEId} />
          ) : (
            <CurrentRewards rewards={currentRewards} currentMutate={currentMutate} />
          )}
        </>
      ) : (
        <NotConnected />
      )}
    </div>
  )
}
