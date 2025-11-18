import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { ErrorButton } from '@/components/buttons/Button'
import { Paragraph } from '@/components/typography'
import { useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import InfoIcon from '@/icons/InfoIcon'
import SwapModal from '@/modules/SwapModal'
import { convertBooleansToHex, formatAmount } from '@/utils/utils'

function WarningLINKBalance({ contract, chainLINK, refetchChainLINKData }) {
  const t = useTranslations()
  const [openSwapModal, setOpenSwapModal] = useState(false)
  const { minimumFunds: minFunds } = useGetMinimumFunds(
    contract?.veTHEId,
    convertBooleansToHex(
      contract?.votes?.isAutoVote,
      contract?.settings?.isRelockEveryWeek,
      contract?.settings?.isClaimEveryWeek,
    ),
    (contract?.votes?.pairs || []).filter(item => Boolean(item.pair)).length,
  )

  return (
    <>
      {chainLINK && minFunds?.gt(chainLINK?.balance) && (
        <div className='border-error-800 bg-error-950 flex items-center gap-4 rounded-xl border px-4 py-2 lg:px-5 lg:py-4'>
          <InfoIcon className='stroke-error-800! h-5 w-5' />
          <div className='flex w-full flex-row items-center justify-between gap-2'>
            <Paragraph className='text-base text-red-100'>
              {t('You have [balance] LINK in your Wallet', { balance: formatAmount(chainLINK.balance) || 0 })}
            </Paragraph>
            <ErrorButton onClick={() => setOpenSwapModal(true)} className='bg-error-800 min-w-fit'>
              {t('Get LINK')}
            </ErrorButton>
          </div>
          <SwapModal
            open={openSwapModal}
            setOpen={setOpenSwapModal}
            onSwapSuccess={refetchChainLINKData}
            inputCurrency='BNB'
            toAsset={chainLINK}
            disabledChangeOutputCurrency
          />
        </div>
      )}
    </>
  )
}

export default WarningLINKBalance
