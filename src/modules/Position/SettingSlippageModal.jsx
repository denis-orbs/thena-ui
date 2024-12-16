import React, { useState } from 'react'

import TransactionSettingModal from '@/app/pools/add-liquidity/TransactionSettingModal'
import { TextIconButton } from '@/components/buttons/IconButton'
import { SettingsIcon } from '@/svgs'

function SettingSlippageModal({ slippage, updateSlippage }) {
  const [popup, setPopup] = useState(false)

  return (
    <>
      <TextIconButton
        Icon={SettingsIcon}
        onClick={() => {
          setPopup(true)
        }}
      />
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
