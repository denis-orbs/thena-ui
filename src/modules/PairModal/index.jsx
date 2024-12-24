import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'

function PairModal({ popup, setPopup, setSelected, pools }) {
  const [searchText, setSearchText] = useState('')
  const t = useTranslations()

  const filteredPools = useMemo(
    () =>
      searchText
        ? pools.filter(
            pool =>
              pool.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
              pool.address.toLowerCase().includes(searchText.toLowerCase()),
          )
        : pools,
    [pools, searchText],
  )

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Select Pair'
    >
      <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
        <SearchInput className='w-full' val={searchText} setVal={setSearchText} autoFocus />
      </div>
      <div className='h-px w-full border border-neutral-700' />
      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='px-3'>{t('Pairs')}</Paragraph>
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
                  <ThreeIconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                    }}
                    logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                    logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                    extendNumber={(pool?.tokens?.length || 2) - 2}
                  />
                ) : (
                  <IconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'outline-2 w-8 h-8',
                    }}
                    logo1={pool.token0.logoURI}
                    logo2={pool.token1.logoURI}
                  />
                )}

                <div className='flex flex-col'>
                  <TextHeading>{pool.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{t(pool.title ?? pool.type)}</Paragraph>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default PairModal
