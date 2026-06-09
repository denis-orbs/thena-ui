/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import Image from 'next/image'
import { ORBS_LOGO, ORBS_WEBSITE_URL } from '@orbs-network/spot-react'

export function PoweredByOrbs() {
  return (
    <a
      href={ORBS_WEBSITE_URL}
      target='_blank'
      rel='noopener noreferrer'
      className='twap-powered-by flex items-center justify-center gap-2'
    >
      <p className='text-[14px] font-medium text-white'>Powered by Orbs</p>
      <Image src={ORBS_LOGO} alt='Orbs' width={22} height={22} />
    </a>
  )
}
