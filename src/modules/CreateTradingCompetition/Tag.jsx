import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'

import { fetchGetTCTag } from '.'

const TAG_TYPE = { OFFICIAL: 'OFFICIAL', COMMUNITY: 'COMMUNITY' }

function Tag({ data, setData }) {
  const t = useTranslations()

  const { data: tcTags, isLoading: isLoadingTcTags } = useSWR(['fetTcTags'], () => fetchGetTCTag(), 30000)

  useEffect(() => {
    if (!isLoadingTcTags) {
      setData(prev => ({
        ...prev,
        tag: tcTags.find(item => item.id === 'a9fec3f1-5ce0-4780-9051-befc2ab518de'),
      }))
    }
  }, [isLoadingTcTags, setData, tcTags])

  const selectedTag = useMemo(() => data.tag, [data.tag])

  const handleSelectTag = tag => {
    setData(prev => ({
      ...prev,
      tag,
    }))
  }

  if (isLoadingTcTags) return <Loading />

  return (
    <div>
      <div className='flex items-center justify-between'>
        <TextHeading>{t('Labels')}</TextHeading>
      </div>
      <div className='mb-5 flex flex-col'>
        <TextSubHeading className='text-neutral-50'>{t('Choose Label')}</TextSubHeading>
        <TextSubHeading className='text-neutral-300'>{t('You can only choose one label')}</TextSubHeading>
      </div>
      <div className='flex flex-wrap gap-3'>
        {tcTags?.map(item => (
          <div key={item?.id}>
            <div className='mb-4 flex items-center'>
              <input
                id={item?.id}
                type='radio'
                name={item?.id}
                checked={selectedTag?.id === item?.id}
                onChange={() => {
                  handleSelectTag(item)
                }}
              />
              <label htmlFor={item?.id} className='ms-2 text-sm font-medium'>
                {item?.name}
              </label>
            </div>
          </div>
        ))}
      </div>
      {selectedTag && (
        <div className='mt-3 border-y border-neutral-700 py-3'>
          <div className='flex items-center gap-6'>
            {selectedTag.type !== TAG_TYPE.OFFICIAL ? (
              <EmphasisButton className='max-h-6 rounded-full bg-neutral-600 px-2 py-[2px] text-center text-xs'>
                {selectedTag?.name}
              </EmphasisButton>
            ) : (
              <PrimaryButton className='max-h-6 rounded-full px-2 py-[2px] text-center text-xs'>
                {selectedTag?.name}
              </PrimaryButton>
            )}
            <TextSubHeading className='w-[60%]'>{selectedTag?.description}</TextSubHeading>
          </div>
        </div>
      )}
      <div />
    </div>
  )
}

export default Tag
