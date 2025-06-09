'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { isAddress } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import MultiSelect from '@/components/dropdown/multiselect'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import { TextHeading } from '@/components/typography'
import { useStakeNft, useTransferNft, useUnstakeNft } from '@/hooks/useTheNft'
import { CheckCircleIcon } from '@/svgs'

const ManageTheNftTab = {
  Stake: 0,
  Unstake: 1,
  Transfer: 2,
}

export default function NftModal({ popup, setPopup, walletIds, stakedIds, mutate, account }) {
  const [activeTab, setActiveTab] = useState(ManageTheNftTab.Stake)
  const [stakingIds, setStakingsIds] = useState([])
  const [unstakingIds, setUnStakingIds] = useState([])
  const [transferingIdStr, setTransferingIdStr] = useState(null)
  const [toAddress, setToAddress] = useState('')
  const { onStake, pending: stakePending } = useStakeNft()
  const { onUnstake, pending: unstakePending } = useUnstakeNft()
  const { handleTransfer, pending: transferPending } = useTransferNft()
  const t = useTranslations()

  const stakeSelections = useMemo(
    () => [
      {
        label: 'Stake',
        active: activeTab === ManageTheNftTab.Stake,
        onClickHandler: () => {
          setActiveTab(ManageTheNftTab.Stake)
        },
      },
      {
        label: 'Unstake',
        active: activeTab === ManageTheNftTab.Unstake,
        onClickHandler: () => {
          setActiveTab(ManageTheNftTab.Unstake)
        },
      },
      {
        label: 'Transfer',
        active: activeTab === ManageTheNftTab.Transfer,
        onClickHandler: () => {
          setActiveTab(ManageTheNftTab.Transfer)
        },
      },
    ],
    [activeTab],
  )

  const userNftIds = useMemo(() => [...walletIds, ...stakedIds], [walletIds, stakedIds])

  // Correct theNFT Id to transfer
  const transferingTokenId = useMemo(() => {
    if (transferingIdStr) {
      const match = transferingIdStr.match(/#(\d+)/)
      return match ? match[1] : null
    }
    return null
  }, [transferingIdStr])

  const needToUnstakeAndTransfer = useMemo(() => {
    if (transferingTokenId === null) {
      return false
    }

    return stakedIds.findIndex(item => Number(transferingTokenId) === Number(item)) !== -1
  }, [stakedIds, transferingTokenId])

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
        setTransferingIdStr(null)
        setActiveTab(ManageTheNftTab.Stake)
      }}
    >
      <ModalBody>
        <Selection data={stakeSelections} isFull />
        {activeTab === ManageTheNftTab.Stake ? (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Select your theNFT')}</TextHeading>
              <div
                className='text-primary-600 cursor-pointer'
                onClick={() => {
                  setStakingsIds(stakingIds.length === walletIds.length ? [] : walletIds)
                }}
              >
                {t(stakingIds.length === walletIds.length ? 'Clear All' : 'Select All')}
              </div>
            </div>
            <MultiSelect
              data={walletIds}
              selected={stakingIds}
              setSelected={setStakingsIds}
              placeHolder='Select theNFT'
            />
          </div>
        ) : activeTab === ManageTheNftTab.Unstake ? (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Select your theNFT')}</TextHeading>
              <div
                className='text-primary-600 cursor-pointer'
                onClick={() => {
                  setUnStakingIds(unstakingIds.length === stakedIds.length ? [] : stakedIds)
                }}
              >
                {t(unstakingIds.length === stakedIds.length ? 'Clear All' : 'Select All')}
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
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <TextHeading>{t('Select your theNFT')}</TextHeading>
              </div>
              <Dropdown
                data={[
                  { label: 'Select theNFT' },
                  ...userNftIds.map(item => ({
                    label: `Thenian #${Number(item)}`,
                  })),
                ]}
                selected={transferingTokenId === null ? 'Select theNFT' : transferingIdStr}
                setSelected={ele => {
                  if (ele.label === 'Select theNFT') {
                    setTransferingIdStr(null)
                  } else {
                    setTransferingIdStr(ele.label)
                  }
                }}
                placeHolder='Select theNFT'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('To Address')}</TextHeading>
              <Input
                val={toAddress}
                type='text'
                onChange={e => {
                  setToAddress(e.target.value)
                }}
                placeholder='Address'
                TrailingIcon={isAddress(toAddress, { strict: false }) ? <CheckCircleIcon /> : null}
              />
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {activeTab === ManageTheNftTab.Stake ? (
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
            {t('Stake')}
          </PrimaryButton>
        ) : activeTab === ManageTheNftTab.Unstake ? (
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
            {t('Unstake')}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            className='w-full'
            onClick={() => {
              handleTransfer(needToUnstakeAndTransfer, transferingTokenId, account, toAddress, () => {
                setTransferingIdStr(null)
                mutate()
              })
            }}
            disabled={transferingTokenId === null || !isAddress(toAddress) || transferPending}
          >
            {needToUnstakeAndTransfer ? t('Unstake and Transfer') : t('Transfer')}
          </PrimaryButton>
        )}
      </ModalFooter>
    </Modal>
  )
}
