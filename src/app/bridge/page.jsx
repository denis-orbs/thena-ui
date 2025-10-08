'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { isAddress } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import Selection from '@/components/selection'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { useAsset } from '@/hooks/useAsset'
import { useBridge } from '@/hooks/useBridge'
import { useBSCTheTokenBalance } from '@/hooks/useBSCTheTokenBalance'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { formatAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { Clock, ExternalIcon, ReflectIcon, Wallet3Icon } from '@/svgs'

export default function BridgePage() {
  const [tab, setTab] = useState('bridge')
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState()
  const t = useTranslations()
  const [error, setError] = useState('')
  const debounceDestination = useDebounce(destination, 500)
  const { account } = useWallet()
  const { onBridge, pending } = useBridge()
  const { networkId, updateNetwork } = useChainSettings()
  const theAssetBNBBalance = useBSCTheTokenBalance()

  const theAssetOpBNB = useAsset(CHAIN_ID.OPBNB, Contracts.THE[CHAIN_ID.OPBNB])

  const tabSelections = useMemo(
    () => [
      {
        label: 'Bridge',
        active: tab === 'bridge',
        icon: <ReflectIcon className='size-5' />,
        onClickHandler: () => {
          setTab('bridge')
        },
      },
      {
        label: 'Bridge History',
        active: tab === 'history',
        icon: <Clock className='size-5' />,
        onClickHandler: () => {
          setTab('history')
        },
      },
    ],
    [tab],
  )

  useEffect(() => {
    if (account) {
      setDestination(prev => prev ?? account)
    }
  }, [account])

  useEffect(() => {
    if (debounceDestination && !isAddress(debounceDestination)) {
      // Add validate address
      setError('The address format is not a valid EVM address.')
    } else {
      setError('')
    }
  }, [debounceDestination])

  return (
    <div className='layout flex flex-col gap-9'>
      <TextHeading className='font-archia text-5xl font-semibold'>{t('Briding from opBNB to BNB')}</TextHeading>
      <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
        <div className='w-full'>
          <div className='mb-6 grid w-full grid-cols-2 gap-4'>
            <div className='flex flex-col gap-2'>
              <Paragraph className='text-neutral-300'>{t('from')}</Paragraph>
              <div className='flex w-full items-center gap-4 rounded-lg bg-neutral-700 p-2'>
                <CircleImage src='/images/opBNB.png' className='size-9' alt='opBNB' />
                <div>
                  <TextHeading className='text-sm'>{t('opBNB - Chain')}</TextHeading>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <Paragraph className='text-neutral-300'>{t('to')}</Paragraph>
              <div className='flex w-full items-center gap-4 rounded-lg bg-neutral-700 p-2'>
                <CircleImage src='/images/bnb.png' className='size-9' alt='BNB' />
                <div>
                  <TextHeading className='text-sm'>{t('BNB - Chain')}</TextHeading>
                </div>
              </div>
            </div>
          </div>
          <Selection
            data={tabSelections}
            isFull
            className='w-full'
            classNames={{
              items: 'gap-2 flex items-center justify-center',
            }}
          />

          <div className='my-4 flex flex-col gap-2'>
            <CustomTokenInput
              asset={theAssetOpBNB}
              amount={amount}
              setAmount={setAmount}
              hasTabs={false}
              maxBalance={theAssetOpBNB?.balance}
              helperText='opBNB-Chain'
              autoFocus
              disabledSelect
              enableSetMax
            />
            <div className='flex justify-between text-xs text-neutral-400'>
              <span />
              {theAssetBNBBalance && (
                <span>
                  {t('Available Amount on [chain]', {
                    chain: 'BNB',
                  })}
                  : {formatAmount(theAssetBNBBalance)}
                </span>
              )}
            </div>
          </div>
          <div className='mb-6 flex flex-col gap-2'>
            <TextSubHeading className='text-base font-medium text-neutral-50'>
              {t('Destination address')}
            </TextSubHeading>
            <Input
              type='text'
              placeholder='Destination address'
              val={destination}
              onChange={e => setDestination(e.target.value)}
              LeadingIcon={<Wallet3Icon />}
              classNames={{
                input: error ? 'border-error-500' : undefined,
              }}
            />
            {error && <Paragraph className='text-error-500 text-base font-normal'>{error}</Paragraph>}
          </div>

          {networkId !== ChainId.OPBNB ? (
            <PrimaryButton className='w-full py-3 text-lg font-semibold' onClick={() => updateNetwork(ChainId.OPBNB)}>
              {t('Switch Chain')}
            </PrimaryButton>
          ) : account ? (
            <PrimaryButton
              onClick={() => {
                onBridge(debounceDestination, amount)
              }}
              disabled={!isAddress(debounceDestination) || !amount || pending}
              className='w-full py-3 text-lg font-semibold'
            >
              {t('Bridge')}
            </PrimaryButton>
          ) : (
            <ConnectButton className='w-full' />
          )}
        </div>
        <div className='flex w-full flex-col gap-2 rounded-xl bg-neutral-900 p-4'>
          <TextHeading className='font-archia text-xl font-semibold'>{t('Bridge THE Tokens')}</TextHeading>
          <div>
            <Paragraph className='text-neutral-400'>
              {t('Bridge THE Tokens desc')}
              <br />
              {t('How it works')}
            </Paragraph>
            <ul className='list-disc pl-5 text-neutral-400'>
              <li>{t('Use the Thena Bridge for THE tokens')}</li>
              <li>{t('THE tokens are locked on the BNB Chain')}</li>
              <li>{t('Duration approximately a few minutes')}</li>
            </ul>
          </div>
          <TextHeading className='font-archia text-xl font-semibold'>{t('Bridging back')}</TextHeading>
          <Paragraph className='text-neutral-400'>{t('Bridging back desc')}</Paragraph>
          <TextHeading className='font-archia text-xl font-semibold'>{t('Available Amount')}</TextHeading>
          <Paragraph className='text-neutral-400'>{t('Available Amount desc')}</Paragraph>
          <TextHeading className='font-archia text-xl font-semibold'>{t('For all other tokens')}</TextHeading>
          <Paragraph className='flex text-neutral-400'>
            {t('Use the')}
            <Link href='https://www.bnbchain.org/en/bridge' rel='noopener noreferrer' target='_blank' prefetch={false}>
              <div className='ml-1 flex items-center'>
                {t('Binance Bridge')} <ExternalIcon className='ml-2 h-4 w-4 stroke-neutral-400' />
              </div>
            </Link>
          </Paragraph>
        </div>
      </div>
    </div>
  )
}
