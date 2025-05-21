'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'

import Loading from '@/app/loading'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { AutoMigrationPage, ManualMigrationPage } from '@/modules/Pools/Migration'

export default function MigrationPage() {
  const searchParams = useSearchParams()
  const tokenId = searchParams.get('tokenId')
  const address = searchParams.get('address')
  const staked = Boolean(searchParams.get('staked') === 'true')
  const withdraw = Boolean(searchParams.get('withdraw') === 'true')

  if (tokenId) {
    return (
      <LayoutWithBackButton>
        <ManualMigrationPage tokenId={tokenId} />
      </LayoutWithBackButton>
    )
  }

  if (address) {
    return (
      <LayoutWithBackButton>
        <AutoMigrationPage address={address} staked={staked} withdraw={withdraw} />
      </LayoutWithBackButton>
    )
  }

  return <Loading />
}
