import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import { useVeTHEsContext } from '@/app/dashboard/VeTHEsContext'
import VeTheDropdown from '@/components/dropdown/VeTheDropdown'
import { CHAIN_ID } from '@/constant/contracts'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getVeTHEContract } from '@/lib/contracts'

function VeTHEDropdownData({ veTHESelected, setVeTHESelected, disabled }) {
  const t = useTranslations()
  const { veTHEs } = useVeTHEsContext()
  const { account, chainId } = useWallet()
  const [approvedId, setApprovedId] = useState('')
  const debouncedId = useDebounce(approvedId)

  const { data: isApproved } = useSWR(
    debouncedId &&
      account &&
      (chainId === ChainId.BSC || chainId === CHAIN_ID.TEST_BSC) && ['vethe/approved', debouncedId, account],
    async () => {
      const veTHEContract = getVeTHEContract(chainId)
      return await readCall(veTHEContract, 'isApprovedOrOwner', [account, debouncedId], chainId)
    },
    {
      refreshInterval: 0,
    },
  )

  return (
    <VeTheDropdown
      className='w-full'
      data={[...veTHEs].map(item => ({
        ...item,
        label: `veTHE #${item.id}`,
      }))}
      selected={veTHESelected ? `veTHE #${veTHESelected.id}` : ''}
      setSelected={ele => setVeTHESelected(ele)}
      placeHolder={t('Select veTHE')}
      isLocale={false}
      isApproved={isApproved}
      approvedId={approvedId}
      setApprovedId={setApprovedId}
      disabled={disabled}
    />
  )
}

export default VeTHEDropdownData
