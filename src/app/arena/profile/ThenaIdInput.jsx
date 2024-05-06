import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import Input from '@/components/input'
import { Paragraph } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { useValidateUserName } from '@/hooks/useThenaIdContract'
import { CheckCircleIcon } from '@/svgs'

function ThenaIdInput({ onChange, costPerToken }) {
  const [thenaId, setThenaId] = useState('')
  const debounceThenaId = useDebounce(thenaId, 500)
  const t = useTranslations()
  const { validate } = useValidateUserName()
  const [error, setError] = useState('')
  const [cost, setCost] = useState()

  useEffect(() => {
    let errorMessage = ''
    let estimateCost

    const calculateCost = thenaIdLength => {
      if (costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]) {
        return costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]
      }
      if (new BigNumber(thenaIdLength).toNumber() > costPerToken.length) {
        return costPerToken[costPerToken.length - 1]
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
        classNames={{
          input: error ? 'border-error-500' : undefined,
        }}
      />
      {error && <Paragraph className='ml-1 mt-1 text-sm text-error-500'>{error}</Paragraph>}
    </div>
  )
}

export default ThenaIdInput
