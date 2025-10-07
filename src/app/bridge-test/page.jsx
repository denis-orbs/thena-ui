'use client'

import { useState } from 'react'
import { isAddress } from 'viem'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Input from '@/components/input'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { CHAIN_ID } from '@/constant/contracts'
import { useAsset } from '@/hooks/useAsset'
import useCcipTestBridge from '@/hooks/useCcipTestBridge'
import useWallet from '@/hooks/useWallet'

// CCIP-BnM test token addresses and routers (BNB Chain Testnet -> Avalanche Fuji)
// Per Chainlink CCIP tutorial docs
// https://docs.chain.link/ccip/tutorials/evm/transfer-tokens-from-contract
const TESTNET_CONFIG = {
  source: {
    chainId: CHAIN_ID.TEST_BSC,
    router: '0xE1053aE1857476f36A3C62580FF9b016E8EE8F6f', // BNB Chain Testnet router
    token: '0xbFA2ACd33ED6EEc0ed3Cc06bF1ac38d22b36B9e9', // CCIP-BnM on BNB Testnet
    decimals: 18,
  },
  destination: {
    chainSelector: '14767482510784806043', // Avalanche Fuji selector
  },
}

export default function BridgeTestPage() {
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const { account } = useWallet()

  const asset = useAsset(TESTNET_CONFIG.source.chainId, TESTNET_CONFIG.source.token)

  const { onBridge, pending } = useCcipTestBridge({
    sourceRouter: TESTNET_CONFIG.source.router,
    destinationChainSelector: TESTNET_CONFIG.destination.chainSelector,
    tokenAddress: TESTNET_CONFIG.source.token,
    decimals: TESTNET_CONFIG.source.decimals,
  })

  return (
    <div className='layout flex flex-col gap-6'>
      <TextHeading className='font-archia text-4xl font-semibold'>
        CCIP Test Bridge (BNB Chain Testnet → Avalanche Fuji)
      </TextHeading>
      <div className='w-full max-w-xl'>
        <div className='my-4 flex flex-col gap-2'>
          <CustomTokenInput
            asset={asset}
            amount={amount}
            setAmount={setAmount}
            hasTabs={false}
            maxBalance={asset?.balance}
            helperText='BNB Chain Testnet'
            autoFocus
            disabledSelect
            enableSetMax
          />
        </div>
        <div className='mb-6 flex flex-col gap-2'>
          <TextSubHeading className='text-base font-medium text-neutral-50'>Destination address</TextSubHeading>
          <Input
            type='text'
            placeholder='Destination address on Avalanche Fuji'
            val={destination}
            onChange={e => setDestination(e.target.value)}
          />
        </div>
        {account ? (
          <PrimaryButton
            onClick={() => onBridge(destination, amount)}
            disabled={!isAddress(destination) || !amount || pending}
            className='w-full py-3 text-lg font-semibold'
          >
            {pending ? 'Bridging…' : 'Bridge (Testnet)'}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
        <Paragraph className='mt-4 text-neutral-400'>
          Use faucets to get CCIP-BnM test tokens and testnet gas.
        </Paragraph>
      </div>
    </div>
  )
}
