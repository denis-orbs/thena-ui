import { motion } from 'framer-motion'
import React, { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'use-intl'

import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import { cn } from '@/lib/utils'
import { SettingsIcon } from '@/svgs'

const defaultSlippageOptions = [0.1, 0.5, 1]

function SettingSlippageDropDown({ slippage, updateSlippage, className }) {
  const [show, setShow] = useState(false)
  const dropdownRef = useRef(null)
  const t = useTranslations()

  const selections = useMemo(
    () =>
      defaultSlippageOptions.map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          updateSlippage(Number(ele))
        },
      })),
    [slippage, updateSlippage],
  )

  return (
    <div className={cn('mb-4 flex items-center justify-end', className)}>
      <div className={cn('flex flex-col', show && 'gap-3')} ref={dropdownRef}>
        <div className='flex justify-end'>
          <div
            className='flex cursor-pointer items-center justify-end gap-2'
            onClick={() => {
              setShow(prev => !prev)
            }}
          >
            <Paragraph className='font-medium text-neutral-400'>{t('Slippage')}</Paragraph>
            <SettingsIcon className='h-6 w-6 cursor-pointer' />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='overflow-hidden'
        >
          <div className='right-0 top-full z-10 flex w-fit gap-3 rounded-lg'>
            <Selection data={selections} className='bg-transparent !text-neutral-200' />
            <Input
              classNames={{
                input: 'w-20',
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
