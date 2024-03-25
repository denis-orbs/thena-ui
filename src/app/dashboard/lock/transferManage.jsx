'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { isAddress } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { ModalBody, ModalFooter } from '@/components/modal'
import { TextHeading } from '@/components/typography'
import { useTransfer } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import { CheckCircleIcon } from '@/svgs'

export default function TransferManage({ selected, setPopup, updateVeTHEs }) {
  const [address, setAddress] = useState('')
  const { onTransfer, pending } = useTransfer()
  const t = useTranslations()

  const errorMsg = useMemo(() => {
    if (!address || !isAddress(address)) {
      return 'Invalid Address'
    }
    return null
  }, [address])

  return (
    <>
      <ModalBody>
        <div className='flex flex-col gap-2'>
          <TextHeading>{t('Transfer veTHE #[Number] to Address', { id: selected?.id })}</TextHeading>
          <Input
            val={address}
            type='text'
            onChange={e => {
              setAddress(e.target.value)
            }}
            placeholder='Address'
            TrailingIcon={isAddress(address) ? <CheckCircleIcon /> : null}
          />
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
          {t('Transfer')}
        </PrimaryButton>
      </ModalFooter>
    </>
  )
}
