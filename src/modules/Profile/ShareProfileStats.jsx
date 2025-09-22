import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton, OutlinedButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import Toggle from '@/components/toggle'
import { cn } from '@/lib/utils'

import DownloadButton from './DownloadImage'
import SelectAchievement from './SelectAchievement'

export default function ShareProfileStats({
  className,
  selectedDefault,
  setSelectedDefault,
  toggleAchievement,
  setToggleAchievement,
  achievements,
  selectedAchievements = [],
  onClose = () => null,
  setSelectedAchievement = () => null,
}) {
  const t = useTranslations()
  return (
    <div
      className={cn(
        'max-h-[576px] rounded-xl bg-neutral-900 px-4 py-6 lg:min-w-[270px] 2xl:w-[396px] 2xl:px-6',
        className,
      )}
    >
      <p className='font-archia mb-4 text-[24px] font-semibold'>{t('Share Profile Stats')}</p>
      <div className='mb-6 border-b border-b-neutral-700'>
        <p className='mb-3 text-[16px] text-neutral-50'>{t('Show')}</p>
        <ul className='list-none gap-5'>
          <li className='mb-5'>
            <CheckBox checked={selectedDefault.rank} setChecked={setSelectedDefault('rank')} />
            <span className='ml-2 2xl:ml-3'>{t('Rank')}</span>
          </li>
          <li className='mb-5'>
            <CheckBox checked={selectedDefault.numberOfTCsWon} setChecked={setSelectedDefault('numberOfTCsWon')} />
            <span className='ml-2 2xl:ml-3'>{t('Number of TCs Won')}</span>
          </li>
          <li className='mb-5'>
            <CheckBox checked={selectedDefault.totalVolumeInTCs} setChecked={setSelectedDefault('totalVolumeInTCs')} />
            <span className='ml-2 2xl:ml-3'>{t('Total Volume in TCs')}</span>
          </li>
          <li className='mb-5'>
            <CheckBox
              checked={selectedDefault.completedAchievements}
              setChecked={setSelectedDefault('completedAchievements')}
            />
            <span className='ml-2 2xl:ml-3'>{t('Completed Achievements1')}</span>
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
          <div className='flex flex-row items-center justify-between'>
            <label className='lg:text[16px] text-[14px]'>{t('Select Achievements')}</label>
            <OutlinedButton
              type='button'
              className='lg:text[16px] border-none text-[14px] text-neutral-300'
              onClick={() => setSelectedAchievement([])}
            >
              {t('Clear All')}
            </OutlinedButton>
          </div>

          <SelectAchievement
            data={achievements}
            className='mb-5'
            valueSelected={selectedAchievements}
            onSelected={setSelectedAchievement}
          />
        </div>
        <div className='flex w-full flex-col gap-2'>
          <DownloadButton fileName='profile' />
          <EmphasisButton onClick={onClose}>Cancel</EmphasisButton>
        </div>
      </div>
    </div>
  )
}
