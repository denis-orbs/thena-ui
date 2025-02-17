import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import InfiniteScroll from 'react-infinite-scroll-component'
import { formatUnits, getAddress, isAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import SearchInput from '@/components/input/SearchInput'
import RenderIfVisible from '@/components/virtualList'
import { UNKNOWN_LOGO } from '@/constant'
import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { cn } from '@/lib/utils'
import { useLocalTokens } from '@/state/localTokens/store'
import { ChevronDownIcon } from '@/svgs'

import { ItemToken } from '../TokenModal/ItemToken'

function SelectToken({
  hiddenTokens = [],
  className,
  listClassNames,
  selectedAsset,
  setSelectedAsset,
  placeHolder,
  isLocale = true,
  otherAsset,
  prefixClass,
  dropdownAlign = 'left',
  optionWidth = null,
}) {
  const { account, chainId } = useWallet()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
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

  useEffect(() => {
    function updatePosition() {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }

    if (open) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

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
            (asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
              asset.address.toLowerCase().includes(search.toLowerCase())),
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

  return (
    <div className={cn('relative h-14 2xl:h-[88px]', className)} ref={wrapperRef}>
      <Input
        className='h-full'
        classNames={{
          input: cn('cursor-pointer caret-transparent h-full pl-12 2xl:pl-[75px]', className),
        }}
        type='text'
        val={selectedAsset?.symbol || placeHolder}
        onMouseDown={e => {
          e.preventDefault()
          setOpen(!open)
        }}
        placeholder={placeHolder}
        TrailingIcon={
          <ChevronDownIcon
            className={cn('transform transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
            onMouseDown={e => {
              e.preventDefault()
              setOpen(!open)
            }}
          />
        }
        isLocale={isLocale}
        prefix={
          <div className='flex gap-[6px]'>
            <CircleImage alt='Token' className='size-8 2xl:size-12' src={selectedAsset?.logoURI ?? UNKNOWN_LOGO} />
          </div>
        }
        prefixClass={prefixClass}
        readOnly
      />
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              'mt-2 max-h-[872px]',
              'absolute flex-col items-start justify-start gap-1',
              'rounded-xl border border-neutral-600 bg-neutral-800 p-2 shadow-lg',
              'visible opacity-100',
              listClassNames,
            )}
            style={{
              position: 'absolute',
              top: position.top,
              left: dropdownAlign === 'right' ? 'auto' : position.left,
              right: dropdownAlign === 'right' ? window.innerWidth - (position.left + position.width) : 'auto',
              width:
                /w-\d+/.test(listClassNames) || listClassNames?.includes('w-full') || listClassNames?.includes('w-[')
                  ? undefined
                  : `${optionWidth || position.width}px`,
            }}
          >
            <SearchInput setVal={setSearchText} val={searchText} className='mr-3' />
            <div className='mt-4·max-h-[700px]·overflow-y-auto·scrollbar-thin·scrollbar-track-neutral-800·scrollbar-thumb-neutral-500·hover:scrollbar-thumb-neutral-400'>
              <InfiniteScroll dataLength={filteredAssets.length}>
                <div className='grid gap-3 md:grid-cols-2 2xl:grid-cols-3'>
                  {filteredAssets?.map(item => (
                    <RenderIfVisible key={item.address} root={rootRef.current}>
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
                    </RenderIfVisible>
                  ))}
                </div>
              </InfiniteScroll>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default SelectToken
