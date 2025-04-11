import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import VeTheDropdown from '@/components/dropdown/VeTheDropdown'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
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
  const { epochStart, epochEnd, epoch, days } = useEpochTimer()
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
    if (!result) {
      result = list.find(ve => ve.votedCurrentEpoch)
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
    () => userPools.reduce((sum, pool) => sum.plus(pool.gauge.bribeUsd), new BigNumber(0)),
    [userPools],
  )

  return (
    <Box className='flex flex-col gap-2 !pb-4 !pt-9 md:!py-3'>
      <div className='flex items-center justify-between gap-2'>
        <TextHeading className='font-archia text-xl font-semibold'>
          {t('Voting for [value]', { value: formatAmount(totalRewards) })}
        </TextHeading>
        <VeTheDropdown
          className='z-40 w-[145px] px-1.5 py-1'
          data={veTHEs
            .filter(ve => ve.voting_amount.gt(0))
            .map(item => ({
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
          classNames={{ trailingIcon: 'right-0 z-40' }}
        />
      </div>

      <div className='fex flex-col gap-4'>
        <Paragraph>{`${t('Epoch')} ${epoch} ${epochStart}-${epochEnd}`}</Paragraph>
        <div className='flex items-center justify-center'>
          <VotingChart className='h-[260px] w-[260px]' data={userPools} />
        </div>
      </div>
      <TextSubHeading className='font-archia text-xl font-semibold'>
        {t('Epoch End in')} <span className='text-primary-700'>{days} Days</span>
      </TextSubHeading>
      <EmphasisButton className='w-full' onClick={() => push('/dashboard/vote')}>
        {t('Vote')}
      </EmphasisButton>
    </Box>
  )
}

export default Voting
