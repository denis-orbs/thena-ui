import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useActiveAutomation, useAutomationContractDetail } from '@/hooks/automationContract/useAutomationContract'
import { warnToast } from '@/lib/notify'
import { isInvalidAmount } from '@/lib/utils'
import RegisterAutomation from '@/modules/CreateVeTHEAutomation/RegisterAutomation'

const UPDATE_REGISTRATION = {
  CHAINLINK: 'chainlink',
  CHAINLINK_AMOUNT: 'chainlinkAmount',
}

function ChainlinkModal({ address, tokenId, mutateAutomationData, popup, setPopup }) {
  const [chainlinkAmount, setChainlinkAmount] = useState('')
  const [chainlink, setChainlink] = useState()
  const { contractData } = useAutomationContractDetail(tokenId)
  const [minFunds, setMinFunds] = useState(new BigNumber(0))
  const t = useTranslations()

  const { onActive, pending } = useActiveAutomation()

  const updateRegistration = useCallback((data, type) => {
    if (type === UPDATE_REGISTRATION.CHAINLINK) {
      setChainlink(data)
    }

    if (type === UPDATE_REGISTRATION.CHAINLINK_AMOUNT) {
      setChainlinkAmount(data)
    }
  }, [])

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Register Automation'
    >
      <ModalBody>
        <div className='flex flex-col gap-3 pt-5'>
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Contract Name')}</Paragraph>
            <TextHeading>{t('veTHE Contract [veTHEId]', { veTHEId: tokenId })}</TextHeading>
          </div>
          <RegisterAutomation
            chainLINK={chainlink}
            chainLINKAmount={chainlinkAmount}
            updateRegistration={updateRegistration}
            contractData={contractData}
            setMinFunds={setMinFunds}
          />
        </div>
      </ModalBody>

      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          disabled={!chainlink || !chainlinkAmount || minFunds.gt(new BigNumber(chainlinkAmount)) || pending}
          className='w-full'
          onClick={() => {
            if (minFunds.gt(new BigNumber(chainlinkAmount))) {
              return
            }

            if (chainlinkAmount > chainlink.balance || isInvalidAmount(chainlinkAmount)) {
              warnToast(t('Invalid Amount'))
              return
            }
            onActive(address, tokenId, chainlink, chainlinkAmount, () => {
              mutateAutomationData()
              setPopup(false)
            })
            setPopup(false)
          }}
        >
          {t('Save')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default ChainlinkModal
