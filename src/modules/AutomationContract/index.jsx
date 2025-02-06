import React from 'react'

import Loading from '@/app/loading'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'

import AutomationDetails from './automationDetails/AutomationDetails'
import Head from './head/Head'
import HistoryContract from './history/HistoryContract'
import LockDetails from './lockDetails/LockDetails'

function AutomationContractDetail({ tokenId }) {
  const { contractData, isLoading } = useAutomationContractDetail(tokenId)

  const { veTHEId } = contractData
  const { veTHEs } = useVeTHEsContext()
  const veTHE = veTHEs.find(ve => ve.id.toString() === veTHEId)
  if (isLoading || !veTHE) return <Loading />
  return (
    <div className='space-y-11'>
      <Head veTHE={veTHE} />
      <LockDetails contractData={contractData} veTHE={veTHE} />
      <AutomationDetails contractData={contractData} />
      <HistoryContract />
    </div>
  )
}

export default AutomationContractDetail
