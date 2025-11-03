import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import CheckBox from '@/components/checkbox'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Modal, { ModalBody } from '@/components/modal'
import Spinner from '@/components/spinner'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useCreateNotification } from '@/hooks/useAdminCreateNotification'
import { successToast } from '@/lib/notify'
import { isValidHttpUrl } from '@/lib/utils'

import ChartIcon from '~/svgs/chart-line.svg'

import { ModalAnalyticNotification } from './ModalAnalyticNotification'
import { ModalSelectUser } from './ModalSelectUser'

export function ModalCreateNotification({ onClose, isOpen }) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [isOpenSelectUser, setIsOpenSelectUser] = useState(false)
  const [isOpenAnalytic, setIsOpenAnalytic] = useState(false)

  const [isSendToAll, setIsSendToAll] = useState(true)

  const [data, setData] = useState({
    recipients: [],
    content: '',
    redirectUrl: '',
  })

  const [errors, setErrors] = useState({
    redirectUrl: null,
    content: null,
  })

  const { adminCreateNotification } = useCreateNotification()

  const handleSave = useCallback(async () => {
    setLoading(true)

    const validateContent = !data.content.length
    const validateRedirectUrl = !(data.redirectUrl.length && isValidHttpUrl(data.redirectUrl))

    if (validateContent || validateRedirectUrl) {
      setErrors({
        content: validateContent ? 'Content Is Not Be Empty' : null,
        redirectUrl: validateRedirectUrl ? 'Must Be An URL' : null,
      })
      setLoading(false)
      return
    }

    return await adminCreateNotification(
      {
        ...data,
        recipients: isSendToAll ? undefined : data.recipients.map(recipient => recipient.id),
      },
      () => {
        setLoading(false)
        successToast('Successfully')
        onClose()
      },
      () => {
        setLoading(false)
      },
    )
  }, [adminCreateNotification, data, isSendToAll, onClose])

  return (
    <Modal isOpen={isOpen} closeModal={onClose} title='Create Notification' width={600}>
      <ModalBody className='py-0'>
        <div className='mt-3'>
          <div
            className='mb-2 flex cursor-pointer items-center gap-2'
            onClick={() => {
              setIsSendToAll(!isSendToAll)
            }}
          >
            <CheckBox className='min-w-[21px]' checked={isSendToAll} />
            <TextHeading>{t('Send To All')}</TextHeading>
          </div>
          {!isSendToAll && (
            <>
              <LabelTooltip
                id='trading-competition-tradable-tokens'
                label='Select Users'
                showInfoIcon
                tooltip='Select Users'
                required
              />
              <div className='relative flex cursor-pointer items-center' onClick={() => setIsOpenSelectUser(true)}>
                <div className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pr-8 pl-4 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'>
                  {data.recipients.length} {t('Selected')}
                </div>
              </div>
            </>
          )}
        </div>
        <div className=''>
          <LabelTooltip
            label='Notification Content'
            showInfoIcon
            tooltip='Notification Content'
            id='notification-content'
            required
          />
          <Input
            type='text'
            placeholder={t('Notification Content')}
            value={data.content}
            onChange={e => {
              if (errors.content) {
                setErrors({
                  content: null,
                })
              }
              setData({
                ...data,
                content: e.target.value,
              })
            }}
          />
          {errors.content && <TextSubHeading className='text-error-600'>{errors.content}</TextSubHeading>}
        </div>
        <div>
          <LabelTooltip label='Redirect To' showInfoIcon tooltip='Redirect To' id='redirect-to' required />
          <Input
            type='text'
            onChange={e => {
              if (errors.redirectUrl) {
                setErrors({
                  content: null,
                })
              }
              setData({
                ...data,
                redirectUrl: e.target.value,
              })
            }}
            value={data.redirectUrl}
            placeholder={t('Link to redirect')}
          />
          {errors.redirectUrl && <TextSubHeading className='text-error-600'>{errors.redirectUrl}</TextSubHeading>}
        </div>
        <div className='mt-2 flex w-full flex-col-reverse items-center justify-between gap-2 lg:flex-row'>
          <EmphasisButton onClick={onClose} className='w-full lg:flex-1'>
            {t('Cancel')}
          </EmphasisButton>
          <div className='flex w-full flex-2 items-center justify-center gap-2'>
            <PrimaryButton onClick={handleSave} disabled={loading} className='w-full flex-2'>
              {loading && <Spinner />}
              {t('Send')}
            </PrimaryButton>
            <EmphasisIconButton
              Icon={ChartIcon}
              onClick={() => setIsOpenAnalytic(true)}
              className='h-full w-full flex-1 lg:flex-0'
            />
          </div>
        </div>
      </ModalBody>
      {isOpenSelectUser && (
        <ModalSelectUser
          popup={isOpenSelectUser}
          selectedUsers={data.recipients}
          setPopup={setIsOpenSelectUser}
          setSelectedUsers={val => {
            setData({
              ...data,
              recipients: val,
            })
          }}
        />
      )}
      {isOpenAnalytic && <ModalAnalyticNotification isOpen={isOpenAnalytic} onClose={() => setIsOpenAnalytic(false)} />}
    </Modal>
  )
}
