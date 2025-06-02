'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import Loading from '@/app/loading'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { TextHeading } from '@/components/typography'
import { useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'
import EditAutomationContract from '@/modules/AutomationContract/Edits/EditAutomationContract'

function EditVeTHEAutomationPage({ params }) {
  const { id } = params
  const { contractData, isLoading, mutateAutomationData } = useAutomationContractDetail(id)

  const t = useTranslations()

  useEffect(() => {
    if (id) {
      mutateAutomationData()
    }
  }, [mutateAutomationData, id])

  const isLoaded = useMemo(
    () => (contractData?.votes?.pairs || []).every(item => Boolean(item.pair)),
    [contractData?.votes?.pairs],
  )

  if (isLoading || !id || !contractData.address || !isLoaded) return <Loading />
  return (
    <LayoutWithBackButton backUrl='/dashboard/lock'>
      <div className='container mx-auto flex flex-col gap-10'>
        <div>
          <TextHeading className='font-archia text-3xl font-semibold text-neutral-50 lg:text-[40px]'>
            {t('Edit Automation Contract')} {id}
          </TextHeading>
        </div>
        <EditAutomationContract data={contractData} />
      </div>
    </LayoutWithBackButton>
  )
}

export default EditVeTHEAutomationPage
