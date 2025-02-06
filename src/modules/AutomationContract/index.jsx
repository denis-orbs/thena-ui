import React from 'react'

import Loading from '@/app/loading'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'

import AutomationDetails from './automationDetails/AutomationDetails'
import Head from './head/Head'
import HistoryContract from './history/HistoryContract'
import LockDetails from './lockDetails/LockDetails'
import WarningWithAction from './WarningWithAction'

function AutomationContractDetail({ tokenId }) {
  const { contractData, mutateAutomationData, isLoading } = useAutomationContractDetail(tokenId)

  const { veTHEId } = contractData
  const { veTHEs } = useVeTHEsContext()
  const veTHE = veTHEs.find(ve => ve.id.toString() === veTHEId)
  if (isLoading || !veTHE || !contractData.address || !tokenId) return <Loading />
  return (
    <div className='space-y-11'>
      <Head veTHE={veTHE} />
      <WarningWithAction contractData={contractData} mutateAutomationData={mutateAutomationData} />
      <LockDetails contractData={contractData} veTHE={veTHE} />
      <AutomationDetails contractData={contractData} />
      <HistoryContract />
    </div>
  )
}

export default AutomationContractDetail
