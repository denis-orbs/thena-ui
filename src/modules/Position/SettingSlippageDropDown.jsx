import { motion } from 'framer-motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'use-intl'

import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import { cn } from '@/lib/utils'
import { SettingsIcon } from '@/svgs'

const slippageTolerance = [0.1, 0.5, 1]
function SettingSlippageDropDown({ slippage, updateSlippage, className }) {
  const [show, setShow] = useState(false)
  const dropdownRef = useRef(null)
  const t = useTranslations()

  const selections = useMemo(
    () =>
      slippageTolerance.map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          updateSlippage(Number(ele))
        },
      })),
    [slippage, updateSlippage],
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false)
      }
    }

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [show])

  return (
    <div className={cn('flex items-center justify-end', className)}>
      <div className='mb-4 flex flex-col gap-3' ref={dropdownRef}>
        <p className='flex items-center justify-end gap-2'>
          <Paragraph className='font-medium'>{t('Slippage Tolerance')}</Paragraph>
          <SettingsIcon
            className='h-6 w-6 cursor-pointer'
            onClick={() => {
              setShow(prev => !prev)
            }}
          />
        </p>
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='overflow-hidden'
        >
          <div className='right-0 top-full z-10 flex w-fit gap-3 rounded-lg p-2 shadow-lg'>
            <Selection data={selections} className='bg-transparent' />
            <Input
              classNames={{
                input: 'w-[110px]',
              }}
              val={slippage}
              onChange={e => updateSlippage(Number(e.target.value) || 0)}
              suffix='%'
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SettingSlippageDropDown
