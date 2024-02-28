'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'

import { PrimaryButton } from '@/components/buttons/Button'

export default function NotConnected() {
  const { open } = useWeb3Modal()

  return (
    <div className='px-6'>
      <div className='graphics-bg flex w-full flex-col items-center justify-center gap-4 py-40'>
        <div className='flex flex-col items-center gap-3'>
          <h2>Begin your DeFi journey on THENA</h2>
        </div>
        <PrimaryButton onClick={() => open()}>Connect Wallet</PrimaryButton>
      </div>
    </div>
  )
}
