import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Skeleton from '@/components/skeleton'
import { AUTOMATION_STATUS } from '@/constant'
import { useAutomationStatus } from '@/hooks/automationContract/useAutomationContract'

function AutomationStatus({ veTHEId }) {
  const { status, isLoading } = useAutomationStatus(veTHEId)
  const styleStatus = useMemo(() => {
    if (!isLoading) {
      switch (status) {
        case AUTOMATION_STATUS.PENDING:
          return 'bg-[#0000F5]'
        case AUTOMATION_STATUS.ACTIVE:
          return 'bg-success-600'
        case AUTOMATION_STATUS.PAUSED:
          return 'bg-warn-600'
        case AUTOMATION_STATUS.CANCELED:
          return 'bg-error-600'
        case AUTOMATION_STATUS.NO:
          return 'bg-transparent text-error-600'
        default:
          return ''
      }
    }
  }, [status, isLoading])

  return (
    <>
      {isLoading ? (
        <Skeleton className='h-5 w-[52px] rounded-full' />
      ) : (
        <NeutralBadge className={styleStatus}>{status}</NeutralBadge>
      )}
    </>
  )
}

export default AutomationStatus
