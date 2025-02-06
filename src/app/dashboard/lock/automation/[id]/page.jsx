'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import AutomationContractDetail from '@/modules/AutomationContract'
import { ArrowLeftIcon } from '@/svgs'

function ContractPage({ params }) {
  const t = useTranslations()
  const { id } = params
  const { push } = useRouter()
  return (
    <div className='mx-auto'>
      <div className='h-11 w-[140px]'>
        <TextButton onClick={() => push('/dashboard/lock')} LeadingIcon={ArrowLeftIcon}>
          {t('Lock Page')}
        </TextButton>
      </div>
      <AutomationContractDetail tokenId={id} />
    </div>
  )
}

export default ContractPage
