import { createContext, useContext, useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'

const HEDGER_API = 'https://alpha-hedger.rasa.capital/contract-symbols'

const initialState = {
  pairsContract: [],
}

const fetchContractSymbols = async () => {
  console.log('-------------------fetch hedger--------------------')
  const response = await fetch(HEDGER_API, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return response.json()
}

const PairContractContext = createContext(initialState)

function PairContractContextProvider({ children }) {
  const { data: pairsContract } = useSWRImmutable(['hedger pair contract'], () => fetchContractSymbols())

  const final = useMemo(
    () => ({
      pairsContract: pairsContract?.symbols ?? [],
    }),
    [pairsContract],
  )

  return <PairContractContext.Provider value={final}>{children}</PairContractContext.Provider>
}

const usePairsContract = () => {
  const { pairsContract } = useContext(PairContractContext)
  return { pairsContract }
}

export { PairContractContextProvider, usePairsContract }
