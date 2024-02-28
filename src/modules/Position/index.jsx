import React from 'react'

import NotStaked from './NotStaked'
import Staked from './Staked'

export default function Position({ pool }) {
  if (!pool.account) {
    console.log('pool :>> ', pool)
  }
  return (
    <>
      {pool.account.gaugeBalance.gt(0) && <Staked pool={pool} />}
      {pool.account.walletBalance.gt(0) && <NotStaked pool={pool} />}
    </>
  )
}
