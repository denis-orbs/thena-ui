import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatAmount } from '@/utils/utils'

function PairModal({ popup, setPopup, setSelected, pools, field = 'apr', selected }) {
  const [searchText, setSearchText] = useState('')
  const t = useTranslations()

  const { isMdDown } = useMediaQuery()

  const filteredPools = useMemo(() => {
    if (!searchText) return pools
    const searchTerms = searchText
      .toLowerCase()
      .split(/[\s/,]+/)
      .map(term => term.trim())

    return pools.filter(pool => {
      const poolSymbols = pool.symbol.toLowerCase().split('/')

      if (searchTerms.length === 2) {
        return (
          (poolSymbols[0].includes(searchTerms[0]) && poolSymbols[1].includes(searchTerms[1])) ||
          (poolSymbols[0].includes(searchTerms[1]) && poolSymbols[1].includes(searchTerms[0]))
        )
      }

      // If we have one search term, check if it matches either token
      return (
        pool.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
        pool.address.toLowerCase().includes(searchText.toLowerCase())
      )
    })
  }, [pools, searchText])

  // Start Intersection Observer
  const [visibleItems, setVisibleItems] = useState(20)
  const observerRef = useRef(null)
  const lastItemRef = useRef(null)

  const displayedPools = useMemo(() => filteredPools.slice(0, visibleItems), [filteredPools, visibleItems])

  const loadMore = useCallback(() => {
    setVisibleItems(prev => prev + 20)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0]
        if (target.isIntersecting && visibleItems < filteredPools.length) {
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
  }, [loadMore, visibleItems, filteredPools.length])

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

  useEffect(() => {
    if (!popup) {
      setVisibleItems(20)
      setLastItemRef()
    }
  }, [popup, setLastItemRef])

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={isMdDown ? '90%' : 540}
      title='Select Pair'
    >
      {popup && (
        <>
          <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
            <SearchInput className='w-full' val={searchText} setVal={setSearchText} autoFocus />
            {!!selected && (
              <div className='hidden flex-col gap-2 px-3 xl:flex'>
                <Paragraph>{t('Selected Pair')}</Paragraph>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <GroupIconTokens
                      classNames={{
                        image: 'outline-2 w-7 h-7',
                        rows: '*:not-first:-ml-2',
                        toolTip: 'hidden',
                      }}
                      width={32}
                      height={32}
                      tokens={[selected.token0, selected.token1]}
                      showToolTip={false}
                    />
                    <TextHeading>{selected.symbol}</TextHeading>
                  </div>

                  <span
                    className='text-primary-400 cursor-pointer'
                    onClick={() => {
                      setSelected(null)
                      setPopup(false)
                    }}
                  >
                    {t('Clear Selected')}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className='h-px w-full border border-neutral-700' />
          <div className='flex flex-col gap-2 p-3'>
            <div className='flex items-center justify-between px-6'>
              <Paragraph className='px-3'>{t('Pairs')}</Paragraph>
              {field === 'apr' && <Paragraph className='px-3'>{t('APR')}</Paragraph>}
              {field === 'incentives' && <Paragraph className='px-3'>{t('Voting Incentives')}</Paragraph>}
            </div>
            <div className='max-h-[340px] overflow-auto'>
              {(displayedPools || []).map((pool, index) => (
                <div
                  className='flex cursor-pointer items-center justify-between rounded-lg px-6 py-3 hover:bg-neutral-800'
                  onClick={() => {
                    setSelected(pool)
                    setPopup(false)
                  }}
                  key={pool.address}
                  ref={index === displayedPools.length - 1 ? setLastItemRef : null}
                >
                  <div className='flex items-center gap-3'>
                    <GroupIconTokens
                      classNames={{
                        image: 'outline-2 w-7 h-7',
                        rows: '*:not-first:-ml-2',
                        toolTip: 'hidden',
                      }}
                      width={32}
                      height={32}
                      tokens={[pool.token0, pool.token1]}
                      showToolTip={false}
                    />
                    <div className='flex flex-col'>
                      <TextHeading>{pool.symbol}</TextHeading>
                      <Paragraph className='text-sm'>
                        {pool.title === 'CL_Farming' ? 'Conc. Liquidity' : pool.title ?? pool.type}
                      </Paragraph>
                    </div>
                  </div>
                  {field === 'apr' && pool.apr && (
                    <Paragraph className='text-sm! leading-5 font-normal text-neutral-500'>{pool.apr}</Paragraph>
                  )}
                  {field === 'incentives' && pool?.gauge && (
                    <Paragraph className='text-sm! leading-5 font-normal text-neutral-500'>
                      ${formatAmount(pool?.gauge?.bribeUsd)}
                    </Paragraph>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

export default PairModal
