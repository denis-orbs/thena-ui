import { useCallback, useEffect, useState } from 'react'

const SPACE_API = 'https://nameapi.space.id/getName'
export const useSpaceIdBNB = account => {
  const [spaceIdName, setSpaceId] = useState(null)

  const fetchSpaceIdName = useCallback(async () => {
    if (account) {
      const spaceId = await fetch(`${SPACE_API}?chainid=56&address=${account.toLowerCase()}`, {
        method: 'get',
      }).then(res => res.json())
      setSpaceId(spaceId.data.name !== '' ? spaceId.data.name : null)
    }
  }, [account])

  useEffect(() => {
    fetchSpaceIdName()
  }, [fetchSpaceIdName])

  return { spaceIdName }
}
