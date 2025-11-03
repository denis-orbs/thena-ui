import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'

import { TextIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import Spinner from '@/components/spinner'
import { Paragraph } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { useValidateUserName } from '@/hooks/useThenaIdContract'

import CheckCircleIcon from '~/svgs/checkCircle.svg'
import RandomDice from '~/svgs/random-dice.svg'

function ThenaIdInput({ onChange, costPerToken, defaultThenaId = '', randomThenaId }) {
  const [thenaId, setThenaId] = useState(defaultThenaId || '')
  const debounceThenaId = useDebounce(thenaId, 500)
  const t = useTranslations()
  const { validate } = useValidateUserName()
  const [error, setError] = useState('')
  const [cost, setCost] = useState()
  const [loadingRandom, setLoadingRandom] = useState(false)

  useEffect(() => {
    let errorMessage = ''
    let estimateCost

    const calculateCost = thenaIdLength => {
      if (costPerToken) {
        if (costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]) {
          return costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]
        }
        if (new BigNumber(thenaIdLength).toNumber() > costPerToken.length) {
          return costPerToken[costPerToken.length - 1]
        }
        return undefined
      }
      return undefined
    }

    if (debounceThenaId) {
      validate(debounceThenaId).then(data => {
        if (!data.available) {
          errorMessage = t('Thena Id Is Taken', { thenaId: debounceThenaId })
        } else if (!data.valid) {
          errorMessage = t('Invalid Thena Id', { thenaId: debounceThenaId })
        } else {
          estimateCost = calculateCost(data.length)
        }

        setError(errorMessage)
        setCost(estimateCost)
      })
    } else {
      setCost(undefined)
    }
  }, [costPerToken, debounceThenaId, t, validate])

  useEffect(() => {
    onChange({
      errorMessage: error,
      cost,
      username: debounceThenaId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cost, debounceThenaId, error])

  const randomId = useCallback(async () => {
    setLoadingRandom(true)
    const randomName = await randomThenaId()
    setLoadingRandom(false)
    if (randomName) {
      setThenaId(randomName)
    }
  }, [randomThenaId])

  return (
    <div className='pt-2'>
      <Input
        onChange={e => {
          setThenaId(e.target.value)
        }}
        type='text'
        value={thenaId || ''}
        placeholder='Type Your Id'
        TrailingIcon={!error && debounceThenaId.length ? <CheckCircleIcon /> : null}
        TrailingButton={
          randomThenaId ? <TextIconButton Icon={loadingRandom ? Spinner : RandomDice} onClick={randomId} /> : null
        }
        classNames={{
          input: error ? 'border-error-500' : undefined,
        }}
      />
      {error && <Paragraph className='text-error-500 mt-1 ml-1 text-sm'>{error}</Paragraph>}
    </div>
  )
}

export default ThenaIdInput
