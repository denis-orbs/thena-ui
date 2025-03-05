'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import Modal from '@/components/modal'
import Selection from '@/components/selection'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'

import RemoveWeighted from './RemoveWeighted'

export default function ManageWeightedPositionModal({ popup, setPopup, pool }) {
  const [isRemove, setIsRemove] = useState(true)
  const { push } = useRouter()

  const manageSelections = useMemo(
    () => [
      {
        label: 'Add',
        active: !isRemove,
        onClickHandler: () => {
          push(`/pools/add-liquidity/weighted/${pool.address}`)
        },
      },
      {
        label: 'Remove',
        active: isRemove,
        onClickHandler: () => {
          setIsRemove(true)
        },
      },
    ],
    [isRemove, pool.address, push],
  )

  return (
    <Modal
      isOpen={popup}
      title='Manage Position'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <div className='inline-flex w-full flex-col gap-5 p-3 lg:px-6'>
        <div className='flex flex-col gap-3'>
          <TextHeading>{pool?.symbol}</TextHeading>
          <div className='flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
            <div className='flex items-center gap-2'>
              <ThreeIconGroup
                classNames={{
                  image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                className='-space-x-1'
                logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(pool?.tokens?.length || 2) - 2}
              />
              <div className='flex items-center gap-2 lg:max-w-[90%]'>
                <div className='flex w-full flex-wrap items-center gap-1 '>
                  {(pool?.tokens || []).map(token => (
                    <div className='flex items-center gap-1' key={token?.address}>
                      <span className='text-[16px] font-medium leading-5'>{token?.symbol}</span>
                      <span className='text-sm font-medium leading-5 text-neutral-300 '>{token?.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <NeutralBadge>Weighted</NeutralBadge>
          </div>
        </div>
        <Selection data={manageSelections} isFull />
      </div>
      {isRemove ? (
        <>
          <p className='px-3 pt-3 font-medium text-white lg:px-6'>Remove Liquidity Options</p>
          <RemoveWeighted showTitle={false} pool={pool} onCancel={() => setPopup(false)} />
        </>
      ) : (
        <></>
      )}
    </Modal>
  )
}
