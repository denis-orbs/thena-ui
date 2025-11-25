'use client'

import ConnectButton from '@/components/buttons/ConnectButton'
import useWallet from '@/hooks/useWallet'

import DownloadImage from './DownloadImage'
import ShareImage from './ShareImage'

export default function ActionButtons({ fileName, backgroundColor = '#0B040D' }) {
  const { account } = useWallet()

  return (
    <>
      {!account ? (
        <ConnectButton className='w-full' />
      ) : (
        <ShareImage fileName={fileName} backgroundColor={backgroundColor} />
      )}
      <DownloadImage fileName={fileName} backgroundColor={backgroundColor} className={!account ? 'w-full' : 'w-1/2'} />
    </>
  )
}
