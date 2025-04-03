import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'

import SelectVotingPairsAndWeights from '../SelectVotingPairsAndWeights'

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

function Step2Vote({ setStep2Active, minFunds, isLoadingMinFunds }) {
  const { createData } = useSelector(state => state.veTHEAutomationContract)
  const dispatch = useDispatch()
  const [data, setData] = useState({ ...createData })

  useEffect(() => {
    setStep2Active(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    dispatch(
      createVeTHEAutomationContract({
        createData: data,
      }),
    )
  }, [dispatch, data])

  useEffect(() => {
    if (!data?.votes?.isAutoVote) {
      const pairFilter = [...(data?.votes?.pairs || [])].filter(item => Boolean(item.pair))
      if (pairFilter.length === data?.votes?.pairs?.length) return
      setData(prev => ({
        ...prev,
        votes: {
          ...prev.votes,
          pairs: pairFilter,
        },
      }))
    }
  }, [data?.votes?.isAutoVote, data.votes.pairs])

  const handleVotingPairs = useCallback((action, payload) => {
    setData(prev => {
      if (!prev?.votes) return prev

      const currentVotes = prev.votes
      const updatedVotes = { ...currentVotes }

      switch (action) {
        case 'TOGGLE_AUTO':
          updatedVotes.isAutoVote = !currentVotes.isAutoVote
          break

        case 'UPDATE_PAIR': {
          const { pair, index } = payload
          const updatedPairs = [...currentVotes.pairs]
          if (index !== -1) {
            updatedPairs[index] = { ...pair, pair: { ...pair.pair, subpools: [] } }
          }
          updatedVotes.pairs = updateWeight(updatedPairs)
          break
        }

        case 'ADD_PAIR': {
          updatedVotes.pairs = [...currentVotes.pairs, { lock: false, weight: 0, pair: undefined }]
          break
        }

        case 'REMOVE_PAIR': {
          const { index } = payload
          const newArray = [...currentVotes.pairs.slice(0, index), ...currentVotes.pairs.slice(index + 1)]
          updatedVotes.pairs = updateWeight(newArray)
          break
        }

        default:
          return prev
      }

      if (JSON.stringify(currentVotes) === JSON.stringify(updatedVotes)) {
        return prev
      }

      return { ...prev, votes: updatedVotes }
    })
  }, [])

  return (
    <SelectVotingPairsAndWeights
      data={data}
      handleVotingPairs={handleVotingPairs}
      minFunds={minFunds}
      isLoadingMinFunds={isLoadingMinFunds}
    />
  )
}

export default Step2Vote
