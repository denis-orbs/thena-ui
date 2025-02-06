'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect } from 'react'

import Loading from '@/app/loading'
import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'
import EditAutomationContract from '@/modules/AutomationContract/Edits/EditAutomationContract'
import { ArrowLeftIcon } from '@/svgs'

function EditVeTHEAutomationPage({ params }) {
  const { id } = params
  const { contractData, isLoading, mutateAutomationData } = useAutomationContractDetail(id)

  const { push } = useRouter()
  const t = useTranslations()

  useEffect(() => {
    if (id) {
      mutateAutomationData()
    }
  }, [mutateAutomationData, id])

  if (isLoading || !id || !contractData.address) return <Loading />
  return (
    <div className='container mx-auto space-y-10'>
      <div>
        <div className='mb-6 h-11 w-[140px]'>
          <TextButton onClick={() => push('/dashboard/lock')} LeadingIcon={ArrowLeftIcon}>
            {t('Lock Page')}
          </TextButton>
        </div>
        <TextHeading className='font-archia text-3xl font-semibold text-neutral-50 lg:text-[40px]'>
          {t('Edit Automation Contract')} {id}
        </TextHeading>
      </div>
      <EditAutomationContract data={contractData} />
    </div>
  )
}

export default EditVeTHEAutomationPage
