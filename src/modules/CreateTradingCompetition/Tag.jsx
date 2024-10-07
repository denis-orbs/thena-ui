import { useEffect, useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import LabelTooltip from '@/components/label/LabelTooltip'
import { TextSubHeading } from '@/components/typography'

import { fetchGetTCTag } from '.'

const TAG_TYPE = { OFFICIAL: 'OFFICIAL', COMMUNITY: 'COMMUNITY' }

export function TagItem({ tag, onSelect, tagSelected }) {
  return (
    <>
      <button
        // eslint-disable-next-line max-len
        className={`relative items-center rounded-lg py-[8.4px] pl-6 pr-8 uppercase text-white disabled:cursor-not-allowed ${
          tagSelected?.id === tag?.id ? 'bg-primary-600' : 'bg-neutral-700'
        }`}
        type='button'
        onClick={() => onSelect(tag)}
      >
        {tag.name}
      </button>
    </>
  )
}

function Tag({ data, setData }) {
  const { data: tcTags, isLoading: isLoadingTcTags } = useSWR(['fetTcTags'], () => fetchGetTCTag(), 30000)

  useEffect(() => {
    if (!isLoadingTcTags) {
      setData(prev => ({
        ...prev,
        tag: tcTags.find(item => item.id === 'a9fec3f1-5ce0-4780-9051-befc2ab518de'),
      }))
    }
  }, [isLoadingTcTags, setData, tcTags])

  const tagSelected = useMemo(() => data.tag, [data.tag])

  const handleSelectTag = tag => {
    setData(prev => ({
      ...prev,
      tag,
    }))
  }

  if (isLoadingTcTags) {
    return <Loading />
  }

  return (
    <div>
      <div className='flex items-center justify-between'>
        <LabelTooltip
          id='competition-label'
          label='Label'
          showInfoIcon
          tooltip='You can only choose one label'
          required
        />
      </div>
      <div className='relative flex flex-wrap gap-3'>
        {tcTags?.map(item => (
          <TagItem key={item.id} onSelect={tag => handleSelectTag(tag)} tag={item} tagSelected={tagSelected} />
        ))}
      </div>
      {tagSelected && (
        <div className='mt-3 border-y border-neutral-700 py-3'>
          <div className='flex items-center gap-6'>
            {tagSelected.type !== TAG_TYPE.OFFICIAL ? (
              <EmphasisButton className='max-h-6 rounded-full bg-neutral-600 px-2 py-[2px] text-center text-xs'>
                {tagSelected?.name}
              </EmphasisButton>
            ) : (
              <PrimaryButton className='max-h-6 rounded-full px-2 py-[2px] text-center text-xs'>
                {tagSelected?.name}
              </PrimaryButton>
            )}
            <TextSubHeading className='w-[60%]'>{tagSelected?.description}</TextSubHeading>
          </div>
        </div>
      )}
      <div />
    </div>
  )
}

export default Tag
