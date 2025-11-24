import { useTranslations } from 'next-intl'
import React, { useEffect, useRef } from 'react'

import { Paragraph, TextHeading } from '@/components/typography'
import cn from '@/utils/classes'

export default function Navigation({ isOpen, setIsOpen }) {
  const t = useTranslations()
  const drawerRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = event => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])
  return (
    <div
      ref={drawerRef}
      id='drawer-navigation'
      className={cn(
        'fixed top-0 right-0 z-50 h-screen w-64 transform bg-neutral-900 p-4 transition-transform duration-700 ease-in-out lg:w-[800px]',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
      tabIndex={-1}
      aria-labelledby='drawer-navigation-label'
    >
      <button
        onClick={() => setIsOpen(false)}
        type='button'
        data-drawer-hide='drawer-navigation'
        aria-controls='drawer-navigation'
        className='absolute end-2.5 top-2.5 inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm'
      >
        <svg
          aria-hidden='true'
          className='h-5 w-5'
          fill='currentColor'
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
        <span className='sr-only'>Close menu</span>
      </button>
      <div className='flex flex-col gap-6 py-4'>
        <div className='flex flex-col gap-2'>
          <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Liquidity Pools')}</TextHeading>
          <Paragraph className='text-[16px] lg:text-[18px]'>{t('Conc Desc')}</Paragraph>
        </div>
        <div className='flex flex-col gap-2'>
          <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Concentrated Liquidity Pools')}</TextHeading>
          <Paragraph className='text-[16px] lg:text-[18px]'>{t('Conc Desc')}</Paragraph>
        </div>
        <div className='flex flex-col gap-2'>
          <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Classic Pools')}</TextHeading>
          <Paragraph className='text-[16px] lg:text-[18px]'>{t('Classic Desc')}</Paragraph>
        </div>
        <div className='flex flex-col gap-2'>
          <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Stable Pools')}</TextHeading>
          <Paragraph className='text-[16px] lg:text-[18px]'>{t('Stable Desc')}</Paragraph>
        </div>
      </div>
    </div>
  )
}
