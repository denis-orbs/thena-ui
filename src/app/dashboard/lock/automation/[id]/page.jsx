'use client'

import React from 'react'

import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import AutomationContractDetail from '@/modules/AutomationContract'

function ContractPage({ params }) {
  const { id } = params
  return (
    <LayoutWithBackButton backUrl='/dashboard/lock'>
      <div className='mx-auto'>
        <AutomationContractDetail tokenId={id} />
      </div>
    </LayoutWithBackButton>
  )
}

export default ContractPage
