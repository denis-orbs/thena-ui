import React from 'react'

import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'

import AutomationDetails from './automationDetails/AutomationDetails'
import Head from './head/Head'
import HistoryContract from './history/HistoryContract'
import LockDetails from './lockDetails/LockDetails'

function AutomationContractDetail({ tokenId }) {
  const { contractData, mutateAutomationData } = useAutomationContractDetail(tokenId)

  const { veTHEId } = contractData
  const { veTHEs } = useVeTHEsContext()
  const veTHE = veTHEs.find(ve => ve.id.toString() === veTHEId)
  return (
    <div className='space-y-11'>
      <Head
        tokenId={tokenId}
        status={contractData.status}
        address={contractData.address}
        mutateAutomationData={mutateAutomationData}
      />
      <LockDetails contractData={contractData} veTHE={veTHE} />
      <AutomationDetails contractData={contractData} />
      <HistoryContract />
    </div>
  )
}

export default AutomationContractDetail
