export const fetchListPairs = async () => {
  const url = 'https://alpha-hedger.rasa.capital/contract-symbols'
  const response = await fetch(url)

  const res = await response.json()
  if (res) {
    return res
  }
  throw new Error('Not Found')
}
