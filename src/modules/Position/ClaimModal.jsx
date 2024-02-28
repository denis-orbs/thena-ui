'use client'

import React from 'react'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAlgebraClaim } from '@/hooks/fusion/useAlgebra'
import { formatAmount, unwrappedSymbol } from '@/lib/utils'

export default function ClaimModal({ popup, setPopup, pool, feeValue0, feeValue1, mutate, fee, outOfRange }) {
  const { tokenId, asset0, asset1 } = pool
  const { pending, onAlgebraClaim } = useAlgebraClaim()
  return (
    <Modal
      isOpen={popup}
      title='Claim fees'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <ModalBody>
        <div className='flex items-center justify-between rounded-lg bg-neutral-800 p-3'>
          <div className='flex items-center gap-3'>
            <IconGroup
              className='-space-x-2'
              classNames={{ image: 'w-8 h-8 outline-2' }}
              logo1={pool.asset0.logoURI}
              logo2={pool.asset1.logoURI}
            />
            <div className='flex flex-col gap-1'>
              <TextHeading>
                {unwrappedSymbol(pool.asset0)}/{unwrappedSymbol(pool.asset1)}
              </TextHeading>
              <Paragraph className='text-xs'>
                #{pool.tokenId} / {fee / 10000}% Fee
              </Paragraph>
            </div>
          </div>
          {outOfRange ? <PrimaryBadge>Out of Range</PrimaryBadge> : <GreenBadge>In Range</GreenBadge>}
        </div>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1'>
              <CircleImage className='h-4 w-4' src={asset0.logoURI} alt='thena logo' />
              <Paragraph className='font-medium'>{unwrappedSymbol(asset0)}</Paragraph>
            </div>
            <Paragraph>{formatAmount(feeValue0?.toSignificant())}</Paragraph>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1'>
              <CircleImage className='h-4 w-4' src={asset1.logoURI} alt='thena logo' />
              <Paragraph className='font-medium'>{unwrappedSymbol(asset1)}</Paragraph>
            </div>
            <Paragraph>{formatAmount(feeValue1?.toSignificant())}</Paragraph>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <TextButton className='w-full' onClick={() => setPopup(false)}>
          Cancel
        </TextButton>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            onAlgebraClaim(tokenId, feeValue0, feeValue1, () => {
              setPopup(false)
              mutate()
            })
          }}
        >
          Claim
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
