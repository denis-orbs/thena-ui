'use client'

import React from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES } from '@/constant'

export default function PoolTitle({ strategy }) {
  return (
    <div className='flex items-center justify-between rounded-lg bg-neutral-800 p-3'>
      <div className='flex items-center gap-3'>
        <IconGroup
          className='-space-x-2'
          classNames={{ image: 'w-8 h-8 outline-2' }}
          logo1={strategy.token0.logoURI}
          logo2={strategy.token1.logoURI}
        />
        <div className='flex flex-col gap-1'>
          <TextHeading>{strategy.symbol}</TextHeading>
          <Paragraph className='text-xs'>{GAMMA_TYPES.includes(strategy.title) ? 'Gamma' : strategy.title}</Paragraph>
        </div>
      </div>
      {GAMMA_TYPES.includes(strategy.title) && <NeutralBadge>{strategy.title}</NeutralBadge>}
      {strategy.title === 'ICHI' && <NeutralBadge>{strategy.allowed.symbol}</NeutralBadge>}
    </div>
  )
}
