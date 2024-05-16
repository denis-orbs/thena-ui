import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import 'react-quill/dist/quill.snow.css'
import 'react-quill-emoji/dist/quill-emoji.css'
import './style.css'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Modal, { ModalBody } from '@/components/modal'
import { ChartIcon } from '@/svgs'

import { ModalAnalyticNotification } from './ModalAnalyticNotification'
import { ModalSelectUser } from './ModalSelectUser'

const QuillEditor = dynamic(() => import('@/components/editor/QuillEditor'), { ssr: false })

export function ModalCreateNotification({ onClose, isOpen }) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [isOpenSelectUser, setIsOpenSelectUser] = useState(false)
  const [isOpenAnalytic, setIsOpenAnalytic] = useState(false)

  const [data, setData] = useState({
    users: [],
    text: '',
    redirect: '',
  })

  const handleSave = useCallback(async () => {
    setLoading(true)
  }, [])

  return (
    <Modal isOpen={isOpen} closeModal={onClose} title='Create notification' width={600}>
      <ModalBody className='py-0'>
        <div className='mt-3'>
          <LabelTooltip
            id='trading-competition-tradable-tokens'
            label='Select User'
            showInfoIcon
            tooltip='Select users'
            required
          />
          <div className='relative flex cursor-pointer items-center' onClick={() => setIsOpenSelectUser(true)}>
            <div
              className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pl-4 pr-8 text-neutral-50
           placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
            >
              {data.users?.length || 0} Selected
            </div>
          </div>
        </div>
        <div className='mt-3'>
          <LabelTooltip
            label='Notification text'
            showInfoIcon
            tooltip='Notification text'
            id='trading-competition-description'
            required
          />
          <QuillEditor
            value={data.description}
            onChange={value => {
              setData({
                ...data,
                description: value,
              })
            }}
          />
        </div>
        <div>
          <LabelTooltip
            label='Redirect to'
            showInfoIcon
            tooltip='Redirect to.'
            id='trading-competition-name'
            required
          />
          <Input
            type='text'
            onChange={e => {
              setData({
                ...data,
                redirect: e.target.value,
              })
            }}
            value={data.redirect}
            placeholder='Link to redirect'
          />
        </div>
        <div className='mt-2 flex w-full flex-col-reverse items-center justify-between gap-2 lg:flex-row'>
          <EmphasisButton onClick={onClose} className='w-full lg:flex-1'>
            {t('Cancel')}
          </EmphasisButton>
          <div className='flex w-full flex-2 items-center justify-center gap-2'>
            <PrimaryButton onClick={handleSave} disabled={loading} className='w-full flex-2'>
              {t('Save Change')}
            </PrimaryButton>
            <EmphasisIconButton
              Icon={ChartIcon}
              onClick={() => setIsOpenAnalytic(true)}
              className='lg:flex-0 h-full w-full flex-1'
            />
          </div>
        </div>
      </ModalBody>
      {isOpenSelectUser && (
        <ModalSelectUser
          popup={isOpenSelectUser}
          selectedUsers={data.users}
          setPopup={setIsOpenSelectUser}
          setSelectedUsers={val => {
            setData({
              ...data,
              user: val,
            })
          }}
        />
      )}
      {isOpenAnalytic && <ModalAnalyticNotification isOpen={isOpenAnalytic} onClose={() => setIsOpenAnalytic(false)} />}
    </Modal>
  )
}
