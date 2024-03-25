import { createAction } from '@reduxjs/toolkit'

export const switchNetwork = createAction('settings/switchNetwork')
export const openWallet = createAction('settings/openWallet')
export const closeWallet = createAction('settings/closeWallet')
export const updateSlippage = createAction('settings/updateSlippage')
export const updateDeadline = createAction('settings/updateDeadline')
export const updateLocale = createAction('settings/updateLocale')
