import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { DateTimePickerCustom } from '@/components/input/DateTimePickerCustom'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'
import { InfoIcon } from '@/svgs'

const SETTINGS_TYPE = {
  CLAIM: 'claim',
  RELOCK: 'relock',
  EXECUTION_TIME: 'execution',
}

const week = 86400 * 7 * 1000

function Step1Settings() {
  const t = useTranslations()

  const { createData } = useSelector(state => state.veTHEAutomationContract)
  const dispatch = useDispatch()
  const updateSetting = useCallback(
    (type, value) => {
      const currentSettings = createData?.settings || {}
      const updatedSettings = (() => {
        switch (type) {
          case SETTINGS_TYPE.CLAIM:
            return {
              ...currentSettings,
              isClaimEveryWeek: !currentSettings.isClaimEveryWeek,
            }
          case SETTINGS_TYPE.RELOCK:
            return {
              ...currentSettings,
              isRelockEveryWeek: !currentSettings.isRelockEveryWeek,
            }
          case SETTINGS_TYPE.EXECUTION_TIME: {
            return {
              ...currentSettings,
              executionTime: value,
            }
          }
          default:
            return currentSettings
        }
      })()

      if (JSON.stringify(currentSettings) !== JSON.stringify(updatedSettings)) {
        dispatch(
          createVeTHEAutomationContract({
            createData: {
              ...createData,
              settings: updatedSettings,
            },
          }),
        )
      }
    },
    [createData, dispatch],
  )

  const getIsoString = useCallback(timestamp => {
    const curTimeStamp = new Date().getTime()
    const finalTS = timestamp || curTimeStamp
    const finalDate = new Date(finalTS)
    return finalDate
  }, [])

  return (
    <div className='space-y-6'>
      <div className='flex flex-row items-center gap-1'>
        <Toggle
          checked={createData?.settings?.isClaimEveryWeek}
          onChange={() => updateSetting(SETTINGS_TYPE.CLAIM)}
          label='Claim rebase rewards every week'
        />
        <InfoIcon data-tooltip-id='setting-claim-rebase' className='h-4 w-4 stroke-neutral-400' />
        <CustomTooltip
          className='z-40 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
          id='setting-claim-rebase'
          place='bottom'
        >
          {t('Automatically claim your rebase rewards every week')}
        </CustomTooltip>
      </div>
      <div className='flex items-center gap-1'>
        <Toggle
          checked={createData?.settings?.isRelockEveryWeek}
          onChange={() => updateSetting(SETTINGS_TYPE.RELOCK)}
          label='Relock veTHE every 1 Week'
        />
        <InfoIcon data-tooltip-id='settings-relock' className='h-4 w-4 stroke-neutral-400' />
        <CustomTooltip
          className='z-40 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
          id='settings-relock'
          place='bottom'
        >
          {t('Automatically increase your veTHE lock timestamp by one week every week')}
        </CustomTooltip>
      </div>
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <TextHeading>{t('Contract Execution Time')}</TextHeading>
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
            title='Contract Execution Time'
            selectedDate={new Date(createData?.settings?.executionTime || Date.now())}
            onChange={date => {
              const newDate = new Date(date).getTime()
              updateSetting(SETTINGS_TYPE.EXECUTION_TIME, newDate)
            }}
            minDate={getIsoString()}
            showTimeSelect
            dateFormat='MMM D, YYYY [at] HH:mm [UTC]'
          />
        </div>
      </div>
      <div className='space-y-3'>
        <TextHeading>{t('Next 5 Scheduled Dates')}</TextHeading>
        <div className='flex flex-col gap-3'>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <Paragraph key={index}>
              {`${item}. ${dayjs((createData?.settings?.executionTime || 0) + index * week).format(
                'MMM D, YYYY [at] HH:mm [UTC]',
              )}`}
            </Paragraph>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Step1Settings
