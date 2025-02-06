import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'

import SelectVotingPairsAndWeights from '../SelectVotingPairsAndWeights'

const UPDATE_TYPE = {
  AUTO: 'isAutoVote',
  PAIRS: 'pairs',
}

export const updateWeight = pairs => {
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

function Step2Vote() {
  const { createData } = useSelector(state => state.veTHEAutomationContract)
  const dispatch = useDispatch()

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
    <SelectVotingPairsAndWeights
      data={createData}
      onAddPair={onAddPair}
      onRemovePair={onRemovePair}
      updateVotingPairs={updateVotingPairs}
    />
  )
}

export default Step2Vote
