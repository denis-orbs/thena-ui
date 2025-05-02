import BigNumber from 'bignumber.js'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import VeTheDropdown from '@/components/dropdown/VeTheDropdown'
import { NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { CHAIN_ID } from '@/constant/contracts'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import useDebounce from '@/hooks/useDebounce'
import { useEpochTimer } from '@/hooks/useGeneral'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getVeTHEContract } from '@/lib/contracts'
import { formatAmount } from '@/lib/utils'
import { useV3PoolsWithGauge } from '@/state/pools/hooks'

import VotingChart from '../Chart/VotingChart'

function Voting() {
  const { push } = useRouter()
  const t = useTranslations()
  const { epochStart, epochEnd, epoch, days, seconds, mins, hours } = useEpochTimer()
  const [veTHEId, setVeTHEId] = useState(null)
  const [approvedId, setApprovedId] = useState('')

  const { account, chainId } = useWallet()
  const v3PoolsWithGauge = useV3PoolsWithGauge()
  const { veTHEs } = useVeTHEsContext()

  const debouncedId = useDebounce(approvedId)
  const { data: isApproved } = useSWR(
    debouncedId &&
      account &&
      (chainId === ChainId.BSC || chainId === CHAIN_ID.TEST_BSC) && ['vethe/approved', debouncedId, account],
    async () => {
      const veTHEContract = getVeTHEContract(chainId)
      return await readCall(veTHEContract, 'isApprovedOrOwner', [account, debouncedId], chainId)
    },
    {
      refreshInterval: 0,
    },
  )

  useEffect(() => {
    if (isApproved) {
      setVeTHEId(approvedId)
    }
  }, [isApproved, approvedId])

  const veTHE = useMemo(() => {
    const list = [...veTHEs]
    let result = veTHEId ? list.find(item => Number(item?.id) === Number(veTHEId)) : null
    if (!result && !isEmpty(list)) {
      // veTHE with the most voting power and prioritize the "Not Voted" one
      result = [...(list || [])].sort((a, b) => b.voting_amount - a.voting_amount).find(ve => !ve.votedCurrentEpoch)
      if (!result) {
        // veTHE with the most voting power
        const sorted = [...(list || [])].sort((a, b) => b.voting_amount - a.voting_amount)
        result = sorted?.[0]
      }
    }
    return result
  }, [veTHEs, veTHEId])

  const userPools = useMemo(
    () =>
      v3PoolsWithGauge
        .map(pair => {
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
        })
        .filter(pool => !pool.votes.weight.isZero()),
    [v3PoolsWithGauge, veTHE],
  )

  const totalRewards = useMemo(
    () => (v3PoolsWithGauge || []).reduce((sum, pool) => sum.plus(pool.gauge.bribeUsd), new BigNumber(0)),
    [v3PoolsWithGauge],
  )

  return (
    <Box className='flex flex-col !p-4'>
      {veTHEs.length > 0 ? (
        <>
          <div className='flex justify-between gap-2'>
            <div className='flex flex-col'>
              <TextHeading className='font-archia text-xl font-semibold'>
                {t('Voting for [value]', { value: formatAmount(totalRewards) })}
              </TextHeading>
              <Paragraph className='text-neutral-500 lg:text-sm'>{`${epochStart}-${epochEnd}`}</Paragraph>
            </div>

            <VeTheDropdown
              className='z-40 w-[120px] pl-1.5'
              data={veTHEs
                .filter(ve => ve.voting_amount.gt(0))
                .map(item => ({
                  ...item,
                  label: `ID #${item.id}`,
                }))}
              selected={veTHE ? `ID #${veTHE.id}` : ''}
              setSelected={ele => setVeTHEId(ele.id)}
              placeHolder={t('Select veTHE')}
              isLocale={false}
              isApproved={isApproved}
              approvedId={approvedId}
              setApprovedId={setApprovedId}
              classNames={{ trailingIcon: 'right-0.5 z-40', input: 'py-0 pl-1 text-neutral-400' }}
            />
          </div>

          <div className='fex flex-col gap-4'>
            <div className='flex items-center justify-center'>
              <VotingChart className='h-[260px] w-[260px]' data={userPools} />
            </div>
          </div>

          <div className='flex flex-col gap-4'>
            {seconds <= 120 ? (
              <NewTextHeading className='text-center text-xl text-error-600 md:text-xl'>
                {t('Epoch [epoch] End in [seconds]', { epoch, seconds })}
              </NewTextHeading>
            ) : (
              <div className='flex flex-col text-center'>
                <Paragraph className='text-neutral-500 lg:text-sm'>{t('Epoch [epoch] End in', { epoch })}</Paragraph>
                <NewTextHeading className='text-primary-300 md:text-3xl'>
                  {days === 0 ? (hours === 0 ? `${mins} Mins` : `${hours} Hours ${mins} Mins`) : `${days} Days`}
                </NewTextHeading>
              </div>
            )}

            <div className='flex gap-3'>
              <EmphasisButton className='w-1/2 max-md:h-8 max-md:text-xs' onClick={() => push('/dashboard/rewards')}>
                {t('Rewards')}
              </EmphasisButton>
              <EmphasisButton className='w-1/2 max-md:h-8 max-md:text-xs' onClick={() => push('/dashboard/vote')}>
                {t('Vote')}
              </EmphasisButton>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </Box>
  )
}

export default Voting
