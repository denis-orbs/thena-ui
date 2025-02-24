import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatUnits, getAddress, isAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import SearchInput from '@/components/input/SearchInput'
import { UNKNOWN_LOGO } from '@/constant'
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
  errorMessage,
}) {
  const { account, chainId } = useWallet()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const dropdownRef = useRef(null)
  const rootRef = useRef(null)

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
    const tokenList = [...localTokens, ...assets, ...customAssets]

    const result = search
      ? tokenList.filter(
          asset =>
            !hiddenTokens.includes(asset.address) &&
            (asset?.symbol?.toLowerCase().includes(search.toLowerCase()) ||
              asset?.address?.toLowerCase().includes(search.toLowerCase())),
        )
      : tokenList.filter(asset => !hiddenTokens.includes(asset.address))

    if (result.length === 0 && customToken) {
      result.push(customToken)
    }

    return result
  }, [assets, customAssets, customToken, hiddenTokens, localTokens, search])

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
        className={cn('relative h-14 lg:h-20', isError && 'rounded-lg border border-error-500', className)}
        ref={wrapperRef}
      >
        <Input
          className='h-full'
          classNames={{
            input: cn(
              'cursor-pointer caret-transparent h-full placeholder:text-neutral-400',
              'bg-neutral-800 hover:bg-neutral-600 pl-14 lg:pl-[72px]',
              open && 'bg-neutral-700',
              isDisabled && 'cursor-not-allowed',
              className,
            ),
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
            <CircleImage alt='Token' className='size-8 lg:size-12' src={selectedAsset?.logoURI ?? UNKNOWN_LOGO} />
          }
          prefixClass={prefixClass}
          readOnly
        />
        {/* Dropdown */}
        {!isDisabled && open && (
          <div
            ref={dropdownRef}
            className={cn(
              'absolute z-50 mt-2 flex-col items-start justify-start gap-1',
              'rounded-xl border border-neutral-600 bg-neutral-800 p-2 shadow-lg',
              'visible top-full opacity-100',
              dropdownAlign === 'right' ? 'left-auto right-0' : 'left-0 right-auto',
              listClassNames,
            )}
            style={{
              width: optionWidth ? `${optionWidth}px` : '100%',
            }}
          >
            <SearchInput setVal={setSearchText} val={searchText} className='mb-3 mr-2 2xl:mr-3' />
            <div
              className='grid max-h-[400px] gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-500 hover:scrollbar-thumb-neutral-400 sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-4 2xl:pr-3'
              ref={rootRef}
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
                    className='min-w-40 flex-1 rounded-lg border border-neutral-700 bg-neutral-700 px-3 py-5'
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {isError && (
        <p className='mb-2 mt-1 flex gap-1 text-error-500'>
          <WarningTriangleIcon className='h-5 w-5' />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  )
}

export default SelectToken
