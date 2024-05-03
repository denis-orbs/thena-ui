import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'

import { successToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'
import { CopyIcon } from '@/svgs'

export function CopyAddress({ value }) {
  const t = useTranslations()
  const { account } = useWallet()

  const isOwnProfile = useMemo(() => value.toLowerCase() === account?.toLowerCase(), [account, value])
  const onCopy = useCallback(
    e => {
      e.stopPropagation()
      e.preventDefault()
      navigator.clipboard.writeText(value)
      successToast(t('Copied'))
    },
    [t, value],
  )

  return isOwnProfile ? <></> : <CopyIcon onClick={onCopy} className='ml-1 h-5 w-5 cursor-pointer stroke-neutral-200' />
}
