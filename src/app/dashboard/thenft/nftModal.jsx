'use client'

import React, { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import MultiSelect from '@/components/dropdown/multiselect'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import { TextHeading } from '@/components/typography'
import { useStakeNft, useUnstakeNft } from '@/hooks/useTheNft'

export default function NftModal({ popup, setPopup, walletIds, stakedIds, mutate }) {
  const [isUnstake, setIsUnstake] = useState(false)
  const [stakingIds, setStakingsIds] = useState([])
  const [unstakingIds, setUnStakingIds] = useState([])
  const { onStake, pending: stakePending } = useStakeNft()
  const { onUnstake, pending: unstakePending } = useUnstakeNft()

  const stakeSelections = useMemo(
    () => [
      {
        label: 'Stake',
        active: !isUnstake,
        onClickHandler: () => {
          setIsUnstake(false)
        },
      },
      {
        label: 'Unstake',
        active: isUnstake,
        onClickHandler: () => {
          setIsUnstake(true)
        },
      },
    ],
    [isUnstake],
  )
  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      title='Manage theNFTs'
      shouldCloseOnOverlayClick={false}
      onAfterClose={() => {
        setStakingsIds([])
        setUnStakingIds([])
        setIsUnstake(false)
      }}
    >
      <ModalBody>
        <Selection data={stakeSelections} isFull />
        {isUnstake ? (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>Select your theNFT</TextHeading>
              <div
                className='cursor-pointer text-primary-600'
                onClick={() => {
                  setUnStakingIds(unstakingIds.length === stakedIds.length ? [] : stakedIds)
                }}
              >
                {unstakingIds.length === stakedIds.length ? 'Clear all' : 'Select all'}
              </div>
            </div>
            <MultiSelect
              data={stakedIds}
              selected={unstakingIds}
              setSelected={setUnStakingIds}
              placeHolder='Select theNFT'
            />
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>Select your theNFT</TextHeading>
              <div
                className='cursor-pointer text-primary-600'
                onClick={() => {
                  setStakingsIds(stakingIds.length === walletIds.length ? [] : walletIds)
                }}
              >
                {stakingIds.length === walletIds.length ? 'Clear all' : 'Select all'}
              </div>
            </div>
            <MultiSelect
              data={walletIds}
              selected={stakingIds}
              setSelected={setStakingsIds}
              placeHolder='Select theNFT'
            />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {isUnstake ? (
          <PrimaryButton
            className='w-full'
            onClick={() => {
              onUnstake(unstakingIds, () => {
                setUnStakingIds([])
                mutate()
              })
            }}
            disabled={!unstakingIds.length || unstakePending}
          >
            Unstake
          </PrimaryButton>
        ) : (
          <PrimaryButton
            className='w-full'
            onClick={() => {
              onStake(stakingIds, () => {
                setStakingsIds([])
                mutate()
              })
            }}
            disabled={!stakingIds.length || stakePending}
          >
            Stake
          </PrimaryButton>
        )}
      </ModalFooter>
    </Modal>
  )
}
