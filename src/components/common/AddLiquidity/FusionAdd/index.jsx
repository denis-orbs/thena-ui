'use client'

import React from 'react'

import DefiedgeAdd from './DefiedgeAdd'
import GammaAdd from './GammaAdd'
import IchiAdd from './IchiAdd'

export default function FusionAdd({ strategy, isModal, isAdd }) {
  return (
    <>
      {strategy.title === 'ICHI' ? (
        <IchiAdd strategy={strategy} isModal={isModal} isAdd={isAdd} />
      ) : strategy.title === 'DefiEdge' ? (
        <DefiedgeAdd strategy={strategy} isModal={isModal} isAdd={isAdd} />
      ) : (
        <GammaAdd strategy={strategy} isModal={isModal} isAdd={isAdd} />
      )}
    </>
  )
}
