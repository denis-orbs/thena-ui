/* eslint-disable @next/next/no-img-element */
import { isString } from 'lodash'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo, useRef, useState } from 'react'

import { EmphasisButton, OutlinedButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Divider from '@/components/divider'
import Modal, { ModalBody } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { cn } from '@/lib/utils'
import PreviewCanvas from '@/modules/Studio/Preview/PreviewCanvas'

import ChevronDownIcon from '~/svgs/chevron-down.svg'
import EditIcon from '~/svgs/edit.svg'
import ImageUpIcon from '~/svgs/image-up.svg'

import DownloadImage from './DownloadImage'
import ShareImage from './ShareImage'
import useCheckShouldUseS3Upload from '../hooks/useCheckShouldUseS3Upload'

function BackgroundSelection({ state, setField, tpl }) {
  const t = useTranslations()
  const [openPreview, setOpenPreview] = useState(false)
  const [open, setOpen] = useState(false)
  const imgInputRef = useRef(null)
  const background = useMemo(() => state.background, [state.background])
  const { Preview } = tpl

  const imageOptions = useMemo(
    () => [
      {
        id: 1,
        name: '3D Grid',
        image: '/images/content-studio/3d_grid.png',
        value: '/images/content-studio/3d_grid1.png',
        mini: '/images/content-studio/3d_grid_option.png',
      },
      {
        id: 2,
        name: 'Violet Glow',
        image: '/images/content-studio/violet_glow.png',
        value: '/images/content-studio/violet_glow1.png',
        mini: '/images/content-studio/violet_glow_option.png',
      },
      {
        id: 3,
        name: 'Starry Night',
        image: '/images/content-studio/starry_night.png',
        value: '/images/content-studio/starry_night1.png',
        mini: '/images/content-studio/starry_night_option.png',
      },
      {
        id: 4,
        name: 'Tech Horizon',
        image: '/images/content-studio/tech_horizon.png',
        value: '/images/content-studio/tech_horizon1.png',
        mini: '/images/content-studio/tech_horizon_option.png',
      },
      {
        id: 5,
        name: 'No Background',
        image: null,
        value: null,
        mini: '/images/content-studio/transparent_option.png',
      },
      {
        id: 6,
        isCustom: true,
        name: 'Custom image',
        image: null,
        value: null,
        mini: (
          <div className='flex aspect-[1.7] w-full flex-1 items-center justify-center rounded-lg bg-neutral-700'>
            <ImageUpIcon className='size-8 text-neutral-200' />
          </div>
        ),
      },
    ],
    [],
  )

  const selectedOption = useMemo(
    () => imageOptions.filter(option => !option.isCustom).find(option => option.id === background.id),
    [background.id, imageOptions],
  )

  return (
    <>
      <div className='mt-auto hidden w-full flex-col gap-2 xl:flex'>
        <TextHeading className='font-archia text-2xl font-semibold -tracking-[0.03em] text-white'>
          {t('Background Image')}
        </TextHeading>
        <div className='grid w-full grid-cols-6 gap-4 max-md:grid-cols-2'>
          {imageOptions.map(option => (
            <div
              key={option.id}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-3 transition-all duration-300',
                background.id === option.id
                  ? 'border-primary-800 bg-[#230924]'
                  : 'hover:border-primary-800 border-neutral-700 hover:bg-[#230924]',
              )}
              onClick={() => setField('background', option)}
            >
              {isString(option.mini) ? (
                <Image
                  className='h-full w-full object-cover'
                  src={option.mini}
                  alt={option.name}
                  width={100}
                  height={100}
                />
              ) : (
                option.mini
              )}
              <Paragraph className='text-md text-center text-neutral-200'>{option.name}</Paragraph>
            </div>
          ))}
        </div>
      </div>
      <div className='flex flex-col gap-4 xl:hidden'>
        <div className='relative w-full'>
          <EmphasisButton
            onClick={() => setOpen(!open)}
            className='flex w-full items-center justify-between rounded-lg bg-neutral-700 p-3 font-normal text-neutral-50 backdrop-blur-sm transition-all duration-200 hover:bg-neutral-700/50'
          >
            <div className='flex items-center space-x-3'>
              {selectedOption ? (
                <>
                  <span className='text-sm'>{selectedOption.name}</span>
                </>
              ) : (
                <span className='text-sm text-gray-300'>{t('Select Background Image')}</span>
              )}
            </div>
            <ChevronDownIcon className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
          </EmphasisButton>

          {/* Dropdown Options */}
          {open && (
            <div className='absolute top-full right-0 z-50 mt-2 h-[250px] w-full space-y-4 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-4 shadow-2xl backdrop-blur-md'>
              {imageOptions
                .filter(option => !option.isCustom)
                .map(option => (
                  <div
                    key={option.id}
                    onClick={() => {
                      setField('background', option)
                      setOpen(false)
                    }}
                    className={cn(
                      'group flex cursor-pointer items-center gap-4 rounded-xl border border-neutral-700 p-4 transition-colors duration-200 hover:bg-neutral-800',
                      option.id === selectedOption?.id && 'bg-primary-950/50 border-primary-800',
                    )}
                  >
                    <Image
                      className='h-[77px] w-[116px] rounded-lg'
                      src={option.mini}
                      alt={option.name}
                      width={116}
                      height={77}
                    />
                    <div className='flex-1'>
                      <span className='text-sm font-medium text-white'>{option.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <input
          type='file'
          onChange={e => {
            const file = e.target.files[0]
            if (file) {
              setField('background', {
                id: 6,
                name: 'Custom image',
                image: URL.createObjectURL(file),
                value: URL.createObjectURL(file),
              })
            }
            // Reset input value to allow selecting the same file again
            e.target.value = ''
          }}
          accept='image/*'
          className='hidden'
          ref={imgInputRef}
        />
        <PreviewCanvas background={state.background} className='flex' watermark='THENA'>
          <Preview state={state} setField={setField} />
        </PreviewCanvas>
        <div className='flex items-center justify-center gap-2'>
          <Divider className='w-full bg-[#422D4C]' />
          <span className='text-md text-[#8E8194]'>or</span>
          <Divider className='w-full bg-[#422D4C]' />
        </div>
        <OutlinedButton className='w-full' onClick={() => imgInputRef.current?.click()}>
          <ImageUpIcon className='size-4 text-neutral-200' />
          <span className='text-sm text-neutral-200'>{t('Add Custom Image')}</span>
        </OutlinedButton>
        <div className='mt-10 mb-2 flex'>
          <EmphasisButton className='w-full' onClick={() => setOpenPreview(true)}>
            {t('Preview')}
          </EmphasisButton>
        </div>
        {openPreview && (
          <PreviewModal
            openPreview={openPreview}
            setOpenPreview={setOpenPreview}
            state={state}
            setField={setField}
            tpl={tpl}
          />
        )}
      </div>
    </>
  )
}

function PreviewModal({ openPreview, setOpenPreview, state, setField, tpl }) {
  const { Preview } = tpl
  const { account } = useWallet()
  const shouldUseS3Upload = useCheckShouldUseS3Upload()
  const t = useTranslations()

  return (
    <Modal showHeadModal={false} isOpen={openPreview} onClose={() => setOpenPreview(false)}>
      <ModalBody>
        <div className='flex flex-col gap-3'>
          <PreviewCanvas background={state.background} className='flex' watermark='THENA'>
            <Preview state={state} setField={setField} />
          </PreviewCanvas>
          <div className='flex items-center justify-center gap-2'>
            <EmphasisButton className='w-1/2' onClick={() => setOpenPreview(false)}>
              <EditIcon className='size-4' /> {t('Edit')}
            </EmphasisButton>
            {shouldUseS3Upload && !account ? (
              <ConnectButton className='w-1/2' />
            ) : (
              <DownloadImage
                scale={1920 / 1024}
                fileName={tpl.title.replace(/ /g, '_')}
                backgroundColor='transparent'
                shouldUseS3Upload={shouldUseS3Upload}
              />
            )}
          </div>
          {account && (
            <ShareImage
              className='w-full'
              scale={1920 / 1024}
              fileName={tpl.title.replace(/ /g, '_')}
              backgroundColor='transparent'
            />
          )}
        </div>
      </ModalBody>
    </Modal>
  )
}

export default BackgroundSelection
