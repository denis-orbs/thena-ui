import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Skeleton from '@/components/skeleton'
import { AUTOMATION_STATUS } from '@/constant'
import { useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'

function AutomationStatus({ veTHEId }) {
  const { data: veTHEs, isLoading } = useVeTheAutomations()
  const veTHE = veTHEs?.find(item => item.id === veTHEId)

  const styleStatus = useMemo(() => {
    if (!isLoading) {
      switch (veTHE?.statusString) {
        case AUTOMATION_STATUS.PENDING:
          return 'bg-[#0000F5] text-[#E6E6FE]'
        case AUTOMATION_STATUS.ACTIVE:
          return 'bg-success-700 text-success-100'
        case AUTOMATION_STATUS.PAUSED:
          return 'bg-warn-700 text-warn-100'
        case AUTOMATION_STATUS.CANCELED:
          return 'bg-error-700'
        case AUTOMATION_STATUS.NO:
          return 'bg-transparent text-error-600 lg:text-base'
        default:
          return ''
      }
    }
  }, [veTHE?.statusString, isLoading])

  return (
    <>
      {isLoading ? (
        <Skeleton className='h-5 w-[52px] rounded-full' />
      ) : (
        <NeutralBadge className={styleStatus}>{veTHE?.statusString}</NeutralBadge>
      )}
    </>
  )
}

export default AutomationStatus
