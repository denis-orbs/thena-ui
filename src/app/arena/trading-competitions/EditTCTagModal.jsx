import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'use-intl'

import Loading from '@/app/loading'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { fetchGetTCTag, useCreateTcTag } from '@/modules/CreateTradingCompetition'
import { TagItem } from '@/modules/CreateTradingCompetition/Tag'

function EditTCTagModal({ competition, onClose }) {
  const router = useRouter()
  const t = useTranslations()
  const { data: tcTags, isLoading: isLoadingTcTags } = useSWR(['fetTcTags'], () => fetchGetTCTag(), 30000)
  console.log({ tcTags })
  const { assignTCTag } = useCreateTcTag()

  const [tagSelected, setTagSelected] = useState(competition?.tcTagAssignments?.[0]?.tcTag)

  const handleSubmit = async () => {
    await assignTCTag({ tradingCompetitionId: competition?.id, tcTagId: tagSelected?.id }, () => {
      onClose()
      return router.push(`/arena/trading-competitions/${competition?.id}`)
    })
  }

  console.log({ competition })

  if (isLoadingTcTags) {
    return <Loading />
  }

  return (
    <Modal isOpen={open} closeModal={onClose} title='Warning'>
      <ModalBody>
        <div className='flex flex-wrap gap-3'>
          {tcTags?.map(item => (
            <TagItem tag={item} tagSelected={tagSelected} onSelect={tag => setTagSelected(tag)} />
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalFooter className='flex flex-row justify-center gap-4'>
          <EmphasisButton onClick={onClose} className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton onClick={handleSubmit} className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'>
            {t('Save change')}
          </PrimaryButton>
        </ModalFooter>
      </ModalFooter>
    </Modal>
  )
}

export default EditTCTagModal
