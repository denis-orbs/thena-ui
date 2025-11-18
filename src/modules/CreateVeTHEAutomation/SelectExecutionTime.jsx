import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import DateInput from '@/components/input/DateInput'
import { Paragraph, TextHeading } from '@/components/typography'
import InfoIcon from '@/icons/InfoIcon'
import cn from '@/utils/classes'

const week = 86400 * 7 * 1000
const HOUR = 3600 * 1000

function TimeSchedule({ executionTime, className }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {[1, 2, 3].map((item, index) => (
        <React.Fragment key={index}>
          {index < 3 && (
            <Paragraph key={index}>
              {`${item}. ${dayjs((executionTime || 0) + index * week).format('MMM D, YYYY [at] HH:mm [UTC]')}`}
            </Paragraph>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function SelectExecutionTime({ executionTime, updateData }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)
  return (
    <div className='flex flex-col gap-4 lg:gap-6'>
      <div>
        <div className='flex flex-col gap-2'>
          <TextHeading>{t('Automation Execution Time')}</TextHeading>
          <Paragraph>{t('Scheduled timestamp for automation execution1')}</Paragraph>
          <Paragraph>
            {t('Scheduled timestamp for automation execution2')}
            <span className='font-bold'>{t('Scheduled timestamp for automation execution3')}</span>
          </Paragraph>
        </div>
        <div className='mt-2 w-full lg:mt-3'>
          <DateInput
            selectedDate={executionTime ? dayjs(executionTime).toDate() : undefined}
            minDate={Date.now() + HOUR + new Date().getTimezoneOffset() * 60 * 1000}
            disablePast={false}
            dateFormat="MMM d, yyyy 'at' HH:mm 'UTC'"
            showTimeSelect
            timeFormat='HH:mm'
            timeIntervals={5}
            calendarStartDay={1}
            onChange={date => {
              const newDate = new Date(date).getTime()
              updateData(newDate)
            }}
          />
        </div>
      </div>
      <div className='mt-2 lg:mt-3'>
        <div className='mt-2 flex items-center justify-between gap-2 lg:mt-3'>
          <div className='max-lg:w-[calc(100% - 40px)] w-full max-lg:rounded-lg max-lg:bg-neutral-900 max-lg:px-4 max-lg:py-1.5'>
            <TextHeading className='text-xs lg:text-base'>
              {t('Next [number] Scheduled Dates', { number: 3 })}
            </TextHeading>
          </div>

          <div className='flex items-center lg:hidden'>
            <i
              onClick={() => setShow(!show)}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-lg',
                'size-8 min-w-8',
                show ? 'bg-neutral-600' : 'bg-neutral-900',
              )}
            >
              <InfoIcon />
            </i>
          </div>
        </div>
        <div className='hidden lg:mt-3 lg:block'>
          <TimeSchedule executionTime={executionTime} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='overflow-hidden'
        >
          <TimeSchedule
            executionTime={executionTime}
            className={cn('gap-2 rounded-lg bg-neutral-900 p-4', show && 'mt-2')}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default SelectExecutionTime
