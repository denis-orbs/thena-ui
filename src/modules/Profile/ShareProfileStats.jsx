import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import Toggle from '@/components/toggle'
import { cn } from '@/lib/utils'
import { DownloadIcon } from '@/svgs'

import SelectAchievement from './SelectAchievement'

export default function ShareProfileStats({
  className,
  selectedDefault,
  setSelectedDefault,
  toggleAchievement,
  setToggleAchievement,
  achievements,
  selectedAchievements = [],
  ref,
  onClose = () => null,
  setSelectedAchievement = () => null,
}) {
  const t = useTranslations()
  return (
    <Box ref={ref} className={cn('', className)}>
      <p className='mb-4 font-archia text-[24px] font-semibold'>{t('Share Profile Stats')}</p>
      <div className='mb-6 border-b border-b-neutral-700'>
        <p className='mb-3 text-[16px] text-neutral-50'>{t('Show')}</p>
        <ul className='list-none gap-5'>
          <li className='mb-5'>
            <CheckBox checked={selectedDefault.rank} setChecked={setSelectedDefault('rank')} />{' '}
            <span className='ml-3'>{t('Rank')}</span>
          </li>
          <li className='mb-5'>
            <CheckBox checked={selectedDefault.numberOfTCsWon} setChecked={setSelectedDefault('numberOfTCsWon')} />
            <span className='ml-3'>{t('Number of TCs Won')}</span>
          </li>
          <li className='mb-5'>
            <CheckBox checked={selectedDefault.totalVolumeInTCs} setChecked={setSelectedDefault('totalVolumeInTCs')} />
            <span className='ml-3'>{t('Total Volume in TCs')}</span>
          </li>
          <li className='mb-5'>
            <CheckBox
              checked={selectedDefault.completedAchievements}
              setChecked={setSelectedDefault('completedAchievements')}
            />
            <span className='ml-3'>{t('Completed Achievements')}</span>
          </li>
        </ul>
      </div>
      <div className='flex flex-col'>
        <div className='mb-6 flex flex-row'>
          <Toggle
            onChange={() => {
              setToggleAchievement(prev => !prev)
            }}
            checked={toggleAchievement}
            label='Show Achievements'
          />
        </div>
        <div className={!toggleAchievement ? 'hidden' : 'block'}>
          <div className='flex flex-row justify-between'>
            <label htmlFor='countries' className='mb-2 block text-[17px]'>
              {t('Select Achievements')}
            </label>
            <OutlinedButton
              type='button'
              className='border-none text-[17px] text-neutral-300'
              onClick={() => setSelectedAchievement([])}
            >
              {t('Clear all')}
            </OutlinedButton>
          </div>
          <SelectAchievement
            data={achievements}
            className='mb-5'
            valueSelected={selectedAchievements}
            onSelected={setSelectedAchievement}
          />
        </div>
        <PrimaryButton className='mb-3 mt-5'>
          <DownloadIcon className='mr-2 h-4 w-4' />
          {t('Download image')}
        </PrimaryButton>
        <EmphasisButton onClick={onClose}>Cancel</EmphasisButton>
      </div>
    </Box>
  )
}
