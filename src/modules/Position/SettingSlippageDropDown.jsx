import { motion } from 'framer-motion'
import React, { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'use-intl'

import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph } from '@/components/typography'
import { cn } from '@/lib/utils'
import { SettingPrimaryIcon, SettingsIcon } from '@/svgs'

const defaultSlippageOptions = [0.1, 0.5, 1]
function SettingSlippageDropDown({ slippage, updateSlippage, className, position = 'start' }) {
  const [show, setShow] = useState(false)
  const dropdownRef = useRef(null)
  const t = useTranslations()
  const [isHovered, setIsHovered] = useState(false)

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
    <div className={cn('mb-4 flex items-center justify-start', className, position === 'end' && 'justify-end')}>
      <div className={cn('flex flex-col')} ref={dropdownRef}>
        <div className={cn('flex justify-start', position === 'end' && 'justify-end')}>
          <div
            className={cn('flex cursor-pointer items-center justify-start gap-2', position === 'end' && 'justify-end')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setShow(prev => !prev)}
          >
            <Paragraph
              className={cn(
                'text-base font-medium text-neutral-400 hover:text-primary-600 hover:underline',
                isHovered && 'text-primary-600 underline',
              )}
            >
              {t('Slippage')}
            </Paragraph>

            {!isHovered ? <SettingsIcon className='size-5' /> : <SettingPrimaryIcon className='size-5' />}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='overflow-hidden'
        >
          <div className='z-10 mt-3 flex w-fit gap-3 rounded-lg'>
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
