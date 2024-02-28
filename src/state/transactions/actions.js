import { createAction } from '@reduxjs/toolkit'

export const openTransaction = createAction('transactions/openTransaction')
export const updateTransaction = createAction('transactions/updateTransaction')
export const completeTransaction = createAction('transactions/completeTransaction')
export const closeTransaction = createAction('transactions/closeTransaction')
export const clearAllTransactions = createAction('transactions/clearAllTransactions')
export const finalizeTransaction = createAction('transactions/finalizeTransaction')
export const checkedTransaction = createAction('transactions/checkedTransaction')
