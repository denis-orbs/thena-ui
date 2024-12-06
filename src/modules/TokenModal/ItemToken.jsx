'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { formatUnits, isAddress } from 'viem'
import { useReadContract } from 'wagmi'

import CircleImage from '@/components/image/CircleImage'
import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { ERC20Abi } from '@/constant/abi'
import { LOCAL_STORAGE_TOKENS, useLocalStorage } from '@/hooks/useLocalStorage'
import useWallet from '@/hooks/useWallet'
import { addToken, cn, formatAmount, goScan } from '@/lib/utils'
import { ExternalIcon, PlusCircleIcon, PlusIcon } from '@/svgs'

import WarningModal from './WarningModal'

export function ItemToken({
  item,
  setPopup,
  selectedAsset,
  setSelectedAsset,
  otherAsset,
  setOtherAsset,
  onAssetSelect = () => {},
}) {
  const t = useTranslations()
  const { account, chainId } = useWallet()
  const { setWithExpiry, getWithExpiry } = useLocalStorage()
  const [popupAdd, setPopupAdd] = useState(false)

  const handleAddToken = token => {
    const temp = getWithExpiry(LOCAL_STORAGE_TOKENS) ?? []

    delete token.isCustom
    delete token.balance

    token.isFromStorage = true
    const exists = temp.some(tk => tk.address === token.address)
    if (exists) return
    setWithExpiry(LOCAL_STORAGE_TOKENS, [...temp, token], 36 * 24 * 3600 * 1000)
  }

  const { data: balanceOf } = useReadContract({
    abi: ERC20Abi,
    functionName: 'balanceOf',
    address: item.address,
    args: [account],
    query: {
      enable: isAddress(item.address) && account && !item.balance,
    },
  })

  const balance = item.balance ?? formatUnits(balanceOf ?? 0, item.decimals)

  return (
    <>
      <div
        className='flex cursor-pointer items-center justify-between rounded-lg px-6 py-3 hover:bg-neutral-800'
        key={item.address}
        onClick={() => {
          if (item.isCustom) return

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
                      data-tooltip-id={`add-tooltip-${item.address}`}
                    />
                  )}
                  <CustomTooltip id={`add-tooltip-${item.address}`} className='rounded-md !py-2'>
                    <TextHeading className='text-xs'>{t('Add to Wallet')}</TextHeading>
                  </CustomTooltip>
                  <ExternalIcon
                    className='h-3 w-3 stroke-neutral-400 hover:stroke-neutral-50'
                    onClick={e => {
                      e.stopPropagation()
                      e.preventDefault()
                      goScan(chainId, item.address)
                    }}
                    data-tooltip-id={`contract-tooltip-${item.address}`}
                  />
                  <CustomTooltip id={`contract-tooltip-${item.address}`} className='rounded-md !py-2' place='top'>
                    <TextHeading className='text-xs'>{t('Contract Address')}</TextHeading>
                  </CustomTooltip>
                </div>
              )}
            </div>
            <TextSubHeading>{item.name}</TextSubHeading>
          </div>
        </div>

        <div className='flex items-center justify-center gap-3'>
          <div className={cn('flex flex-col items-end', !account && 'hidden')}>
            <TextHeading>{formatAmount(balance) || ''}</TextHeading>
            {item?.price && balance ? (
              <TextSubHeading>${formatAmount(balance.times(item.price))}</TextSubHeading>
            ) : (
              <TextSubHeading>Added by user</TextSubHeading>
            )}
          </div>

          <span
            onClick={() => {
              setPopupAdd(true)
            }}
            className={cn('cursor-pointer rounded-lg bg-neutral-600 p-2', {
              hidden: !item.isCustom,
            })}
          >
            <PlusIcon className={cn('size-5 stroke-primary-400', { hidden: !item.isCustom })} />
          </span>
        </div>
      </div>

      <WarningModal
        popup={popupAdd}
        setPopup={setPopupAdd}
        onConfirm={() => handleAddToken(item)}
        // item={item}
        // networkId={networkId}
      />
    </>
  )
}
