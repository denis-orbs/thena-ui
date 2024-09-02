'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import { ProfilePage } from '../ProfilePage'

export default function ProfileAddressPage() {
  const { address } = useParams()

  return <ProfilePage address={address} />
}
