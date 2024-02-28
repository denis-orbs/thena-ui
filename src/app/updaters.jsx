'use client'

import React from 'react'

import AssetsUpdater from '@/state/assets/updater'
import PoolsUpdater from '@/state/pools/updater'

export function Updaters() {
  return (
    <>
      <AssetsUpdater />
      <PoolsUpdater />
    </>
  )
}
