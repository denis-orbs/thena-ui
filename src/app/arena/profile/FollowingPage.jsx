'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect } from 'react'
import useSWR from 'swr'

import { TextButton } from '@/components/buttons/Button'
import { fetchFollowing } from '@/hooks/useUserFollow'
import { ArrowLeftIcon } from '@/svgs'

import { FollowedProfiles } from './FollowedProfiles'

function FollowingPage({ account }) {
  const t = useTranslations()
  const params = useParams()

  const { data: following, mutate: mutateFollowing } = useSWR(
    ['following', account?.toLowerCase()],
    () => fetchFollowing(account?.toLowerCase()),
    {
      refreshInterval: 60000,
    },
  )

  const mutateData = useCallback(async () => {
    await mutateFollowing()
  }, [mutateFollowing])

  useEffect(() => {
    mutateData()
  }, [mutateData])

  return (
    <div>
      <div className='sticky top-[128px] z-20 flex min-h-11 items-center justify-between bg-[#120916] bg-opacity-20 px-1 pb-2 pt-4 backdrop-blur-2xl lg:top-[150px] lg:mb-4 lg:pt-10'>
        <Link href={`/arena/profile${params?.address ? `/${params?.address}` : ''}`}>
          <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
            {t('Back')}
          </TextButton>
        </Link>
      </div>
      <FollowedProfiles followingUsers={following} />
    </div>
  )
}

export default FollowingPage
