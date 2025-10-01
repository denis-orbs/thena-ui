import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import React from 'react'

import Loading from '@/app/loading'
import { VE_AUTOMATION_HISTORY_TYPES } from '@/constant'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'
import useWallet from '@/hooks/useWallet'
import { vetheClient } from '@/lib/graphql'

import AutomationDetails from './automationDetails/AutomationDetails'
import Head from './head/Head'
import HistoryContract from './history/HistoryContract'
import LockDetails from './lockDetails/LockDetails'
import WarningWithAction from './WarningWithAction'

const VE_AUTOMATION_HISTORIES = gql`
  query veAutomationHistories($tokenId: String!) {
    veTheAutomations(where: { tokenId: $tokenId }) {
      address: id
      date: createdAt
      transactionHash
    }
    veAutomationHistories(where: { tokenId: $tokenId }, orderBy: timestamp, orderDirection: desc) {
      amount
      timestamp
      type
      transactionHash
    }
  }
`

const fetchAutomationHistory = async (chainId, tokenId) => {
  try {
    const data = await vetheClient[chainId].request(VE_AUTOMATION_HISTORIES, {
      tokenId,
    })
    const automation = data?.veTheAutomations?.[0]
    const histories = (data?.veAutomationHistories || []).map(history => ({
      ...history,
      type: VE_AUTOMATION_HISTORY_TYPES[history.type],
    }))

    return { ...automation, histories }
  } catch (error) {
    console.error('Failed to fetch automation history', error)
    return undefined
  }
}

function AutomationContractDetail({ tokenId }) {
  const { contractData, mutateAutomationData, isLoading } = useAutomationContractDetail(tokenId)
  const { chainId } = useWallet()

  const { veTHEId } = contractData
  const { veTHEs } = useVeTHEsContext()
  const veTHE = veTHEs.find(ve => ve.id.toString() === veTHEId)

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['automation-history', chainId, tokenId],
    queryFn: () => fetchAutomationHistory(chainId, tokenId),
    enabled: !!chainId && !!tokenId,
    refetchInterval: 30000,
  })

  if (isLoading || !veTHE || !contractData.address || !tokenId || isHistoryLoading) return <Loading />
  return (
    <div className='flex flex-col gap-11'>
      <Head veTHE={veTHE} />
      <WarningWithAction contractData={contractData} mutateAutomationData={mutateAutomationData} />
      <LockDetails contractData={contractData} veTHE={veTHE} />
      <AutomationDetails
        contractData={contractData}
        transactionHash={historyData?.transactionHash}
        date={historyData?.date}
      />
      <HistoryContract histories={historyData?.histories} />
    </div>
  )
}

export default AutomationContractDetail
