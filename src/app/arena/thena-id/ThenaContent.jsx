'use client'

import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import { useUserInfo } from '@/app/arena/UserInfoContext'
import { Alert } from '@/components/alert'
import { ErrorButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import CheckBox from '@/components/checkbox'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import SuccessModal from '@/components/modal/SuccessModal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useConfetti } from '@/hooks/useConfetti'
import {
  useBatchGiftThenaId,
  useBatchMintThenaId,
  useGiftThenaId,
  useMintThenaId,
  useRandomThenaId,
  useUSDTCostPerToken,
} from '@/hooks/useThenaIdContract'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import ThenaIdInput from '../profile/ThenaIdInput'

const DEFAULT_THENAID_DATA = {
  id: 1,
  username: '',
  errorMessage: '',
  cost: undefined,
}

function ThenaContent() {
  const { networkId, updateNetwork } = useChainSettings()

  const [bodyRef, triggerConfetti] = useConfetti(2, {
    spread: 100,
    angle: 90,
  })

  const t = useTranslations()
  const pathname = usePathname()
  const [type, setType] = useState()
  const [thenaIds, setThenaIds] = useState([DEFAULT_THENAID_DATA])
  const { account } = useWallet()
  const { userInfo } = useUserInfo()
  const isMint = useMemo(() => pathname.includes('mint'), [pathname])

  const [address, setAddress] = useState(
    account?.toLowerCase() !== userInfo?.id.toLowerCase() ? userInfo?.id.toLowerCase() : undefined,
  )
  const assets = useAssets()
  const { costPerToken, loading } = useUSDTCostPerToken()
  const { availableCount, randomThenaId } = useRandomThenaId()

  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  const isValid = useMemo(() => thenaIds.every(item => item.username && !item.errorMessage && item.cost), [thenaIds])
  const totalCost = useMemo(
    () => thenaIds.reduce((sum, curr) => (curr.cost ? sum.plus(curr.cost) : sum), new BigNumber(0)),
    [thenaIds],
  )

  const { loading: gifting, giftThenaId } = useGiftThenaId()
  const { loading: minting, buyThenaId } = useMintThenaId()
  const { loading: batchMinting, batchMintThenaId } = useBatchMintThenaId()
  const { loading: batchGifting, batchGiftThenaId } = useBatchGiftThenaId()

  const [openSuccessModal, setOpenSuccessModal] = useState(false)

  const isMinting = useMemo(
    () => gifting || minting || batchGifting || batchMinting,
    [batchMinting, batchGifting, gifting, minting],
  )

  const onMint = useCallback(async () => {
    if (!isValid) {
      return false
    }
    let isSuccess = false
    if (type === 'gift') {
      if (thenaIds.length === 1) {
        isSuccess = await giftThenaId(thenaIds[0].username, address, thenaIds[0].cost)
      } else {
        isSuccess = await batchGiftThenaId(
          thenaIds.map(item => item.username),
          address,
          totalCost,
        )
      }
    } else if (thenaIds.length === 1) {
      isSuccess = await buyThenaId(thenaIds[0].username, thenaIds[0].cost)
    } else {
      isSuccess = await batchMintThenaId(
        thenaIds.map(item => item.username),
        totalCost,
      )
    }

    if (isSuccess) {
      triggerConfetti()
      setOpenSuccessModal(true)
    }
  }, [
    isValid,
    type,
    thenaIds,
    giftThenaId,
    address,
    batchGiftThenaId,
    totalCost,
    buyThenaId,
    batchMintThenaId,
    triggerConfetti,
  ])

  const onChangeThenaItem = useCallback((id, { errorMessage, cost, username }) => {
    setThenaIds(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            id: item.id,
            username,
            errorMessage,
            cost,
          }
        }
        return item
      }),
    )
  }, [])

  useEffect(() => {
    if (isMint) {
      setType('get')
    } else {
      setType('gift')
    }
  }, [isMint])

  return (
    <div className='mt-6 w-full lg:w-2/3'>
      <div className='mt-[9px] grid grid-cols-1 items-center gap-4 md:grid-cols-2 lg:mt-2.5'>
        <div
          onClick={() => setType('get')}
          className={cn(
            'border-primary-800 flex min-h-[180px] items-center rounded-lg border p-6',
            type === 'get' ? 'bg-primary-900' : '',
          )}
        >
          <Link href='/arena/thena-id/mint' className='flex h-full items-center gap-2.5'>
            <CheckBox className='min-w-[21px]' checked={type === 'get'} />
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Mint for Yourself')}</TextHeading>
              <Paragraph className='text-sm'>{t('Mint Desc')}</Paragraph>
            </div>
          </Link>
        </div>
        <div
          onClick={() => setType('gift')}
          className={cn(
            'border-primary-800 flex min-h-[180px] items-center rounded-lg border p-6',
            type === 'gift' ? 'bg-primary-900' : '',
          )}
        >
          <Link href='/arena/thena-id/gift' className='flex h-full items-center gap-2.5'>
            <CheckBox className='min-w-[21px]' checked={type === 'gift'} />
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Send As Gift')} 🎁</TextHeading>
              <Paragraph className='text-sm'>{t('Send Desc')}</Paragraph>
            </div>
          </Link>
        </div>
      </div>
      <div className='mt-5 flex w-full flex-col justify-center'>
        <div className='w-full'>
          <div className='w-full'>
            <LabelTooltip label={type === 'get' ? 'Your Thena Id' : 'Thena Id'} />
            {thenaIds.map(thenaItem => (
              <ThenaIdInput
                key={thenaItem.id}
                onChange={value => onChangeThenaItem(thenaItem.id, value)}
                costPerToken={costPerToken}
                randomThenaId={availableCount ? randomThenaId : undefined}
              />
            ))}
          </div>

          <div className='mt-4 flex items-center justify-center gap-3 md:mt-6'>
            <PrimaryButton
              onClick={() => {
                if (thenaIds.length >= 2) {
                  setThenaIds(thenaIds.slice(0, -1))
                }
              }}
              disabled={thenaIds.length === 1}
              className='bg-red-600 p-2 hover:bg-red-600'
            >
              <NextImage src='/svgs/minus-v2.svg' alt='minus icon' width={20} height={20} />
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                if (thenaIds.length < 10) {
                  setThenaIds([
                    ...thenaIds,
                    {
                      ...DEFAULT_THENAID_DATA,
                      id: thenaIds.length + 1,
                    },
                  ])
                }
              }}
              className='bg-green-600 p-2 hover:bg-green-600'
              disabled={thenaIds.length >= 10}
            >
              <NextImage src='/svgs/plus-v2.svg' alt='plus icon' width={20} height={20} />
            </PrimaryButton>
          </div>
          {type === 'gift' && (
            <div className='mt-5 w-full'>
              <LabelTooltip label='Wallet Address' />

              <Input
                onChange={e => {
                  setAddress(e.target.value)
                }}
                type='text'
                value={address || ''}
                placeholder=''
                required
              />
            </div>
          )}
          <div className='flex:col mt-5 flex w-full items-center justify-between'>
            <LabelTooltip label='Total Price' className='mb-0' />
            {totalCost && !isInvalidAmount(totalCost) && USDTAsset && (
              <div className='flex items-center gap-2'>
                <NextImage src={USDTAsset?.logoURI} alt='' className='h-5 w-5' />
                <Paragraph>
                  {formatAmount(fromWei(totalCost, USDTAsset?.decimals))} {USDTAsset?.symbol}
                </Paragraph>
              </div>
            )}
          </div>
        </div>
      </div>
      {networkId !== ChainId.BSC && (
        <div className='mt-5'>
          <Alert>
            <p className='text-sm'>{t('Minting Wrong Chain')}</p>
            <ErrorButton className='p-2 text-xs text-nowrap' onClick={() => updateNetwork(ChainId.BSC)}>
              {t('Switch Chain')}
            </ErrorButton>
          </Alert>
        </div>
      )}
      <div className='mt-3 flex w-full flex-row justify-center gap-4'>
        {account ? (
          <PrimaryButton
            className='w-full py-3.5 text-white lg:px-16 lg:py-3'
            disabled={!isValid || loading || isMinting || networkId !== ChainId.BSC}
            onClick={onMint}
          >
            {t('Mint Now')}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
      <SuccessModal
        ref={bodyRef}
        isOpen={openSuccessModal}
        onClose={() => setOpenSuccessModal(false)}
        heading={t('Mint Successful')}
        message={t('You have successfully minted your new THENA ID')}
      />
    </div>
  )
}

export default React.forwardRef(ThenaContent)
