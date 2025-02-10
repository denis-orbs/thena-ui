import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import Skeleton from '@/components/skeleton'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useAutomationStatus, useOperationsAutomation } from '@/hooks/automationContract/useAutomationContract'
import { LinkExternalIcon } from '@/svgs'

function LockExpire({ veTHE }) {
  const t = useTranslations()
  const { push } = useRouter()
  const { status, isLoading1 } = useAutomationStatus(veTHE.id)
  const { isRelockEveryWeek, isLoading: isLoading2 } = useOperationsAutomation(veTHE.id)

  if (isLoading1 || isLoading2) {
    return <Skeleton className='h-5 w-44' />
  }
  if (isRelockEveryWeek === true && status === AUTOMATION_STATUS.ACTIVE) {
    return (
      <div
        onClick={() => push(`/dashboard/lock/automation/${veTHE.id}`)}
        className='flex cursor-pointer items-center gap-1'
      >
        <Paragraph>{t('Automated')}</Paragraph>
        <div className='item-center flex cursor-pointer gap-1'>
          <LinkExternalIcon className='inline-block h-4 w-4' />
        </div>
      </div>
    )
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
