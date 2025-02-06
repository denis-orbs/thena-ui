import React from 'react'

import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'

import AutomationDetails from './automationDetails/AutomationDetails'
import Head from './head/Head'
import HistoryContract from './history/HistoryContract'
import LockDetails from './lockDetails/LockDetails'

function AutomationContractDetail({ tokenId }) {
  const { contractData, mutateAutomationData } = useAutomationContractDetail(tokenId)

  return (
    <div className='space-y-11'>
      <Head tokenId={tokenId} address={contractData.address} mutateAutomationData={mutateAutomationData} />
      <LockDetails contractData={contractData} />
      <AutomationDetails contractData={contractData} />
      <HistoryContract />
    </div>
  )
}

export default AutomationContractDetail
