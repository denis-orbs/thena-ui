'use client'

import BigNumber from 'bignumber.js'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useUserInfo } from '@/context/userInfoContext'
import { useUSDTCostPerToken } from '@/hooks/useThenaIdContract'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import ThenaIdInput from '../profile/ThenaIdInput'

const DEFAULT_THENAID_DATA = {
  id: 1,
  username: '',
  errorMessage: '',
  cost: undefined,
}

function ThenaContent() {
  const t = useTranslations()
  const pathname = usePathname()
  const [type, setType] = useState('')
  const [thenaIds, setThenaIds] = useState([DEFAULT_THENAID_DATA])
  const { account } = useWallet()
  const { userInfo } = useUserInfo()
  const [address, setAddress] = useState(
    account?.toLowerCase() !== userInfo?.id?.toLowerCase() ? userInfo?.id?.toLowerCase() : undefined,
  )
  const assets = useAssets()
  const { costPerToken } = useUSDTCostPerToken()
  const isMint = useMemo(() => pathname.includes('mint'), [pathname])

  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )
  const totalCost = useMemo(
    () => thenaIds.reduce((sum, curr) => (curr.cost ? sum.plus(curr.cost) : sum), new BigNumber(0)),
    [thenaIds],
  )

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
            'flex min-h-[180px] items-center rounded-lg border border-primary-800 p-6',
            type === 'get' ? 'bg-primary-900' : '',
          )}
        >
          <Link href='/arena/thena-id/mint' className='flex h-full items-center gap-2.5'>
            <CheckBox className='min-w-[21px]' checked={type === 'get'} />
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Mint')}</TextHeading>
              <Paragraph className='text-sm'>{t('Mint Desc')}</Paragraph>
            </div>
          </Link>
        </div>
        <div
          onClick={() => setType('gift')}
          className={cn(
            'flex min-h-[180px] items-center rounded-lg border border-primary-800 p-6',
            type === 'gift' ? 'bg-primary-900' : '',
          )}
        >
          <Link href='/arena/thena-id/gift' className='flex h-full items-center gap-2.5'>
            <CheckBox className='min-w-[21px]' checked={type === 'gift'} />
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Send As Gift')}</TextHeading>
              <Paragraph className='text-sm'>{t('Send Desc')}</Paragraph>
            </div>
          </Link>
        </div>
      </div>
      <div className='mt-5 flex w-full flex-col justify-center'>
        <div className='w-full'>
          <div className='w-full'>
            <LabelTooltip label={type === 'get' ? 'Your Thena Id' : 'Thena Id'} />
            {thenaIds.map((thenaItem, index) => (
              <ThenaIdInput
                onChange={({ errorMessage, cost, username }) => {
                  setThenaIds(prev =>
                    prev.map(item => {
                      if (item.id === thenaItem.id) {
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
                }}
                costPerToken={costPerToken}
                key={index}
              />
            ))}
          </div>

          <div className='mt-4 flex items-center justify-center space-x-3 md:mt-6'>
            <PrimaryButton
              onClick={() => {
                if (thenaIds.length >= 2) {
                  setThenaIds(thenaIds.slice(0, -1))
                }
              }}
              disabled={thenaIds.length === 1}
              className='bg-red-600 p-[0.5rem] hover:bg-red-600'
            >
              <Image src='/svgs/minus-v2.svg' alt='' width={20} height={20} />
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
              className='bg-green-600 p-[0.5rem] hover:bg-green-600'
              disabled={thenaIds.length >= 10}
            >
              <Image src='/svgs/plus-v2.svg' alt='' width={20} height={20} />
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
      <div className='mt-3 flex w-full flex-row justify-center gap-4'>
        <EmphasisButton
          className='py-3.5 text-white lg:px-16 lg:py-3'
          // disabled={!isValid || loading || isMinting}
          // onClick={onMint}
        >
          {t('Mint Now')}
        </EmphasisButton>
      </div>
    </div>
  )
}

export default ThenaContent
