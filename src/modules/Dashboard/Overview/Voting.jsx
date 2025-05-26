import BigNumber from 'bignumber.js'
import { isEmpty } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import VeTheDropdown from '@/components/dropdown/VeTheDropdown'
import { NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { CHAIN_ID } from '@/constant/contracts'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import useDebounce from '@/hooks/useDebounce'
import { useEpochTimer } from '@/hooks/useGeneral'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getVeTHEContract } from '@/lib/contracts'
import { cn, formatAmount } from '@/lib/utils'
import { useV3PoolsWithGauge } from '@/state/pools/hooks'
import { ExternalIcon } from '@/svgs'

import VotingChart from '../Chart/VotingChart'
import SectionDivider from '../SectionDivider'

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
      return readCall(veTHEContract, 'isApprovedOrOwner', [account, debouncedId], chainId)
    },
    { refreshInterval: 0 },
  )

  useEffect(() => {
    if (isApproved) {
      setVeTHEId(approvedId)
    }
  }, [isApproved, approvedId])

  const filteredVeTHEs = useMemo(() => veTHEs.filter(ve => ve.voting_amount.gt(0)), [veTHEs])
  const veTHE = useMemo(() => {
    const list = [...filteredVeTHEs]
    let result = veTHEId ? list.find(item => Number(item?.id) === Number(veTHEId)) : null
    if (!result && !isEmpty(list)) {
      // veTHE with the most voting power and prioritize the "Not Voted" one
      result = list.sort((a, b) => b.voting_amount - a.voting_amount).find(ve => !ve.votedCurrentEpoch)
      if (!result) {
        // veTHE with the most voting power
        const sorted = list.sort((a, b) => b.voting_amount - a.voting_amount)
        result = sorted?.[0]
      }
    }
    return result
  }, [filteredVeTHEs, veTHEId])

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

  const timeDisplay = useMemo(() => {
    const twoDays = 2 * 24 * 60 * 60
    const twoHours = 2 * 60 * 60
    const twoMins = 2 * 60
    if (seconds < twoMins) {
      return `${seconds} Seconds`
    }
    if (seconds < twoHours) {
      return `${Number(hours) * 60 + Number(mins)} Minutes`
    }
    if (seconds < twoDays) {
      return `${Number(days) * 24 + Number(hours)} Hours`
    }
    return `${days} Days`
  }, [days, hours, mins, seconds])

  return (
    <>
      <Box className={cn('flex h-full flex-col justify-between gap-2 !p-4', !veTHEs.length && 'gap-4')}>
        {veTHEs.length > 0 ? (
          <>
            <div className='flex justify-between gap-2'>
              <div className='flex flex-col'>
                <TextHeading className='font-archia text-xl font-semibold leading-6'>
                  {t('Voting for [value]', { value: formatAmount(totalRewards) })}
                </TextHeading>
                <Paragraph className='text-neutral-500 lg:text-sm'>{`${epochStart}-${epochEnd}`}</Paragraph>
              </div>

              <VeTheDropdown
                className='z-40 w-[120px] pl-1.5'
                data={filteredVeTHEs.map(item => ({ ...item, label: `ID #${item.id}` }))}
                selected={veTHE ? `ID #${veTHE.id}` : ''}
                setSelected={ele => setVeTHEId(ele.id)}
                placeHolder={t('Select ID')}
                isLocale={false}
                isApproved={isApproved}
                approvedId={approvedId}
                setApprovedId={setApprovedId}
                classNames={{ trailingIcon: 'right-0.5 z-40', input: 'py-0 pl-1 text-neutral-400' }}
              />
            </div>

            <div className='fex flex-col'>
              <div className='flex items-center justify-center'>
                <VotingChart data={userPools} />
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              <div className='flex flex-col text-center'>
                <Paragraph className='text-neutral-500 lg:text-sm'>{t('Epoch [epoch] End in', { epoch })}</Paragraph>
                <NewTextHeading className='text-primary-300 md:text-3xl'>{timeDisplay}</NewTextHeading>
              </div>

              <div className='flex gap-2'>
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
          <>
            <div className='flex h-[215px] flex-col justify-end gap-4 pb-11 text-center'>
              <NewTextHeading className='text-gradient-primary-b text-5xl md:text-5xl'>
                ${formatAmount(totalRewards)}
              </NewTextHeading>
              <NewTextHeading className='text-xl md:text-xl'>{t('Earned by veTHE Voters')}</NewTextHeading>
            </div>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-[9px] text-center'>
                <Paragraph className='text-neutral-500'>{t('Empty Voting')}</Paragraph>
                <NewTextHeading className='flex justify-center gap-1.5 text-xl leading-6 md:text-xl'>
                  <span className='leading-6 text-primary-300'>{t('Next distribution in')}</span>
                  <span className='leading-6 text-primary-600'>{timeDisplay}</span>
                </NewTextHeading>
              </div>
              <div className='flex flex-col gap-2'>
                <Link
                  className='h-11 w-full max-md:h-8'
                  href='https://docs.thena.fi/thena/the-tokenomics/vethe-guide'
                  target='_blank'
                >
                  <TextButton className='h-11 w-full max-md:h-8'>
                    <Paragraph>Learn about voting</Paragraph>
                    <ExternalIcon className='size-4 stroke-neutral-100 md:size-5' />
                  </TextButton>
                </Link>

                <div className='flex gap-2'>
                  <EmphasisButton className='w-1/2 max-md:h-8 max-md:text-xs' onClick={() => push('/dashboard/vote')}>
                    {t('Vote')}
                  </EmphasisButton>
                  <PrimaryButton
                    className='w-1/2 px-3 max-md:h-8 max-md:text-xs'
                    onClick={() => push('/dashboard/lock')}
                  >
                    {t('Create your veTHE')}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </>
        )}
      </Box>

      <SectionDivider />
    </>
  )
}

export default Voting
