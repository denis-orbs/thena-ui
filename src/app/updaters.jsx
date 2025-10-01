'use client'

import React from 'react'

import PoolsUpdater from '@/state/pools/updater'
import PositionUpdater from '@/state/positions/updater'

export function Updaters() {
  return (
    <>
      <PoolsUpdater />
      <PositionUpdater />
    </>
  )
}
