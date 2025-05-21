'use client'

import React from 'react'

import { ICHI_TYPES } from '@/constant'

import GammaAdd from './GammaAdd'
import IchiAdd from './IchiAdd'

export default function FusionAdd({ strategy, isModal, isAdd, onShowModalSuccess, handleBack, isSmall = false }) {
  return (
    <>
      {ICHI_TYPES.includes(strategy?.title) ? (
        <IchiAdd
          strategy={strategy}
          isModal={isModal}
          isAdd={isAdd}
          onShowModalSuccess={onShowModalSuccess}
          handleBack={handleBack}
          isSmall={isSmall}
        />
      ) : (
        <GammaAdd
          strategy={strategy}
          isModal={isModal}
          isAdd={isAdd}
          onShowModalSuccess={onShowModalSuccess}
          handleBack={handleBack}
          isSmall={isSmall}
        />
      )}
    </>
  )
}
