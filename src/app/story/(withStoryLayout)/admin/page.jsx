'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect } from 'react'
import useSWR from 'swr'

import { TextHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { fetchStatsCampaignParticipant } from '@/modules/Story'
import StatsCampaignParticipant from '@/modules/Story/StatsCampaignParticipant'
import TopBarAdmin from '@/modules/Story/TopbarAdmin'

function StoryAdminPage() {
  const t = useTranslations()

  const { account } = useWallet()
  const { data: userInfo, isLoading: isLoadingInfo } = useSWR(['fetchUserInfo', account])

  const { data: statsCampaignParticipant, isLoading: isLoadingStats } = useSWR(
    ['fetStatsCampaignParticipant'],
    () => fetchStatsCampaignParticipant(),
    { refreshInterval: 30000 },
  )

  const router = useRouter()

  useEffect(() => {
    if ((!isLoadingInfo && !account) || (userInfo && !(userInfo.isAdmin || userInfo.isSuperAdmin))) {
      router.replace('/story')
    }
  }, [account, isLoadingInfo, router, userInfo])

  return (
    <div>
      <TopBarAdmin userInfo={userInfo} isLoading={isLoadingInfo} />
      {!isLoadingInfo && account && userInfo && (userInfo.isAdmin || userInfo.isSuperAdmin) && (
        <>
          <div className='mb-3 mt-6'>
            <TextHeading className='font-archia text-3xl'>{t('User Stats')}</TextHeading>
          </div>
          <StatsCampaignParticipant statsCampaignParticipant={statsCampaignParticipant} isLoading={isLoadingStats} />
        </>
      )}
    </div>
  )
}

export default StoryAdminPage
