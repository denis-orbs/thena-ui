import React, { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

import { OutlinedButton } from '@/components/buttons/Button'
import Toggle from '@/components/toggle'
import { TextHeading } from '@/components/typography'
import { InfoIcon, PlusIcon } from '@/svgs'

import VotingPairItem from './Steps/votingPairs/VotingPairItem'

const UPDATE_TYPE = {
  AUTO: 'isAutoVote',
  PAIRS: 'pairs',
}

function SelectVotingPairsAndWeights({ data, updateVotingPairs, onRemovePair, onAddPair }) {
  const t = useTranslations()
  const [totalWeight, setTotalWeight] = useState(0)

  useEffect(() => {
    const tokens = [...data.votes.pairs].filter(item => item.pair !== undefined)
    setTotalWeight(tokens.reduce((sum, curr) => sum + curr.weight, 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)])
  return (
    <div className='w-full space-y-6'>
      <div className='flex items-center gap-1'>
        <Toggle
          checked={data.votes.isAutoVote}
          onChange={() => updateVotingPairs(UPDATE_TYPE.AUTO)}
          label='Automatically vote each epoch'
        />
        <InfoIcon className='h-4 w-4 stroke-neutral-400' />
      </div>
      {data.votes.isAutoVote && (
        <>
          <div className='space-y-3'>
            <TextHeading>{t('Select Voting Pairs and Weights')}</TextHeading>
            <div className='divide-y divide-neutral-700 rounded-xl border border-neutral-700'>
              {data.votes.pairs.map((item, index) => (
                <VotingPairItem
                  key={`${item?.address}_${index}`}
                  pair={item}
                  onSelected={pair => updateVotingPairs(UPDATE_TYPE.PAIRS, pair, index)}
                  pairsSelected={data.votes.pairs}
                  onRemovePair={() => onRemovePair(index)}
                />
              ))}
            </div>
            <OutlinedButton
              className='h-11 w-[130px] border border-primary-600 p-0 text-primary-600 hover:text-primary-600'
              onClick={onAddPair}
            >
              <PlusIcon className='h-4 w-4 !stroke-primary-600' />
              {t('Add Pair')}
            </OutlinedButton>
          </div>
          <div className='space-y-2'>
            <div className='flex flex-row justify-between'>
              <TextHeading>{t('Total Allocated')}</TextHeading>
              <span>{totalWeight}%</span>
            </div>
            <div className='mt-3 inline-block h-3 w-full rounded-md bg-neutral-500'>
              <div
                style={{
                  width: `${totalWeight > 100 ? 100 : totalWeight}%`,
                }}
                className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SelectVotingPairsAndWeights
