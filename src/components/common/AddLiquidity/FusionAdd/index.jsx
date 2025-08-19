'use client'

import React from 'react'

import { ICHI_TYPES } from '@/constant'
import { cn } from '@/lib/utils'

import GammaAdd from './GammaAdd'
import IchiAdd from './IchiAdd'

export default function FusionAdd({
  strategy,
  isModal,
  isAdd,
  onShowModalSuccess,
  handleBack,
  isSmall = false,
  classNames,
  label,
}) {
  return (
    <div className={cn('flex flex-col gap-4 xl:gap-6', classNames?.wrapper)}>
      {ICHI_TYPES.includes(strategy?.title) ? (
        <IchiAdd
          strategy={strategy}
          isModal={isModal}
          isAdd={isAdd}
          onShowModalSuccess={onShowModalSuccess}
          handleBack={handleBack}
          isSmall={isSmall}
          classNames={classNames}
          label={label}
        />
      ) : (
        <GammaAdd
          strategy={strategy}
          isModal={isModal}
          isAdd={isAdd}
          onShowModalSuccess={onShowModalSuccess}
          handleBack={handleBack}
          isSmall={isSmall}
          classNames={classNames}
          label={label}
        />
      )}
    </div>
  )
}
