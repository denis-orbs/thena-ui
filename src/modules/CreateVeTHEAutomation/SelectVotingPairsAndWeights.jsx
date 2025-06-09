import React, { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

import { OutlinedButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { chainLINKLogo } from '@/constant'
import usePrices from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'
import { InfoIcon, PlusIcon } from '@/svgs'

import VotingPairItem from './Steps/votingPairs/VotingPairItem'

function SelectVotingPairsAndWeights({ data, handleVotingPairs, minFunds, isLoadingMinFunds }) {
  const t = useTranslations()
  const [totalWeight, setTotalWeight] = useState(0)
  const prices = usePrices()
  useEffect(() => {
    const tokens = [...data.votes.pairs].filter(item => item.pair !== undefined)
    setTotalWeight(tokens.reduce((sum, curr) => sum + curr.weight, 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)])

  return (
    <div className='flex w-full flex-col gap-6'>
      <div className='flex items-center gap-1'>
        <Toggle
          checked={data.votes.isAutoVote}
          onChange={() => handleVotingPairs('TOGGLE_AUTO')}
          label='Automatically vote each epoch'
        />
      </div>
      {data.votes.isAutoVote && (
        <>
          <div className='flex flex-col gap-3'>
            <TextHeading>{t('Select Voting Pairs and Weights')}</TextHeading>
            <div className='divide-y divide-neutral-700 rounded-xl border border-neutral-700'>
              {data.votes.pairs.map((item, index) => (
                <VotingPairItem
                  key={`${item?.pair?.address}_${index}`}
                  pair={item}
                  onSelected={pair => handleVotingPairs('UPDATE_PAIR', { pair, index })}
                  pairsSelected={data.votes.pairs}
                  onRemovePair={() => handleVotingPairs('REMOVE_PAIR', { index })}
                />
              ))}
            </div>
            <OutlinedButton
              className='border-primary-600 text-primary-600 hover:text-primary-600 h-11 w-[130px] border p-0'
              onClick={() => handleVotingPairs('ADD_PAIR')}
            >
              <PlusIcon className='stroke-primary-600! h-4 w-4' />
              {t('Add Pair')}
            </OutlinedButton>
          </div>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-row justify-between'>
              <TextHeading>{t('Total Allocated')}</TextHeading>
              <span>{totalWeight}%</span>
            </div>
            <div className='mt-3 inline-block h-3 w-full rounded-md bg-neutral-500'>
              <div
                style={{
                  width: `${totalWeight > 100 ? 100 : totalWeight}%`,
                }}
                className='block h-full rounded-md bg-linear-to-r from-[#B386FF] to-[#FF86FA]'
              />
            </div>
          </div>
        </>
      )}
      {minFunds && (
        <>
          <Divider />
          <div className='flex flex-row items-center justify-between'>
            <div className='flex flex-row items-center gap-1'>
              <TextHeading className='text-base lg:text-lg'>{t('Minimum Link Balance needed')}</TextHeading>

              <InfoIcon data-tooltip-id='setting-mind-funds' className='h-4 w-4 stroke-neutral-400 max-lg:hidden' />
              <CustomTooltip className='z-40' id='setting-mind-funds' place='bottom'>
                {t('This is the estimated total deposit based on your current contract settings')}
              </CustomTooltip>
            </div>
            <div className='flex flex-row items-center gap-1'>
              {isLoadingMinFunds ? (
                <>
                  <Skeleton className='h-6 w-24' />
                  <Skeleton className='h-6 w-24' />
                </>
              ) : (
                <>
                  <Paragraph className='max-lg:hidden'>${`${formatAmount(minFunds * prices.CHAINLINK)}`}</Paragraph>
                  <TextHeading>{`${formatAmount(minFunds)}`}</TextHeading>
                  <CircleImage alt='CHAIN LINK logo' className='size-4' src={chainLINKLogo} />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SelectVotingPairsAndWeights
