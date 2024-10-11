import { useCallback, useEffect, useState } from 'react'

const SPACE_API = 'https://api.prd.space.id/v1/getName'
export const useSpaceIdBNB = account => {
  const [spaceIdName, setSpaceId] = useState(null)

  const fetchSpaceIdName = useCallback(async () => {
    if (account) {
      const spaceId = await fetch(`${SPACE_API}?tld=bnb&address=${account.toLowerCase()}`, {
        method: 'get',
      }).then(res => res.json())
      setSpaceId(spaceId.name !== '' ? spaceId.name : null)
    }
  }, [account])

  useEffect(() => {
    fetchSpaceIdName()
  }, [fetchSpaceIdName])

  return { spaceIdName }
}
