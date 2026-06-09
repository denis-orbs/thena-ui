/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import React, { createContext, useContext, useMemo } from 'react'

const TwapContext = createContext({})

export const useTwapContext = () => useContext(TwapContext)

export function TwapContextProvider({ props, module, children }) {
  const value = useMemo(() => ({ ...props, module }), [props, module])
  return <TwapContext.Provider value={value}>{children}</TwapContext.Provider>
}
