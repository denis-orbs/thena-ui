import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatUnits, getAddress, isAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import TokenBadge from '@/components/badges/TokenBadge'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import SearchInput from '@/components/input/SearchInput'
import { SELECT_TOKEN_STYLE, UNKNOWN_LOGO } from '@/constant'
import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { cn } from '@/lib/utils'
import { useLocalTokens } from '@/state/localTokens/store'
import { ChevronDownIcon, WarningTriangleIcon } from '@/svgs'

import { ItemToken } from '../TokenModal/ItemToken'

function SelectToken({
  hiddenTokens = [],
  className,
  classNames,
  listClassNames,
  selectedAsset,
  setSelectedAsset,
  placeHolder,
  otherAsset,
  prefixClass,
  dropdownAlign = 'left',
  optionWidth = null,
  isDisabled = false,
  isError,
  // if it's not an empty array, this will give the option for the user to select from assetOptions
  assetOptions = [],
  errorMessage,
  allowDouble = false,
  style = SELECT_TOKEN_STYLE.LARGE,
}) {
  const { account, chainId } = useWallet()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const assets = useAssets()
  const customAssets = useCustomAssets()

  const [customToken, setCustomToken] = useState()
  const [searchText, setSearchText] = useState('')

  const search = useDebounce(searchText)
  const { localTokens } = useLocalTokens()

  const filteredAssets = useMemo(() => {
    const tokenList = !isEmpty(assetOptions) ? assetOptions : [...localTokens, ...assets, ...customAssets]

    if (!search) {
      return tokenList.filter(asset => !hiddenTokens.includes(asset.address))
    }

    const searchLower = search.toLowerCase()
    const exactMatches = []
    const partialMatches = []

    tokenList.forEach(asset => {
      if (hiddenTokens.includes(asset.address)) return

      const symbol = asset?.symbol?.toLowerCase() || ''
      const address = asset?.address?.toLowerCase() || ''
      if (symbol === searchLower || address === searchLower) {
        exactMatches.push(asset)
      } else if (symbol.includes(searchLower) || address.includes(searchLower)) {
        partialMatches.push(asset)
      }
    })

    const result = [...exactMatches, ...partialMatches]

    if (result.length === 0 && customToken) {
      result.push(customToken)
    }

    return result
  }, [assetOptions, assets, customAssets, customToken, hiddenTokens, localTokens, search])

  const { data: newToken, isSuccess } = useReadContracts({
    contracts: [
      {
        abi: ERC20Abi,
        functionName: 'name',
        address: search,
      },
      {
        abi: ERC20Abi,
        functionName: 'symbol',
        address: search,
      },
      {
        abi: ERC20Abi,
        functionName: 'decimals',
        address: search,
      },
      {
        abi: ERC20Abi,
        functionName: 'balanceOf',
        address: search,
        args: [account],
      },
    ],
    query: {
      enable: isAddress(search) && filteredAssets.length === 0 && chainId,
    },
  })

  useEffect(() => {
    if (isSuccess && newToken) {
      const [name, symbol, decimals, balanceOf] = newToken
      if (name.status !== 'success') return

      if (customToken?.address === getAddress(search)) return
      setCustomToken({
        address: search,
        name: name.result,
        symbol: symbol?.result,
        decimals: Number(decimals?.result ?? 18),
        balance: formatUnits(balanceOf?.result ?? 0, decimals?.result ?? 18),
        isCustom: true,
        chainId: chainId ?? 56,
      })
    }
  }, [isSuccess, newToken, search, customToken?.address, chainId])

  // Start Intersection Observer
  const [visibleItems, setVisibleItems] = useState(20)
  const observerRef = useRef(null)
  const lastItemRef = useRef(null)

  const displayedAssets = useMemo(() => filteredAssets.slice(0, visibleItems), [filteredAssets, visibleItems])

  const loadMore = useCallback(() => {
    setVisibleItems(prev => prev + 20)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0]
        if (target.isIntersecting && visibleItems < filteredAssets.length) {
          loadMore()
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      },
    )

    if (lastItemRef.current) {
      observer.observe(lastItemRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, visibleItems, filteredAssets.length])

  const setLastItemRef = useCallback(element => {
    lastItemRef.current = element
    if (observerRef.current) {
      observerRef.current.disconnect()
      if (element) {
        observerRef.current.observe(element)
      }
    }
  }, [])
  // End Intersection Observer

  return (
    <div>
      <div
        className={cn(
          'relative h-[60px] lg:h-20',
          isError && 'border-error-500 rounded-lg border',
          style === SELECT_TOKEN_STYLE.BADGE && 'h-9 w-fit lg:h-9',
          className,
        )}
        ref={wrapperRef}
      >
        {style === SELECT_TOKEN_STYLE.LARGE && (
          <Input
            className='h-full'
            classNames={{
              input: cn(
                'cursor-pointer caret-transparent h-full placeholder:text-neutral-400',
                'bg-neutral-900 hover:bg-neutral-700 pl-[52px] lg:pl-[80px]',
                'text-sm lg:text-lg leading-5',
                open && 'bg-neutral-700 border-neutral-500',
                isDisabled && 'cursor-not-allowed bg-neutral-900 hover:bg-neutral-900',
                style === SELECT_TOKEN_STYLE.BADGE && 'w-fit lg:text-sm lg:pl-[34px] pl-[34px] py-1.5',
                className,
              ),
              trailingIcon: cn('right-7', style === SELECT_TOKEN_STYLE.BADGE && 'right-2'),
              prefix: style === SELECT_TOKEN_STYLE.BADGE && 'left-1.5',
            }}
            type='text'
            val={selectedAsset?.symbol ?? ''}
            onMouseDown={e => {
              e.preventDefault()
              setOpen(!open)
            }}
            placeholder={placeHolder}
            isLocale={false}
            TrailingIcon={
              !isDisabled && (
                <ChevronDownIcon
                  className={cn(
                    'transform cursor-pointer transition-all duration-150 ease-out',
                    open ? 'rotate-180' : 'rotate-0',
                  )}
                  onMouseDown={e => {
                    e.preventDefault()
                    setOpen(!open)
                  }}
                />
              )
            }
            prefix={
              <CircleImage
                alt='Token'
                className={cn('size-7 lg:size-12', style === SELECT_TOKEN_STYLE.BADGE && 'size-6 lg:size-6')}
                src={selectedAsset?.logoURI ?? UNKNOWN_LOGO}
              />
            }
            prefixClass={prefixClass}
            readOnly
          />
        )}
        {style === SELECT_TOKEN_STYLE.BADGE && (
          <TokenBadge
            className={cn(
              'inline-flex h-full items-center justify-center gap-2',
              'rounded-lg bg-[#29292980] text-xs text-neutral-200 hover:bg-neutral-700 md:text-sm',
              'py-0.5 pr-1.5 pl-1 lg:py-1.5 lg:pr-2 lg:pl-1.5',
              'hover-dont-change-bg cursor-pointer',
            )}
            asset={selectedAsset}
            onClick={() => setOpen(prev => !prev)}
            isDouble={allowDouble}
          />
        )}
        {/* Dropdown */}
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 mt-2 flex-col items-start justify-start gap-1',
            'rounded-xl border border-neutral-900 bg-neutral-900 p-2 shadow-lg',
            'visible top-full opacity-100',
            dropdownAlign === 'right' ? 'right-0 left-auto' : 'right-auto left-0',
            listClassNames,
            !isDisabled && open ? 'visible opacity-100' : 'invisible opacity-0',
          )}
          style={{
            width: optionWidth ? `${optionWidth}px` : '100%',
          }}
        >
          <SearchInput
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              e.target.focus()
            }}
            setVal={setSearchText}
            val={searchText}
            className='mr-2 mb-3 2xl:mr-3'
            classNames={{
              trailingIcon: 'cursor-pointer pointer-events-auto',
            }}
          />
          <div
            className={cn(
              'scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-500 hover:scrollbar-thumb-neutral-400',
              'grid max-h-[400px] gap-3 overflow-y-auto pr-2 sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-4 2xl:pr-3',
              Number(displayedAssets?.length) === 2 && '2xl:grid-cols-2',
              classNames?.dropdown,
            )}
          >
            {displayedAssets?.map((item, index) => (
              <div key={item.address} ref={index === displayedAssets.length - 1 ? setLastItemRef : null}>
                <ItemToken
                  item={item}
                  setPopup={data => setOpen(data)}
                  selectedAsset={selectedAsset}
                  setSelectedAsset={asset => {
                    setSelectedAsset(asset)
                    setOpen(false)
                  }}
                  otherAsset={otherAsset}
                  setOtherAsset={() => {}}
                  className='bg-neutral-800 px-3 py-5 hover:bg-neutral-600'
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {isError && (
        <p className='text-error-500 mt-1 mb-2 flex gap-1'>
          <WarningTriangleIcon className='h-5 w-5' />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  )
}

export default SelectToken
