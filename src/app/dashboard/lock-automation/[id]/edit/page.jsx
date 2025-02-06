'use client'

import React from 'react'

import Loading from '@/app/loading'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'
import CreateVeTHEAutomation from '@/modules/CreateVeTHEAutomation'

function EditVeTHEAutomationPage({ params }) {
  const { id } = params
  const { contractData, isLoading, mutateAutomationData } = useAutomationContractDetail(id)
  if (isLoading) return <Loading />
  return (
    <div className='container mx-auto'>
      <CreateVeTHEAutomation contractData={contractData} mutateAutomationData={mutateAutomationData} isEdit />
    </div>
  )
}

export default EditVeTHEAutomationPage
