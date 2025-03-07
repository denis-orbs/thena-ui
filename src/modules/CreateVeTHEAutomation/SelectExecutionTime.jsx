import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'

import { DateTimePickerCustom } from '@/components/input/DateTimePickerCustom'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { InfoIcon } from '@/svgs'

const week = 86400 * 7 * 1000
const HOUR = 3600 * 1000

function SelectExecutionTime({ executionTime, updateData }) {
  const t = useTranslations()
  return (
    <div className='space-y-6'>
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <TextHeading>{t('Automation Execution Time')}</TextHeading>
          <InfoIcon data-tooltip-id='setting-execution-time' className='h-4 w-4 stroke-neutral-400' />
          <CustomTooltip
            className='z-40 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
            id='setting-execution-time'
            place='bottom'
          >
            {t('Scheduled timestamp for automation execution')}
          </CustomTooltip>
        </div>
        <div className='w-full'>
          <DateTimePickerCustom
            title='Automation Execution Time'
            selectedDate={executionTime}
            onChange={date => {
              const newDate = new Date(date).getTime()
              updateData(newDate)
            }}
            dateFormat='MMM D, YYYY [at] HH:mm [UTC]'
            disablePast={false}
            minDate={Date.now() + HOUR + new Date().getTimezoneOffset() * 60 * 1000}
          />
        </div>
      </div>
      <div className='space-y-3'>
        <TextHeading>{t('Next 5 Scheduled Dates')}</TextHeading>
        <div className='flex flex-col gap-3'>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <Paragraph key={index}>
              {`${item}. ${dayjs((executionTime || 0) + index * week).format('MMM D, YYYY [at] HH:mm [UTC]')}`}
            </Paragraph>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SelectExecutionTime
