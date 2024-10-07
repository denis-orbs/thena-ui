import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'

import { fetchGetTCTag, useCreateTcTag } from '.'

function TagForm({ defaultData = undefined, handleCancel, handleSubmit }) {
  const t = useTranslations()

  const [tag, setTag] = useState({
    id: defaultData?.id || undefined,
    name: defaultData?.name || '',
    description: defaultData?.description || '',
  })

  const handleChangeData = tagName => event => {
    setTag({
      ...tag,
      [tagName]: event.target.value,
    })
  }

  const handleSave = () => handleSubmit(tag)

  return (
    <div className='mt-4'>
      <div className='flex gap-4'>
        <input
          type='text'
          lang='en'
          className='w-[40%] rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
          placeholder={t('Tag name')}
          value={tag?.name}
          onChange={handleChangeData('name')}
        />
        <input
          type='text'
          lang='en'
          className='w-[60%] rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
          placeholder={t('Description')}
          value={tag?.description}
          onChange={handleChangeData('description')}
        />
      </div>

      <EmphasisButton onClick={handleCancel}>{t('Cancel')}</EmphasisButton>
      <OutlinedButton disabled={!tag.name} className='border border-[#DC01D4] text-[#DC01D4]' onClick={handleSave}>
        {t(defaultData ? 'Save' : 'Add')}
      </OutlinedButton>
    </div>
  )
}

function Tag({ tagSelected = undefined, setTagSelected }) {
  const [refresh, setRefresh] = useState(1)
  const { account } = useWallet()
  const { data: userInfo, isLoading: isLoadingInfo } = useSWR(['fetchUserInfo', account])

  const t = useTranslations()

  const [toggleFormAddTag, setToggleFormAddTag] = useState(false)

  const [tagEdit, setTagEdit] = useState(undefined)

  const { createTCTag, updateTCTag, deleteTCTag } = useCreateTcTag()

  const { data: tcTags, isLoading: isLoadingTcTags } = useSWR(['fetTcTags', refresh], () => fetchGetTCTag(), 30000)

  const isAdmin = useMemo(
    () => account || (userInfo && (userInfo.isAdmin || userInfo.isSuperAdmin)),
    [account, userInfo],
  )

  const showForm = type => {
    if (type === 'edit') {
      setTagEdit(tagSelected)
    }
    setToggleFormAddTag(prev => !prev)
  }

  const handleSelectTag = tagId => {
    setTagSelected(tcTags?.find(item => item.id === tagId))
  }

  const cancelEditTag = () => {
    setTagEdit(undefined)
    setToggleFormAddTag(false)
  }

  const handleSubmit = async newTag => {
    setTagEdit(undefined)
    setToggleFormAddTag(false)
    if (newTag?.id) {
      const data = await updateTCTag({ ...newTag })
      if (data) {
        console.log({ data })
        setTagSelected(data)
        setRefresh(Date.now())
      }
    } else {
      const data = await createTCTag({ name: newTag.name, description: newTag.description })
      if (data) {
        setTagSelected(data)
        setRefresh(Date.now())
      }
    }
  }

  const handleRemoveTag = (tag, type) => {
    setTagEdit(undefined)
    setTagSelected(undefined)

    if (type === 'delete' && tag?.name?.toLowerCase() !== 'official' && tag?.name?.toLowerCase() !== 'community') {
      deleteTCTag(tag?.id)
      setRefresh(Date.now())
    }
  }

  if (isLoadingInfo || isLoadingTcTags) return <Loading />

  return (
    <div>
      <div className='flex items-center justify-between'>
        <TextHeading>{t('Tags')}</TextHeading>
        <PrimaryButton onClick={showForm} className='h-10 w-[95px] px-3 text-base'>
          {t('New Tag')}
        </PrimaryButton>
      </div>
      <div className='flex flex-wrap gap-3'>
        {tcTags?.map(item =>
          item?.name === 'Official' ? (
            <PrimaryButton
              onClick={() => handleSelectTag(item?.id)}
              className='max-h-6 rounded-full bg-primary-600 px-2 py-[2px] text-center text-xs disabled:opacity-10'
              disabled={tagSelected && tagSelected?.id !== item?.id}
            >
              {item?.name}
            </PrimaryButton>
          ) : (
            <EmphasisButton
              onClick={() => handleSelectTag(item?.id)}
              className='max-h-6 rounded-full bg-neutral-600 px-2 py-[2px] text-center text-xs'
              disabled={tagSelected && tagSelected?.id !== item?.id}
            >
              {item?.name}
            </EmphasisButton>
          ),
        )}
      </div>
      {tagSelected && !toggleFormAddTag && (
        <div className='bor mt-3 border-y border-neutral-700 py-3'>
          <div className='flex items-center gap-6'>
            <EmphasisButton className='max-h-6 rounded-full bg-neutral-600 px-2 py-[2px] text-center text-xs'>
              {tagSelected?.name}
            </EmphasisButton>
            <TextSubHeading className='w-[60%]'>{tagSelected?.description}</TextSubHeading>
            {(account || (userInfo && (userInfo.isAdmin || userInfo.isSuperAdmin))) && (
              <div className='flex'>
                {isAdmin && (
                  <OutlinedButton className='border-none' onClick={() => showForm('edit')}>
                    {t('Edit')}
                  </OutlinedButton>
                )}
                <OutlinedButton className='border-none' onClick={() => handleRemoveTag(tagSelected, 'remove')}>
                  {t('Remove')}
                </OutlinedButton>
                {isAdmin && (
                  <OutlinedButton className='border-none' onClick={() => handleRemoveTag(tagSelected, 'delete')}>
                    {t('Delete')}
                  </OutlinedButton>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Form add new Tag */}
      {toggleFormAddTag && <TagForm defaultData={tagEdit} handleCancel={cancelEditTag} handleSubmit={handleSubmit} />}
      <div />
    </div>
  )
}

export default Tag
