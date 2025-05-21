import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useWithdrawFunds } from '@/hooks/automationContract/useAutomationContract'
import useChainLINKData from '@/hooks/useChainLINKData'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import SelectTokenFromList from '../SelectTokenModal/SelectTokenFromList'

function WithdrawFundsModal({ contract, popup, setPopup }) {
  const { onWithdrawFunds, pending } = useWithdrawFunds()

  const t = useTranslations()

  const { chainLinkData } = useChainLINKData()

  const [tokenPopup, setTokenPopup] = useState()
  const [chainLINK, setChainLINK] = useState()

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Withdraw Funds'
    >
      <ModalBody className='space-y-5'>
        <Box className='flex flex-row items-center gap-3 border border-primary-800 bg-primary-950'>
          {t('Warrning widraw fund automation')}
        </Box>
        <TextHeading>{t('Select Tokens')}</TextHeading>
        <div
          className='flex cursor-pointer items-center justify-between rounded-[8px] bg-neutral-700 px-4 py-3'
          onClick={() => setTokenPopup(true)}
        >
          {chainLINK ? (
            <div className='flex items-center gap-3'>
              <CircleImage className='h-6 w-6' alt='Logo' src={chainLINK?.logoURI || UNKNOWN_LOGO} />
              <div className='flex items-end gap-2'>
                <TextHeading>{chainLINK.symbol}</TextHeading>
              </div>
            </div>
          ) : (
            <p className='text-neutral-400'>{t('Select ChainLINK')}</p>
          )}
          <ChevronDownIcon
            className={cn(
              'transfrom h-5 w-5 transition-all duration-150 ease-out',
              tokenPopup ? 'rotate-180' : 'rotate-0',
            )}
          />
        </div>
        <SelectTokenFromList
          allowSearch={false}
          isOpen={tokenPopup}
          selectedAsset={chainLINK}
          setIsOpen={setTokenPopup}
          setToken={setChainLINK}
          tokens={chainLinkData}
        />
      </ModalBody>
      <ModalFooter className='grid grid-cols-2 gap-3'>
        <EmphasisButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            onWithdrawFunds(contract.address, chainLINK.address)
            setPopup(false)
          }}
        >
          {t('Withdraw Funds')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default WithdrawFundsModal
