'use client'

import ConnectButton from '@/components/buttons/ConnectButton'
import useWallet from '@/hooks/useWallet'

import DownloadImage from './DownloadImage'
import ShareImage from './ShareImage'
import useCheckShouldUseS3Upload from '../hooks/useCheckShouldUseS3Upload'

export default function ActionButtons({ fileName, scale = 1, backgroundColor = '#0B040D' }) {
  const { account } = useWallet()
  const shouldUseS3Upload = useCheckShouldUseS3Upload()

  return shouldUseS3Upload && !account ? (
    <ConnectButton className='w-full' />
  ) : (
    <>
      {account && <ShareImage fileName={fileName} scale={scale} backgroundColor={backgroundColor} />}
      <DownloadImage
        fileName={fileName}
        scale={scale}
        backgroundColor={backgroundColor}
        shouldUseS3Upload={shouldUseS3Upload}
        className={!account ? 'w-full' : 'w-1/2'}
      />
    </>
  )
}
