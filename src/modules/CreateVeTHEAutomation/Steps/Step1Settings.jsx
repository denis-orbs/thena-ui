import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'
import { InfoIcon } from '@/svgs'

import SelectExecutionTime from '../SelectExecutionTime'

const SETTINGS_TYPE = {
  CLAIM: 'claim',
  RELOCK: 'relock',
  EXECUTION_TIME: 'execution',
}

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
      <SelectExecutionTime
        data={createData?.settings?.executionTime}
        updateData={date => updateSetting(SETTINGS_TYPE.EXECUTION_TIME, date)}
      />
    </div>
  )
}

export default Step1Settings
