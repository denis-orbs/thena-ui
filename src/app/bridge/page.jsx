'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { isAddress } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { useAsset } from '@/hooks/useAsset'
import { useBridge } from '@/hooks/useBridge'
import { useBSCTheTokenBalance } from '@/hooks/useBSCTheTokenBalance'
import useDebounce from '@/hooks/useDebounce'
import { useOpBNBTheTokenBalance } from '@/hooks/useOpBNBTheTokenBalance'
import useWallet from '@/hooks/useWallet'
import { formatAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { SwitchHorizontalV2Icon, Wallet3Icon } from '@/svgs'

const richRenderers = {
  ccipLink: chunks => (
    <Link href='https://docs.chain.link/ccip' className='text-primary-600' target='_blank' rel='noopener noreferrer'>
      {chunks}
    </Link>
  ),
  ccipInfo: chunks => (
    <Link
      href='https://docs.chain.link/ccip/directory/mainnet/token/THE'
      className='text-primary-600'
      target='_blank'
      rel='noopener noreferrer'
    >
      {chunks}
    </Link>
  ),
}
export default function BridgePage() {
  const t = useTranslations()
  const [error, setError] = useState('')
  const { account } = useWallet()
  const { networkId, updateNetwork } = useChainSettings()

  // Initialize chains based on current network
  const [sourceChain, setSourceChain] = useState(() =>
    networkId === ChainId.OPBNB ? CHAIN_ID.OPBNB : networkId === ChainId.BSC ? CHAIN_ID.BSC : CHAIN_ID.OPBNB,
  )
  const [destinationChain, setDestinationChain] = useState(() =>
    networkId === ChainId.OPBNB ? CHAIN_ID.BSC : CHAIN_ID.OPBNB,
  )

  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState()
  const debounceDestination = useDebounce(destination, 500)

  const { onBridge, pending } = useBridge(sourceChain, destinationChain)
  const theAssetBNBBalance = useBSCTheTokenBalance()
  const theAssetOpBNBBalance = useOpBNBTheTokenBalance()

  const theAssetOpBNB = useAsset(CHAIN_ID.OPBNB, Contracts.THE[CHAIN_ID.OPBNB])
  const theAssetBNB = useAsset(CHAIN_ID.BSC, Contracts.THE[CHAIN_ID.BSC])

  // Get dynamic values based on direction - memoized to prevent unnecessary recalculations
  const sourceAsset = useMemo(
    () => (sourceChain === CHAIN_ID.OPBNB ? theAssetOpBNB : theAssetBNB),
    [sourceChain, theAssetOpBNB, theAssetBNB],
  )

  const destinationBalance = useMemo(
    () => (sourceChain === CHAIN_ID.OPBNB ? theAssetBNBBalance : theAssetOpBNBBalance),
    [sourceChain, theAssetBNBBalance, theAssetOpBNBBalance],
  )

  const sourceChainName = useMemo(() => (sourceChain === CHAIN_ID.OPBNB ? 'opBNB' : 'BNB'), [sourceChain])
  const destinationChainName = useMemo(() => (sourceChain === CHAIN_ID.OPBNB ? 'BNB' : 'opBNB'), [sourceChain])
  const sourceChainImage = useMemo(
    () => (sourceChain === CHAIN_ID.OPBNB ? '/images/opBNB.png' : '/images/bnb.png'),
    [sourceChain],
  )
  const destinationChainImage = useMemo(
    () => (sourceChain === CHAIN_ID.OPBNB ? '/images/bnb.png' : '/images/opBNB.png'),
    [sourceChain],
  )

  // Check if user is on the correct network for bridging
  const isOnCorrectNetwork = useMemo(() => {
    if (sourceChain === CHAIN_ID.OPBNB) {
      return networkId === ChainId.OPBNB
    }
    return networkId === ChainId.BSC
  }, [sourceChain, networkId])

  const handleSwitchChains = () => {
    const targetChain = sourceChain === CHAIN_ID.OPBNB ? ChainId.BSC : ChainId.OPBNB
    updateNetwork(targetChain)
    setAmount('')
  }

  // Update direction when network changes
  useEffect(() => {
    if (networkId === ChainId.OPBNB) {
      setSourceChain(CHAIN_ID.OPBNB)
      setDestinationChain(CHAIN_ID.BSC)
    } else if (networkId === ChainId.BSC) {
      setSourceChain(CHAIN_ID.BSC)
      setDestinationChain(CHAIN_ID.OPBNB)
    }
  }, [networkId])

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
      <TextHeading className='font-archia text-5xl font-semibold'>
        {t('Transfer from [sourceChainName] to [destinationChainName]', {
          sourceChainName,
          destinationChainName,
        })}
      </TextHeading>
      <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
        <div className='w-full'>
          <div className='mb-6 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4'>
            <div className='flex flex-col gap-2'>
              <Paragraph className='text-neutral-300'>{t('from')}</Paragraph>
              <div className='flex w-full items-center gap-4 rounded-lg bg-neutral-700 p-2'>
                <CircleImage src={sourceChainImage} className='size-9' alt={sourceChainName} />
                <div>
                  <TextHeading className='text-sm'>{sourceChainName} Chain</TextHeading>
                </div>
              </div>
            </div>

            <EmphasisIconButton
              className='mt-8 cursor-pointer'
              Icon={SwitchHorizontalV2Icon}
              onClick={handleSwitchChains}
            />

            <div className='flex flex-col gap-2'>
              <Paragraph className='text-neutral-300'>{t('to')}</Paragraph>
              <div className='flex w-full items-center gap-4 rounded-lg bg-neutral-700 p-2'>
                <CircleImage src={destinationChainImage} className='size-9' alt={destinationChainName} />
                <div>
                  <TextHeading className='text-sm'>
                    {destinationChainName} {t('Chain')}
                  </TextHeading>
                </div>
              </div>
            </div>
          </div>

          <div className='my-4 flex flex-col gap-2'>
            <CustomTokenInput
              asset={sourceAsset}
              amount={amount}
              setAmount={setAmount}
              hasTabs={false}
              maxBalance={sourceAsset?.balance}
              helperText={`${sourceChainName} Chain`}
              autoFocus
              disabledSelect
              enableSetMax
            />
            <div className='flex justify-between text-xs text-neutral-400'>
              <span />
              {destinationBalance && (
                <span>
                  {t('Available Amount on [chain]', {
                    chain: destinationChainName,
                  })}
                  : {formatAmount(destinationBalance)}
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

          {!account ? (
            <ConnectButton className='w-full' />
          ) : !isOnCorrectNetwork ? (
            <PrimaryButton
              className='w-full py-3 text-lg font-semibold'
              onClick={() => updateNetwork(sourceChain === CHAIN_ID.OPBNB ? ChainId.OPBNB : ChainId.BSC)}
            >
              {t('Switch to [chain] Chain', { chain: sourceChainName })}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => {
                onBridge(debounceDestination, amount)
              }}
              disabled={!isAddress(debounceDestination) || !amount || pending}
              className='w-full py-3 text-lg font-semibold'
            >
              {t('Bridge')}
            </PrimaryButton>
          )}
        </div>
        <div className='flex w-full flex-col gap-2 rounded-xl bg-neutral-900 p-4'>
          <TextHeading className='font-archia text-xl font-semibold'>{t('Bridge THE Token')}</TextHeading>
          <div>
            <Paragraph className='text-neutral-400'>
              {t('Bridge THE Tokens desc1')}
              <br />
              <br />
              {t('Bridge THE Tokens desc2')}
              <br />
              <br />
              {t.rich('Bridge THE Tokens desc3', {
                ...richRenderers,
              })}
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  )
}
