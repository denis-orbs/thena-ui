'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'

import { useVeTHEsContext } from '@/context/veTHEsContext'
import CreateVeTHEAutomation from '@/modules/CreateVeTHEAutomation'
import { createVeTHEAutomationContract, setSelectedVeTHE } from '@/state/veTHEAutomationContract/action'
import { getDefaultExecutionTime } from '@/state/veTHEAutomationContract/reducer'

function CreateAutomationPage({ params }) {
  const { id } = params
  const { veTHEs, isLoading } = useVeTHEsContext()
  const dispatch = useDispatch()
  const prevVeTHEIdRef = useRef(null)
  const veTHE = useMemo(() => veTHEs.find(the => the.id === Number(id)), [id, veTHEs])
  useEffect(() => {
    if (isLoading) return
    if (veTHE) {
      dispatch(
        setSelectedVeTHE({
          veTHESelected: {
            ...veTHE,
            amount: veTHE.amount.toString(),
            rebase_amount: veTHE.rebase_amount.toString(),
            voting_amount: veTHE.voting_amount.toString(),
          },
        }),
      )

      if (prevVeTHEIdRef.current !== veTHE.id) {
        dispatch(
          createVeTHEAutomationContract({
            createData: {
              veTHEId: veTHE.id,
              settings: {
                isClaimEveryWeek: true,
                isRelockEveryWeek: true,
                executionTime: getDefaultExecutionTime(),
              },
              votes: {
                isAutoVote: false,
                pairs: [
                  {
                    lock: false,
                    weight: 100,
                    pair: undefined,
                  },
                ],
              },
            },
          }),
        )

        prevVeTHEIdRef.current = veTHE.id
      }
    }
  }, [dispatch, id, isLoading, veTHE])
  return (
    <div className='container mx-auto'>
      <CreateVeTHEAutomation />
    </div>
  )
}

export default CreateAutomationPage
