import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useMemo } from 'react'

import Skeleton from '@/components/skeleton'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'

import LinkExternalIcon from '~/svgs/link-external.svg'

function LockExpire({ veTHEData }) {
  const t = useTranslations()
  const { push } = useRouter()
  const { data: veTHEs, isLoading } = useVeTheAutomations()

  const veTHE = useMemo(() => veTHEs?.find(item => item.id === veTHEData?.id), [veTHEData?.id, veTHEs])

  if (isLoading) {
    return <Skeleton className='h-5 w-44' />
  }

  if (veTHE?.operations?.isRelockEveryWeek && veTHE?.statusString === AUTOMATION_STATUS.ACTIVE) {
    return (
      <div
        onClick={() => push(`/dashboard/lock/automation/${veTHEData?.id}`)}
        className='flex cursor-pointer items-center gap-1'
      >
        <Paragraph>{t('Automated')}</Paragraph>
        <LinkExternalIcon className='inline-block size-4 stroke-neutral-300' />
      </div>
    )
  }

  return (
    <div className='flex flex-col'>
      <Paragraph>{dayjs.unix(veTHEData?.lockedEnd).format('MMM D, YYYY')}</Paragraph>
      <TextSubHeading>
        {veTHEData?.expire > 0
          ? t('Expires in [x] days', { x: veTHEData?.expire })
          : `Expired ${(veTHEData?.expire || 0) * -1} days ago`}
      </TextSubHeading>
    </div>
  )
}

export default LockExpire
