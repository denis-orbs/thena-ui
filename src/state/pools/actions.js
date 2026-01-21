import { createAction } from '@reduxjs/toolkit'

export const updatePools = createAction('pools/updatePools')

export const updatePoolsMigration = createAction('pools/updatePoolsMigration')

export const updatePoolsLoading = createAction('pools/updatePoolsLoading')
