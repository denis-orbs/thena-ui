'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'

import Loading from '@/app/loading'
import { AutoMigrationPage, ManualMigrationPage } from '@/modules/Pools/Migration'

export default function MigrationPage() {
  const searchParams = useSearchParams()
  const tokenId = searchParams.get('tokenId')
  const address = searchParams.get('address')

  if (tokenId) {
    return <ManualMigrationPage tokenId={tokenId} />
  }

  if (address) {
    return <AutoMigrationPage address={address} />
  }

  return <Loading />
}
