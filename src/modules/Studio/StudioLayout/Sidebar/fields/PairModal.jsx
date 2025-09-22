import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'

function PairModal({ popup, setPopup, setSelected, pools, field = 'apr' }) {
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

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={isMdDown ? '90%' : 540}
      title='Select Pair'
    >
      <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
        <SearchInput className='w-full' val={searchText} setVal={setSearchText} autoFocus />
      </div>
      <div className='h-px w-full border border-neutral-700' />
      <div className='flex flex-col gap-2 p-3'>
        <div className='flex items-center justify-between px-6'>
          <Paragraph className='px-3'>{t('Pairs')}</Paragraph>
          {field === 'apr' && <Paragraph className='px-3'>{t('APR')}</Paragraph>}
          {field === 'incentives' && <Paragraph className='px-3'>{t('Vote Incentive')}</Paragraph>}
        </div>
        <div className='max-h-[340px] overflow-auto'>
          {filteredPools.map(pool => (
            <div
              className='flex cursor-pointer items-center justify-between rounded-lg px-6 py-3 hover:bg-neutral-800'
              onClick={() => {
                setSelected(pool)
                setPopup(false)
              }}
              key={pool.address}
            >
              <div className='flex items-center gap-3'>
                {pool.type === PAIR_TYPES.WEIGHTED ? (
                  <ListTokenPercantage listToken={pool.tokens} poolAddress={pool?.address} />
                ) : (
                  <>
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
                  </>
                )}
              </div>
              {field === 'apr' && (
                <Paragraph className='text-sm! leading-5 font-normal text-neutral-500'>{pool.apr}</Paragraph>
              )}
              {field === 'incentives' && (
                <Paragraph className='text-sm! leading-5 font-normal text-neutral-500'>
                  ${formatAmount(pool.gauge.bribeUsd)}
                </Paragraph>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default PairModal
