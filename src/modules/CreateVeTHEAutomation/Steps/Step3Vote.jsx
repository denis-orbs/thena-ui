import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { OutlinedButton } from '@/components/buttons/Button'
import Toggle from '@/components/toggle'
import { TextHeading } from '@/components/typography'
import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'
import { InfoIcon, PlusIcon } from '@/svgs'

import VotingPairItem from './votingPairs/VotingPairItem'

const UPDATE_TYPE = {
  AUTO: 'isAutoVote',
  PAIRS: 'pairs',
}

const updateWeight = pairs => {
  const weightLocked = pairs.filter(item => item.lock).reduce((sum, cur) => sum + cur.weight, 0)
  const pairUnLock = pairs.filter(item => !item.lock && item.pair !== undefined)
  if (pairUnLock.length === 0) return pairs

  let newWeight = (100 - weightLocked) / pairUnLock.length
  newWeight = Math.round(newWeight * 100) / 100

  let totalWeight = 0
  const newData = pairUnLock.map(i => {
    const roundedWeight = Math.round(newWeight * 100) / 100
    totalWeight += roundedWeight
    return {
      ...i,
      weight: roundedWeight,
    }
  })

  let difference = Math.round((100 - weightLocked - totalWeight) * 100) / 100

  if (difference !== 0) {
    newData.forEach((item, index) => {
      if (difference === 0) return

      const adjustment = difference > 0 ? 0.01 : -0.01
      newData[index].weight = Math.round((item.weight + adjustment) * 100) / 100
      difference -= adjustment
      difference = Math.round(difference * 100) / 100
    })
  }

  return pairs.map(item => {
    if (!item.lock && item.pair != null) {
      return newData.find(i => i.pair.address === item.pair.address) || item
    }
    return item
  })
}

function Step3Vote() {
  const t = useTranslations()
  const { createData } = useSelector(state => state.veTHEAutomationContract)
  const dispatch = useDispatch()

  const [totalWeight, setTotalWeight] = useState(0)

  useEffect(() => {
    const tokens = [...createData.votes.pairs].filter(item => item.pair !== undefined)
    setTotalWeight(tokens.reduce((sum, curr) => sum + curr.weight, 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(createData)])

  const updateVotingPairs = useCallback(
    (type, pair, index) => {
      const currentVotes = createData?.votes
      const updatedVotes = (() => {
        switch (type) {
          case UPDATE_TYPE.AUTO:
            return {
              ...currentVotes,
              isAutoVote: !currentVotes.isAutoVote,
            }
          case UPDATE_TYPE.PAIRS: {
            const updatedPairs = [...currentVotes.pairs]
            updatedPairs[index] = { ...pair, pair: { ...pair.pair, subpools: [] } }
            const newPairs = updateWeight(updatedPairs)
            return {
              ...currentVotes,
              pairs: newPairs,
            }
          }
          default:
            return currentVotes
        }
      })()

      if (JSON.stringify(currentVotes) !== JSON.stringify(updatedVotes)) {
        dispatch(
          createVeTHEAutomationContract({
            createData: {
              ...createData,
              votes: updatedVotes,
            },
          }),
        )
      }
    },
    [createData, dispatch],
  )

  const onAddPair = useCallback(() => {
    const pairsArr = [...createData.votes.pairs]
    pairsArr.push({
      lock: false,
      weight: 0,
      pair: undefined,
    })
    dispatch(
      createVeTHEAutomationContract({
        createData: {
          ...createData,
          votes: {
            ...createData.votes,
            pairs: pairsArr,
          },
        },
      }),
    )
  }, [createData, dispatch])

  const onRemovePair = useCallback(
    index => {
      const pairsArr = [...createData.votes.pairs]
      pairsArr.splice(index, 1)
      const newPairs = updateWeight(pairsArr)
      dispatch(
        createVeTHEAutomationContract({
          createData: {
            ...createData,
            votes: {
              ...createData.votes,
              pairs: newPairs,
            },
          },
        }),
      )
    },
    [createData, dispatch],
  )

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-1'>
        <Toggle
          checked={createData.votes.isAutoVote}
          onChange={() => updateVotingPairs(UPDATE_TYPE.AUTO)}
          label='Automatically vote each epoch'
        />
        <InfoIcon className='h-4 w-4 stroke-neutral-400' />
      </div>
      <div className='space-y-3'>
        <TextHeading>{t('Select Voting Pairs and Weights')}</TextHeading>
        <div className='divide-y divide-neutral-700 rounded-xl border border-neutral-700'>
          {createData.votes.pairs.map((item, index) => (
            <VotingPairItem
              key={`${item?.address}_${index}`}
              pair={item}
              onSelected={data => updateVotingPairs(UPDATE_TYPE.PAIRS, data, index)}
              pairsSelected={createData.votes.pairs}
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
          <TextHeading>{t('Total Allocated')}:</TextHeading>
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
    </div>
  )
}

export default Step3Vote
