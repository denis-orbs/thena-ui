import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useActiveAutomation } from '@/hooks/automationContract/useAutomationContract'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount } from '@/lib/utils'
import SelectTokenFromList from '@/modules/SelectTokenModal/SelectTokenFromList'
import { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'
import { ChevronDownIcon } from '@/svgs'

const UPDATE_REGISTRATION = {
  CHAINLINK: 'chainlink',
  CHAINLINK_AMOUNT: 'chainlinkAmount',
}

function ChainlinkModal({ tokenId, address, mutateAutomationData, popup, setPopup }) {
  const [chainlinkAmount, setChainlinkAmount] = useState()
  const [chainlink, setChainlink] = useState()
  const [popupSelectChainlink, setPopupSelectChainlink] = useState(false)

  const t = useTranslations()

  const { onActive, pending } = useActiveAutomation()

  const updateRegistration = useCallback((data, type) => {
    if (!data) return
    if (type === UPDATE_REGISTRATION.CHAINLINK) {
      setChainlink(data)
    }

    if (type === UPDATE_REGISTRATION.CHAINLINK_AMOUNT) {
      setChainlinkAmount(data)
    }
  }, [])

  const assets = useAssets()
  const { chainId } = useWallet()

  const chainLinkData = useMemo(
    () =>
      (assets || []).filter(asset =>
        [Contracts.chainlinkToken[chainId], Contracts.chainlinkTokenERC677[chainId]].includes(asset.address),
      ),
    [assets, chainId],
  )

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Enter Chainlink Amount'
    >
      <ModalBody>
        <div className='flex flex-col gap-3 pt-5'>
          <TextHeading className='text-[18px]'>{t('Registration')}</TextHeading>
          <div className='space-y-3'>
            <Paragraph className='text-base'>{t('Starting Balance')}</Paragraph>
            <div className='grid grid-cols-2 gap-3'>
              <div
                className='flex cursor-pointer items-center justify-between rounded-[8px] bg-neutral-700 px-4 py-3'
                onClick={() => setPopupSelectChainlink(true)}
              >
                {chainlink ? (
                  <div className='flex items-center gap-3'>
                    <CircleImage className='h-6 w-6' alt='Logo' src={chainlink?.logoURI || UNKNOWN_LOGO} />
                    <div className='flex items-end gap-2'>
                      <TextHeading>{chainlink.symbol}</TextHeading>
                    </div>
                  </div>
                ) : (
                  <p className='text-neutral-400'>{t('Select Chainlink')}</p>
                )}
                <ChevronDownIcon
                  className={cn(
                    'transfrom h-5 w-5 transition-all duration-150 ease-out',
                    popupSelectChainlink ? 'rotate-180' : 'rotate-0',
                  )}
                />
              </div>
              <Input
                val={chainlinkAmount}
                min={0.1}
                placeholder='Link Amount'
                onChange={e => updateRegistration(Number(e.target.value), UPDATE_REGISTRATION.CHAINLINK_AMOUNT)}
                suffix={`$${chainlink ? formatAmount(chainlinkAmount * chainlink.price) : 0}`}
              />
            </div>
            <ErrorMessage message={t('Registration automation contract description')} />
          </div>
          <SelectTokenFromList
            allowSearch={false}
            isOpen={popupSelectChainlink}
            selectedAsset={chainlink}
            setIsOpen={setPopupSelectChainlink}
            setToken={data => {
              updateRegistration({ ...data, balance: data.balance.toNumber() }, UPDATE_REGISTRATION.CHAINLINK)
            }}
            tokens={chainLinkData}
          />
        </div>
      </ModalBody>

      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          disabled={!chainlink || !chainlinkAmount || pending}
          className='w-full'
          onClick={() => {
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
