import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Dropdown from '@/components/dropdown'
import { TextHeading, TextSubHeading } from '@/components/typography'

export function SelectUserName({ dataUpdate, setDataUpdate, userInfo }) {
  const t = useTranslations()

  const userNameData = useMemo(
    () =>
      userInfo?.usernameNfts.map(userName => ({
        value: userName.id,
        label: userName.name,
      })) ?? [],
    [userInfo?.usernameNfts],
  )

  return (
    <div className='flex flex-col gap-6 lg:flex-row'>
      <div className='flex flex-1 flex-col gap-3'>
        <TextHeading className='text-xl'>{t('Username')}</TextHeading>
        <TextSubHeading className='text-base'>{t('Select Your Username')}</TextSubHeading>
      </div>
      <div className='flex-2'>
        <Dropdown
          className='w-full lg:w-72'
          listClassNames='max-h-64 overflow-y-auto w-full'
          data={userNameData}
          selected={dataUpdate.username}
          setSelected={e => {
            setDataUpdate({
              ...dataUpdate,
              username: e.label,
            })
          }}
          isLocale={false}
        />
      </div>
    </div>
  )
}
