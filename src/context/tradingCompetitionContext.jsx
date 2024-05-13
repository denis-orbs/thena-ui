import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const TradingCompetitionContext = createContext({
  reloadFetch: 0,
  handleReloadFetch: undefined,
})

function TradingCompetitionContextProvider({ children }) {
  const [reloadFetch, setReloadFetch] = useState(0)

  const handleReloadFetch = useCallback(
    (value = undefined) => setReloadFetch(prev => (value === undefined ? prev + 1 : value)),
    [],
  )

  const value = useMemo(
    () => ({
      reloadFetch,
      handleReloadFetch,
    }),
    [handleReloadFetch, reloadFetch],
  )

  return <TradingCompetitionContext.Provider value={value}>{children}</TradingCompetitionContext.Provider>
}

const useTradingCompetition = () => {
  const tradingCompetition = useContext(TradingCompetitionContext)
  return tradingCompetition
}

export { TradingCompetitionContext, TradingCompetitionContextProvider, useTradingCompetition }
