'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import CircleImage from '@/components/image/CircleImage'
import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { useLocalTokens } from '@/state/localTokens/store'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAmount, goScan } from '@/utils/utils'

import ExternalIcon from '~/svgs/external.svg'
import MinusIcon from '~/svgs/minus.svg'
import PlusIcon from '~/svgs/plus.svg'
import PlusCircleIcon from '~/svgs/plus-circle.svg'

import WarningModal from './WarningModal'

const addToken = async asset => {
  const provider = window.stargate?.wallet?.ethereum?.signer?.provider?.provider ?? window.ethereum
  if (provider) {
    try {
      // wasAdded is a boolean. Like any RPC method, an error can be thrown.
      const wasAdded = await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC-20 tokens, but eventually more!
          options: {
            address: asset.address, // The address of the token.
            symbol: asset.symbol, // A ticker symbol or shorthand, up to 5 characters.
            decimals: asset.decimals, // The number of decimals in the token.
            image: asset.logoURI, // A string URL of the token logo.
          },
        },
      })

      if (wasAdded) {
        console.log('Token Added!')
      } else {
        console.log('Your loss!')
      }
    } catch (error) {
      console.log(error)
    }
  }
}

export function ItemToken({
  item,
  setPopup,
  selectedAsset,
  setSelectedAsset,
  otherAsset,
  setOtherAsset,
  className,
  onAssetSelect = () => {},
}) {
  const t = useTranslations()
  const [token, setToken] = useState(item)
  const { account } = useWallet()
  const [isWarning, setIsWarning] = useState('')
  const { addLocalToken, removeLocalToken } = useLocalTokens()
  const { networkId } = useChainSettings()

  const handleAddToken = async tk => {
    delete tk.isCustom
    delete tk.balance
    tk.isFromStorage = true
    addLocalToken(tk)

    // Automatically select the token after adding it
    setSelectedAsset(tk)
    onAssetSelect()
    setPopup(false)
  }

  const { balance } = token

  return (
    <>
      <div
        className={cn(
          'flex cursor-pointer items-center justify-between rounded-lg px-6 py-3 hover:bg-neutral-800',
          className,
        )}
        key={token.address}
        onClick={() => {
          if (token.isCustom) return

          if (otherAsset && otherAsset.address === token.address) {
            const temp = selectedAsset
            setSelectedAsset(otherAsset)
            setOtherAsset(temp)
          } else {
            setSelectedAsset(token)
          }
          onAssetSelect()
          setPopup(false)
        }}
      >
        <div className='flex items-center gap-2 rounded-lg'>
          <CircleImage src={token.logoURI} width={32} height={32} alt='thena token' />

          <div className='flex flex-col'>
            <div className='flex items-center gap-1'>
              <TextHeading>{token.symbol}</TextHeading>
              {token.address !== 'BNB' && (
                <div className='flex items-center gap-1'>
                  {account && (
                    <PlusCircleIcon
                      className='h-3 w-3 stroke-neutral-400 hover:stroke-neutral-50'
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        addToken(token)
                      }}
                      data-tooltip-id={`add-tooltip-${token.address}`}
                    />
                  )}
                  <CustomTooltip id={`add-tooltip-${token.address}`} className='rounded-md py-2!'>
                    <TextHeading className='text-xs'>{t('Add to Wallet')}</TextHeading>
                  </CustomTooltip>
                  <ExternalIcon
                    className='h-3 w-3 stroke-neutral-400 hover:stroke-neutral-50'
                    onClick={e => {
                      e.stopPropagation()
                      e.preventDefault()
                      goScan(networkId, token.address)
                    }}
                    data-tooltip-id={`contract-tooltip-${token.address}`}
                  />
                  <CustomTooltip id={`contract-tooltip-${token.address}`} className='rounded-md py-2!' place='top'>
                    <TextHeading className='text-xs'>{t('Contract Address')}</TextHeading>
                  </CustomTooltip>
                </div>
              )}
            </div>
            <TextSubHeading>{token.name}</TextSubHeading>
          </div>
        </div>

        <div className='flex items-center justify-center gap-3'>
          <div className={cn('flex flex-col items-end', !account && 'hidden')}>
            <TextHeading>{formatAmount(balance) || ''}</TextHeading>
            {token?.price && balance ? (
              <TextSubHeading>${formatAmount(balance.times(token.price))}</TextSubHeading>
            ) : null}

            {token?.isFromStorage ? (
              <TextSubHeading>{token?.isFromStorage || token?.isCustom ? 'Added by user' : '$0'}</TextSubHeading>
            ) : null}
          </div>

          <span
            onClick={() => {
              setIsWarning('import')
            }}
            className={cn('cursor-pointer rounded-lg bg-neutral-600 p-2', {
              hidden: !token.isCustom,
            })}
          >
            <PlusIcon className={cn('stroke-primary-400 size-5')} />
          </span>

          <span
            onClick={e => {
              e.stopPropagation()
              e.preventDefault()
              setIsWarning('remove')
            }}
            className={cn('cursor-pointer rounded-lg bg-neutral-600 p-2', {
              hidden: !token.isFromStorage,
            })}
          >
            <MinusIcon className={cn('stroke-primary-400 size-5')} />
          </span>
        </div>
      </div>

      <WarningModal
        popup={isWarning === 'import'}
        setPopup={() => setIsWarning('')}
        title={t('BeCareful')}
        desc={t('BeCarefulDescription')}
        buttonTitle={t('Import Anyway')}
        onConfirm={() => handleAddToken(token)}
      />

      <WarningModal
        popup={isWarning === 'remove'}
        setPopup={() => setIsWarning('')}
        title='Are you sure?'
        buttonTitle='Remove'
        onConfirm={() => {
          removeLocalToken(token.address)
          setToken(prev => ({
            ...prev,
            isCustom: true,
            isFromStorage: false,
          }))
        }}
      />
    </>
  )
}
