'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import useSWR from 'swr'

import useWallet from '@/hooks/useWallet'
import { fetchStatsCampaignParticipant } from '@/modules/Story'
import StatsCampaignParticipant from '@/modules/Story/StatsCampaignParticipant'

function StoryAdminPage() {
  const { account } = useWallet()
  const { data: userInfo, isLoading: isLoadingInfo } = useSWR(['fetchUserInfo', account])

  const { data: statsCampaignParticipant, isLoading: isLoadingStats } = useSWR(
    ['fetStatsCampaignParticipant'],
    () => fetchStatsCampaignParticipant(),
    { refreshInterval: 30000 },
  )

  const router = useRouter()

  useEffect(() => {
    if (!isLoadingInfo && !isLoadingStats && (!account || (userInfo && !(userInfo.isAdmin || userInfo.isSuperAdmin)))) {
      router.replace('/story')
    }
  }, [account, isLoadingInfo, isLoadingStats, router, userInfo])

  return (
    <StatsCampaignParticipant
      statsCampaignParticipant={statsCampaignParticipant}
      isLoadingInfo={isLoadingInfo}
      isLoadingStats={isLoadingStats}
      userInfo={userInfo}
    />
  )
}

export default StoryAdminPage
