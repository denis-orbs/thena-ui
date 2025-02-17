import React, { useState } from 'react'

import TransactionSettingModal from '@/app/pools/add-liquidity/TransactionSettingModal'
import { TextIconButton } from '@/components/buttons/IconButton'
import { Paragraph } from '@/components/typography'
import { SettingsIcon } from '@/svgs'

function SettingSlippageModal({ slippage, updateSlippage }) {
  const [popup, setPopup] = useState(false)

  return (
    <>
      <p className='flex items-center justify-end'>
        <Paragraph>Slippage</Paragraph>
        <TextIconButton
          Icon={SettingsIcon}
          onClick={() => {
            setPopup(true)
          }}
        />
      </p>
      <TransactionSettingModal
        isOpen={popup}
        setIsOpen={setPopup}
        slippage={slippage}
        updateSlippage={updateSlippage}
      />
    </>
  )
}

export default SettingSlippageModal
