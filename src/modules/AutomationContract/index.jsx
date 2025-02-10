import { useQuery } from '@tanstack/react-query'
import React from 'react'

import Loading from '@/app/loading'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'
import useWallet from '@/hooks/useWallet'
import { fetchAutomationHistory } from '@/lib/api'

import AutomationDetails from './automationDetails/AutomationDetails'
import Head from './head/Head'
import HistoryContract from './history/HistoryContract'
import LockDetails from './lockDetails/LockDetails'
import WarningWithAction from './WarningWithAction'

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
    <div className='space-y-11'>
      <Head veTHE={veTHE} />
      <WarningWithAction contractData={contractData} mutateAutomationData={mutateAutomationData} />
      <LockDetails contractData={contractData} veTHE={veTHE} />
      <AutomationDetails
        contractData={contractData}
        transactionHash={historyData.transactionHash}
        date={historyData.date}
      />
      <HistoryContract histories={historyData?.histories} />
    </div>
  )
}

export default AutomationContractDetail
