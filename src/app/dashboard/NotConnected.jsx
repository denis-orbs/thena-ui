'use client'

import ConnectButton from '@/components/buttons/ConnectButton'

export default function NotConnected() {
  return (
    <div className='px-6'>
      <div className='graphics-bg flex w-full flex-col items-center justify-center gap-4 py-40'>
        <div className='flex flex-col items-center gap-3'>
          <h2>Begin your DeFi journey on THENA</h2>
        </div>
        <ConnectButton />
      </div>
    </div>
  )
}
