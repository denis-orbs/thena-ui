import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Input from '@/components/input'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph } from '@/components/typography'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import cn from '@/utils/classes'

import { countries } from './Country'

export default function SelectCountry({ className, selected = '', setSelected }) {
  const t = useTranslations()

  const [open, setOpen] = useState(false)
  const displaySelectedCountry = useMemo(() => {
    const selectedCountry = countries.find(country => country.isoCode === selected)
    return selectedCountry ? selectedCountry?.name : ''
  }, [selected])

  // Modal states
  const [searchText, setSearchText] = useState('')
  const filteredCountries = useMemo(
    () =>
      searchText ? countries.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase())) : countries,
    [searchText],
  )

  return (
    <div className={className}>
      <Input
        classNames={{
          input: cn('cursor-pointer caret-transparent pr-8 leading-5', className),
        }}
        type='text'
        val={displaySelectedCountry}
        onClick={() => setOpen(!open)}
        placeholder='Choose'
        TrailingIcon={<ChevronDownIcon isRevert={open} />}
        readOnly
      />

      {/* Modal Select country */}
      <Modal
        isOpen={open}
        closeModal={() => {
          setOpen(false)
        }}
        width={480}
        title='Select Country'
      >
        <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
          <SearchInput
            className='w-full'
            val={searchText}
            setVal={setSearchText}
            placeholder='Search by Name'
            autoFocus
          />
        </div>
        <div className='h-px w-full border border-neutral-700' />
        <div className='flex flex-col gap-2 p-3'>
          <Paragraph className='px-3'>{t('Countries')}</Paragraph>
          <div className='max-h-[340px] overflow-auto'>
            {filteredCountries.map(item => (
              <div
                className='cursor-pointer rounded-lg px-6 py-3 hover:bg-neutral-800'
                onClick={() => {
                  setSelected(item.isoCode)
                  setOpen(false)
                }}
                key={item.isoCode}
              >
                <p>{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
