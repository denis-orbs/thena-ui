'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { Info, Neutral } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton, SecondaryButton, TertiaryButton } from '@/components/buttons/Button'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import Highlight from '@/components/highlight'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { useNftFeesClaim, useNftRoyaltyClaim, useTheNftAccountInfo, useTheNftInfo } from '@/hooks/useTheNft'
import useWallet from '@/hooks/useWallet'
import InfoIcon from '@/icons/InfoIcon'
import { formatAmount } from '@/utils/utils'

import BankIcon from '~/svgs/bank.svg'
import CoinsStackedIcon from '~/svgs/coins-stacked.svg'
import PiggySecondIcon from '~/svgs/piggy-second.svg'
import WalletIcon from '~/svgs/wallet.svg'

import NftModal from './nftModal'
import ThenftCollectionItem from './ThenftCollectionItem'
import NotConnected from '../NotConnected'

function InfoBox({ value, title, amount }) {
  const t = useTranslations()

  return (
    <Box className='flex flex-col gap-2'>
      {value ? (
        <div className='flex items-center gap-2'>
          <TextHeading className='text-2xl'>{value}</TextHeading>
          {amount && (
            <>
              <InfoIcon data-tooltip-id='thenft-rewards' />
              <CustomTooltip id='thenft-rewards'>{amount}</CustomTooltip>
            </>
          )}
        </div>
      ) : (
        <Skeleton className='h-[32px] w-[100px]' />
      )}
      <Paragraph className='text-sm'>{t(title)}</Paragraph>
    </Box>
  )
}

export default function TheNftPage() {
  const [isManageOpen, setIsManageOpen] = useState(false)
  const { account } = useWallet()
  const { totalStaked, apr, lastEarnings } = useTheNftInfo()
  const {
    stakedIds,
    walletIds,
    pendingReward,
    pendingAmount,
    claimable,
    claimableUSD,
    isOriginal,
    userLoading,
    mutate,
  } = useTheNftAccountInfo()
  const allNftIds = [...walletIds, ...stakedIds]
  const { onHarvest, pending } = useNftFeesClaim()
  const { onRoyaltyClaim, pending: royaltyPending } = useNftRoyaltyClaim()
  const t = useTranslations()

  return (
    <LayoutWithBackButton backUrl='/dashboard'>
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-6'>
          <h2>theNFT</h2>
          <Info className='justify-between lg:p-8'>
            <div className='flex items-center gap-4'>
              <NextImage src='/svgs/piggy-bank.svg' className='size-4 min-w-4 lg:size-8 lg:min-w-8' />
              <div className='flex flex-col gap-2'>
                <p className='hidden text-xl font-medium lg:block'>{t('Passive Income by Staking theNFT')}</p>
                <p>{t('Stake Your theNFT for Trading Fees and Royalties')}</p>
              </div>
            </div>
            <TertiaryButton
              className='min-w-fit'
              onClick={() => {
                window.open('https://element.market/collections/thenian', '_blank')
              }}
            >
              {t('Buy theNFT')}
            </TertiaryButton>
          </Info>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <InfoBox value={totalStaked > 0 ? formatAmount(totalStaked) : null} title='Total theNFT Staked' />
            <InfoBox value={apr ? `${formatAmount(apr)}%` : null} title='Floor Price APR' />
            <InfoBox value={lastEarnings ? `$${formatAmount(lastEarnings)}` : null} title='Last Epoch Earnings' />
          </div>
        </div>
        {account ? (
          <>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <TextHeading className='text-xl'>{t('Stake')}</TextHeading>
                <div className='flex items-center gap-4'>
                  {pendingAmount.gt(0) && (
                    <SecondaryButton
                      onClick={() => {
                        onHarvest()
                      }}
                      disabled={pending}
                    >
                      {t('Claim Fees')}
                    </SecondaryButton>
                  )}
                  <EmphasisButton onClick={() => setIsManageOpen(true)}>{t('Manage')}</EmphasisButton>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                <InfoBox value={userLoading ? null : formatAmount(stakedIds.length)} title='My Stake' />
                <InfoBox value={userLoading ? null : formatAmount(walletIds.length)} title='theNFTs in Wallet' />
                <InfoBox
                  value={userLoading ? null : `$${formatAmount(pendingReward)}`}
                  amount={`${formatAmount(pendingAmount)} THE`}
                  title='Claimable Fees'
                />
              </div>
            </div>
            <div className='flex flex-col gap-4'>
              <TextHeading className='text-xl'>{t('My Collection')}</TextHeading>
              {allNftIds.length > 0 ? (
                <div className='flex gap-4 overflow-auto pb-4 lg:grid lg:grid-cols-4'>
                  {allNftIds.map((id, idx) => (
                    <ThenftCollectionItem key={`thenft-${id}-${idx}`} nftId={id} isStaked={stakedIds.includes(id)} />
                  ))}
                </div>
              ) : (
                <div className='my-16 flex flex-col gap-2 text-center'>
                  <TextHeading>{t('You have no theNFT in your collection')}</TextHeading>
                  <Paragraph className='text-sm'>{t('Start Passive Income')}</Paragraph>
                </div>
              )}
            </div>
            <div className='flex flex-col gap-4'>
              <TextHeading className='text-xl'>{t('Royalties')}</TextHeading>
              <Neutral className='flex-col lg:flex-row'>
                <div className='flex items-center gap-4'>
                  <CoinsStackedIcon className='h-4 w-4 min-w-4 stroke-neutral-400 lg:h-8 lg:w-8 lg:min-w-8' />
                  <div className='flex flex-col gap-2'>
                    <TextHeading className='hidden text-xl lg:block'>{t('Claim theNFT minter royalties')}</TextHeading>
                    <Paragraph>{t('Original minters')}</Paragraph>
                  </div>
                </div>
                {isOriginal && (
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                      <Paragraph>Claimable Fees:</Paragraph>
                      <TextHeading className='text-xl'>${formatAmount(claimableUSD)}</TextHeading>
                      <InfoIcon data-tooltip-id='vethe-claimable' />
                      <CustomTooltip id='vethe-claimable'>{formatAmount(claimable)} WBNB</CustomTooltip>
                    </div>
                    <EmphasisButton
                      className='w-[200px] min-w-fit'
                      onClick={() => {
                        onRoyaltyClaim(() => {
                          mutate()
                        })
                      }}
                      disabled={royaltyPending || claimable.isZero()}
                    >
                      {t('Claim')}
                    </EmphasisButton>
                  </div>
                )}
              </Neutral>
            </div>
          </>
        ) : (
          <NotConnected />
        )}
        <div className='flex flex-col gap-4'>
          <TextHeading className='text-xl'>{t('How to Stake')}</TextHeading>
          <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
            <div className='flex flex-col items-center gap-3'>
              <Highlight className='bg-primary-600'>
                <WalletIcon className='h-4 w-4' />
              </Highlight>
              <div className='flex flex-col gap-1 text-center'>
                <TextHeading>{t('Connect your wallet')}</TextHeading>
                <Paragraph className='text-sm'>{t('Connect Description')}</Paragraph>
              </div>
            </div>
            <div className='flex flex-col items-center gap-3'>
              <Highlight className='bg-primary-600'>
                <BankIcon className='h-4 w-4' />
              </Highlight>
              <div className='flex flex-col gap-1 text-center'>
                <TextHeading>{t('Stake theNFT')}</TextHeading>
                <Paragraph className='text-sm'>{t('Select Description')}</Paragraph>
              </div>
            </div>
            <div className='flex flex-col items-center gap-3'>
              <Highlight className='bg-primary-600'>
                <PiggySecondIcon className='h-4 w-4' />
              </Highlight>
              <div className='flex flex-col gap-1 text-center'>
                <TextHeading>{t('Earn Income')}</TextHeading>
                <Paragraph className='text-sm'>{t('Let THE rewards flow in')}</Paragraph>
              </div>
            </div>
          </div>
        </div>
        <NftModal
          walletIds={walletIds}
          stakedIds={stakedIds}
          popup={isManageOpen}
          setPopup={setIsManageOpen}
          mutate={mutate}
          account={account}
        />
      </div>
    </LayoutWithBackButton>
  )
}
