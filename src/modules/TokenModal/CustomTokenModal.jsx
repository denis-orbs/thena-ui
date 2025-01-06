import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount, goScan } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { ExternalIcon } from '@/svgs'

function CustomTokenModal({ popup, setPopup, setSelectedAsset, assets }) {
  const [searchText, setSearchText] = useState('')
  const { networkId } = useChainSettings()
  const t = useTranslations()

  const filteredAssets = useMemo(
    () =>
      searchText
        ? assets.filter(
            asset =>
              asset.name.toLowerCase().includes(searchText.toLowerCase()) ||
              asset.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
              asset.address.toLowerCase().includes(searchText.toLowerCase()),
          )
        : assets,
    [assets, searchText],
  )

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title={t('Select a Token')}
    >
      <div className='mb-3 px-6 py-3'>
        <SearchInput
          className='w-full'
          val={searchText}
          setVal={setSearchText}
          placeholder='Search by Name, Symbol or Address'
          autoFocus
        />
      </div>
      <div className='h-px w-full border border-neutral-700' />
      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='mb-3 px-6'>{t('Token Name')}</Paragraph>
        <div className='max-h-[340px] overflow-auto'>
          {filteredAssets.map((item, idx) => (
            <div
              className='flex cursor-pointer items-center justify-between rounded-lg px-6 py-3 hover:bg-slate-800'
              onClick={() => {
                setSelectedAsset(item)
                setPopup(false)
              }}
              key={item?.address}
            >
              <div className='flex items-center gap-2 rounded-lg'>
                <CircleImage src={item?.logoURI} width={32} height={32} alt='thena token' />
                <div className='flex flex-col'>
                  <div className='flex items-center space-x-1'>
                    <TextHeading>{item?.symbol}</TextHeading>
                    {item?.address !== 'BNB' && (
                      <div className='flex items-center gap-1'>
                        <CustomTooltip id={`add-tooltip-${idx}`} className='rounded-md !py-2'>
                          <TextHeading className='text-xs'>{t('Add to Wallet')}</TextHeading>
                        </CustomTooltip>
                        <ExternalIcon
                          className='h-3 w-3 stroke-neutral-400 hover:stroke-neutral-50'
                          onClick={e => {
                            e.stopPropagation()
                            e.preventDefault()
                            goScan(networkId, item?.address)
                          }}
                          data-tooltip-id={`contract-tooltip-${idx}`}
                        />
                        <CustomTooltip id={`contract-tooltip-${idx}`} className='rounded-md !py-2' place='top'>
                          <TextHeading className='text-xs'>{t('Contract Address')}</TextHeading>
                        </CustomTooltip>
                      </div>
                    )}
                  </div>
                  <TextSubHeading>{item?.name}</TextSubHeading>
                </div>
              </div>
              <div className='flex flex-col'>
                <TextHeading className='text-right'>{formatAmount(item?.balance)}</TextHeading>
                <TextSubHeading className='text-right'>
                  ${formatAmount(item?.balance.times(item?.price))}
                </TextSubHeading>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default CustomTokenModal
