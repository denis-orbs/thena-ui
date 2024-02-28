'use client'

import React, { useMemo, useState } from 'react'
import { isAddress } from 'viem'

import { Alert } from '@/components/alert'
import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { ModalBody, ModalFooter } from '@/components/modal'
import { TextHeading } from '@/components/typography'
import { useTransfer } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import { CheckCircleIcon, InfoIcon } from '@/svgs'

export default function TransferManage({ selected, setPopup, updateVeTHEs }) {
  const [address, setAddress] = useState('')
  const { onTransfer, pending } = useTransfer()

  const errorMsg = useMemo(() => {
    if (!address || !isAddress(address)) {
      return 'Invalid address'
    }
    return null
  }, [address])

  return (
    <>
      <ModalBody>
        <div className='flex flex-col gap-2'>
          <TextHeading>Transfer veTHE #{selected?.id} to</TextHeading>
          <Input
            val={address}
            type='text'
            onChange={e => {
              setAddress(e.target.value)
            }}
            placeholder='Address'
            TrailingIcon={isAddress(address) ? <CheckCircleIcon /> : null}
          />
          {address && !isAddress(address) && (
            <Alert>
              <InfoIcon className='h-4 w-4 stroke-error-600' />
              <p>This address is not correct. Please try again</p>
            </Alert>
          )}
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            if (errorMsg) {
              warnToast(errorMsg)
              return
            }
            onTransfer(selected, address, () => {
              setAddress('')
              setPopup(false)
              updateVeTHEs()
            })
          }}
        >
          Transfer
        </PrimaryButton>
      </ModalFooter>
    </>
  )
}
