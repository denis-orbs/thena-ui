import { useCallback, useState } from 'react'

import { readCall } from '@/lib/contractActions'
import { getThenaIDContract } from '@/lib/contracts'

export const useValidateUserName = () => {
  const [loading, setLoading] = useState(false)
  const validate = useCallback(async username => {
    const contract = getThenaIDContract()
    if (username && contract) {
      try {
        setLoading(true)
        const [available, valid] = await Promise.all([
          readCall(contract, 'isUsernameAvailable', [username]),
          readCall(contract, 'validateUsername', [username]),
        ])
        console.log({
          available,
          valid,
        })
        return {
          available,
          valid,
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  return { loading, validate }
}

export const useCalculateCost = () => {
  const [loading, setLoading] = useState(false)
  const calculate = useCallback(async (username, tokenAddress) => {
    const contract = getThenaIDContract()
    if (username && contract && tokenAddress) {
      try {
        setLoading(true)
        const length = await readCall(contract, 'getLength', [username])
        const costPerToken = await readCall(contract, 'costPerToken', [tokenAddress])

        console.log({
          costPerToken,
        })
        if (costPerToken[length - 1]) {
          return costPerToken[length - 1]
        }
        return undefined
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  return { loading, calculate }
}
