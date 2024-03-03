'use client'

import BigNumber from 'bignumber.js'
import React, { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Input from '@/components/input'
import { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useMerge } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import { formatAmount } from '@/lib/utils'

export default function MergeManage({ selected }) {
  const [veTHE, setVeTHE] = useState(null)
  const { veTHEs, updateVeTHEs } = useVeTHEsContext()

  const { onMerge, pending } = useMerge()

  const filtered = useMemo(
    () =>
      veTHEs
        .filter(item => item.id !== selected.id && item.voting_amount.gt(0))
        .map(item => ({
          ...item,
          label: `veTHE #${item.id}`,
        })),
    [veTHEs, selected],
  )

  const votingPower = useMemo(() => {
    if (veTHE) {
      const end = Math.max(selected.lockedEnd, veTHE.lockedEnd)
      const current = new Date().getTime() / 1000
      return selected.amount
        .plus(veTHE.amount)
        .times(end - current)
        .div(86400 * 730)
    }
    return new BigNumber(0)
  }, [selected, veTHE])

  return (
    <>
      <ModalBody>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>Merge From</TextHeading>
              <Paragraph>veTHE Balance: {veTHE ? formatAmount(veTHE.voting_amount) : '-'}</Paragraph>
            </div>
            <Dropdown
              className='w-full'
              data={filtered}
              selected={veTHE ? `veTHE #${veTHE.id}` : ''}
              setSelected={setVeTHE}
              placeHolder='Make a selection'
            />
          </div>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>veTHE ID</TextHeading>
              <Paragraph>veTHE Balance: {formatAmount(selected.voting_amount)}</Paragraph>
            </div>
            <Input type='text' val={`veTHE #${selected.id}`} readOnly />
          </div>
          {veTHE && (
            <div className='my-3 flex items-center justify-between'>
              <Paragraph>veTHE #{selected.id} Balance Will Be:</Paragraph>
              <div>
                <TextHeading>{formatAmount(votingPower)}&nbsp;</TextHeading>
                <span className='font-medium text-success-600'>
                  {`(+${formatAmount(votingPower.minus(selected.voting_amount))})`}
                </span>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            if (!veTHE) {
              warnToast('Select veTHE')
            }
            onMerge(veTHE, selected, () => {
              setVeTHE(null)
              updateVeTHEs()
            })
          }}
        >
          Merge
        </PrimaryButton>
      </ModalFooter>
    </>
  )
}
