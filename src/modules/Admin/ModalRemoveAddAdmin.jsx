'use client'

import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody } from '@/components/modal'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useUpdateAdminPermission } from '@/hooks/useUpdateAdminPermission'
import { successToast } from '@/lib/notify'
import { User } from '@/svgs'

function ModalRemoveAddAdmin({ type = 'remove', isOpen, closeModal = () => {}, user = {}, setReloadFetch }) {
  const { updateAdminPermission } = useUpdateAdminPermission()

  const isRemoveAdmin = type === 'remove'
  const t = useTranslations()

  const handleUpdatePermission = useCallback(async () => {
    if (user && user.id) {
      const res = await updateAdminPermission({ userId: user?.id, isAdmin: !isRemoveAdmin })

      if (res) {
        successToast('Successfully')
        setReloadFetch(prev => prev + 1)
        closeModal()
      }
    }
  }, [user, updateAdminPermission, isRemoveAdmin, setReloadFetch, closeModal])

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} width={600}>
      <ModalBody className='py-0'>
        <div className='flex flex-col items-center gap-3'>
          <div className='flex flex-row items-center justify-center'>
            <Highlight className='bg-primary-600'>
              <User className='h-4 w-4' />
            </Highlight>
          </div>
          <TextHeading className='text-3xl capitalize'>{t(isRemoveAdmin ? 'Remove admin' : 'Add admin')}</TextHeading>
          <TextSubHeading>
            {t('Are you sure you want to admin', { type: isRemoveAdmin ? 'remove' : 'add' })}
          </TextSubHeading>
          <Box className='flex w-full flex-col border border-neutral-700'>
            {user ? (
              user.username ? (
                <div className='flex flex-col items-center gap-3'>
                  <div className='flex flex-row items-center justify-center gap-2'>
                    <CircleImage src={Avatar} alt='avatar' className='size-9' />
                    <TextHeading>{user.username}</TextHeading>
                  </div>
                  <TextSubHeading className='text-base'>{user.id}</TextSubHeading>
                </div>
              ) : (
                <div className='flex flex-row items-center gap-2'>
                  <CircleImage src={Avatar} alt='avatar' className='size-9' />
                  <TextHeading className='text-base'>{user.id}</TextHeading>
                </div>
              )
            ) : null}
          </Box>
          <div className='mt-2 flex w-full flex-row items-center gap-2'>
            <EmphasisButton className='w-full'>{t('Cancel')}</EmphasisButton>
            <PrimaryButton className='w-full' onClick={handleUpdatePermission}>
              {t(isRemoveAdmin ? 'Remove admin' : 'Add admin')}
            </PrimaryButton>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}

export default ModalRemoveAddAdmin
