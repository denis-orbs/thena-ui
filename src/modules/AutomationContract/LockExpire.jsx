import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'

import Skeleton from '@/components/skeleton'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useAutomationStatus } from '@/hooks/automationContract/useAutomationContract'

function LockExpire({ veTHE }) {
  const t = useTranslations()
  const { status, isLoading } = useAutomationStatus(veTHE.id)
  if (isLoading) {
    return <Skeleton className='h-5 w-44' />
  }
  if (status === AUTOMATION_STATUS.ACTIVE) {
    return <Paragraph>{t('Automated')}</Paragraph>
  }
  return (
    <div className='flex flex-col'>
      <Paragraph>{dayjs.unix(veTHE.lockedEnd).format('MMM D, YYYY')}</Paragraph>
      <TextSubHeading>
        {veTHE.expire > 0 ? t('Expires in [x] days', { x: veTHE.expire }) : `Expired ${veTHE.expire * -1} days ago`}
      </TextSubHeading>
    </div>
  )
}

export default LockExpire
