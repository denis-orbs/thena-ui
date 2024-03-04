import React, { useMemo, useState } from 'react'

import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { formatAmount, goScan } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { addToken } from '@/lib/wallets/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { ExternalIcon, PlusCircleIcon } from '@/svgs'

const TrendingTokens = [
  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // usdc
  '0x55d398326f99059fF775485246999027B3197955', // usdt
  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // eth
  '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // btc
  '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // busd
  '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40', // frax
  '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11', // the
  '0x4200000000000000000000000000000000000006',
  '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
  '0xe7798f023fc62146e8aa1b36da45fb70855a77ea',
  '0x7c6b91d9be155a6db01f749217d76ff02a7227f2',
  '0x9d94A7fF461e83F161c8c040E78557e31d8Cba72',
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
]

function TokenModal({
  popup,
  setPopup,
  selectedAsset,
  setSelectedAsset,
  otherAsset,
  setOtherAsset,
  onAssetSelect = () => {},
}) {
  const [searchText, setSearchText] = useState('')
  const { account } = useWallet()
  const baseAssets = useAssets()
  const { networkId } = useChainSettings()

  const filteredAssets = useMemo(
    () =>
      searchText
        ? baseAssets.filter(
            asset =>
              asset.name.toLowerCase().includes(searchText.toLowerCase()) ||
              asset.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
              asset.address.toLowerCase().includes(searchText.toLowerCase()),
          )
        : baseAssets,
    [baseAssets, searchText],
  )

  const trendingAssets = useMemo(
    () =>
      baseAssets.filter(
        asset =>
          asset.address === 'BNB' || TrendingTokens.some(ele => ele.toLowerCase() === asset.address.toLowerCase()),
      ),
    [baseAssets],
  )

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Select Asset'
    >
      <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
        <SearchInput
          className='w-full'
          val={searchText}
          setVal={setSearchText}
          placeholder='Search by Name, Symbol or Address'
          autoFocus
        />
        <Paragraph>Trending Assets</Paragraph>
        <div className='flex flex-wrap gap-2'>
          {trendingAssets.map((item, idx) => (
            <div
              key={idx}
              className='flex cursor-pointer items-center gap-2 rounded-lg bg-neutral-800 p-3'
              onClick={() => {
                if (otherAsset && otherAsset.address === item.address) {
                  const temp = selectedAsset
                  setSelectedAsset(otherAsset)
                  setOtherAsset(temp)
                } else {
                  setSelectedAsset(item)
                }
                onAssetSelect()
                setPopup(false)
              }}
            >
              <CircleImage src={item.logoURI} className='h-8 w-8' alt='thena token' />
              <div>
                <TextHeading className='text-sm'>{item.symbol}</TextHeading>
                {/* <TextSubHeading>{formatAmount(item.balance)}</TextSubHeading> */}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='h-px w-full border border-neutral-700' />
      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='px-3'>Assets</Paragraph>
        <div className='max-h-[340px] overflow-auto'>
          {filteredAssets.map((item, idx) => (
            <div
              className='flex cursor-pointer items-center justify-between rounded-lg px-6 py-3 hover:bg-neutral-800'
              onClick={() => {
                if (otherAsset && otherAsset.address === item.address) {
                  const temp = selectedAsset
                  setSelectedAsset(otherAsset)
                  setOtherAsset(temp)
                } else {
                  setSelectedAsset(item)
                }
                onAssetSelect()
                setPopup(false)
              }}
              key={item.address}
            >
              <div className='flex items-center gap-2 rounded-lg'>
                <CircleImage src={item.logoURI} width={32} height={32} alt='thena token' />
                <div className='flex flex-col'>
                  <div className='flex items-center space-x-1'>
                    <TextHeading>{item.symbol}</TextHeading>
                    {item.address !== 'BNB' && (
                      <div className='flex items-center gap-1'>
                        {account && (
                          <PlusCircleIcon
                            className='h-3 w-3 stroke-neutral-400 hover:stroke-neutral-50'
                            onClick={e => {
                              e.stopPropagation()
                              e.preventDefault()
                              addToken(item)
                            }}
                            data-tooltip-id={`add-tooltip-${idx}`}
                          />
                        )}
                        <CustomTooltip id={`add-tooltip-${idx}`} className='rounded-md !py-2'>
                          <TextHeading className='text-xs'>Add to wallet</TextHeading>
                        </CustomTooltip>
                        <ExternalIcon
                          className='h-3 w-3 stroke-neutral-400 hover:stroke-neutral-50'
                          onClick={e => {
                            e.stopPropagation()
                            e.preventDefault()
                            goScan(networkId, item.address)
                          }}
                          data-tooltip-id={`contract-tooltip-${idx}`}
                        />
                        <CustomTooltip id={`contract-tooltip-${idx}`} className='rounded-md !py-2' place='top'>
                          <TextHeading className='text-xs'>Contract address</TextHeading>
                        </CustomTooltip>
                      </div>
                    )}
                  </div>
                  <TextSubHeading>{item.name}</TextSubHeading>
                </div>
              </div>
              {account && (
                <div className='flex flex-col items-end'>
                  <TextHeading>{formatAmount(item.balance) || ''}</TextHeading>
                  <TextSubHeading>${formatAmount(item.balance.times(item.price))}</TextSubHeading>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default TokenModal
