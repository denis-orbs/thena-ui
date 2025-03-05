import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import Skeleton from '@/components/skeleton'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'
import { LinkExternalIcon } from '@/svgs'

function LockExpire({ veTHEId }) {
  const t = useTranslations()
  const { push } = useRouter()

  const { data: veTHEs, isLoading } = useVeTheAutomations()
  const veTHE = veTHEs?.find(item => item.id === veTHEId)

  if (isLoading) {
    return <Skeleton className='h-5 w-44' />
  }

  if (veTHE?.operations?.isRelockEveryWeek && veTHE?.statusString === AUTOMATION_STATUS.ACTIVE) {
    return (
      <div
        onClick={() => push(`/dashboard/lock/automation/${veTHEId}`)}
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
      <Paragraph>{dayjs.unix(veTHE?.lockedEnd).format('MMM D, YYYY')}</Paragraph>
      <TextSubHeading>
        {veTHE?.expire > 0
          ? t('Expires in [x] days', { x: veTHE?.expire })
          : `Expired ${veTHE?.expire || 0 * -1} days ago`}
      </TextSubHeading>
    </div>
  )
}

export default LockExpire
