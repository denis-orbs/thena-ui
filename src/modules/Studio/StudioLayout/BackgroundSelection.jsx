/* eslint-disable @next/next/no-img-element */
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useRef, useState } from 'react'

import { Paragraph, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ImageUpIcon } from '@/svgs'

import useTemplateState from '../hooks/useTemplateState'

const items = [
  { slug: 'pool-apr', label: 'Pools APR' },
  { slug: 'incentives', label: 'Incentives' },
  { slug: 'portfolio', label: 'Portfolio' },
  { slug: 'metrics', label: 'Metrics' },
]

function BackgroundSelection() {
  const t = useTranslations()
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const [customImage, setCustomImage] = useState(null)
  const imgInputRef = useRef(null)
  const currentSlug = items.find(i => parts.includes(i.slug))?.slug

  const {
    setField,
    state: { background },
  } = useTemplateState(currentSlug)

  const imageOptions = [
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
  ]
  return (
    <div className='mt-auto flex w-full flex-col gap-2'>
      <TextHeading className='font-archia text-2xl font-semibold -tracking-[0.03em] text-white'>
        {t('Background Image')}
      </TextHeading>
      <div className='grid w-full grid-cols-5 gap-4 max-md:grid-cols-2'>
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
            <img className='h-full w-full object-cover' src={option.mini} alt={option.name} width={100} height={100} />
            <Paragraph className='text-md text-center text-neutral-200'>{option.name}</Paragraph>
          </div>
        ))}
        <div
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-3',
            background.id === 5
              ? 'border-primary-800 bg-[#230924]'
              : 'hover:border-primary-800 border-neutral-700 hover:bg-[#230924]',
          )}
          onClick={() => imgInputRef.current?.click()}
        >
          <input
            type='file'
            onChange={e => {
              const file = e.target.files[0]
              if (file) {
                setCustomImage(URL.createObjectURL(file))
                setField('background', {
                  id: 5,
                  name: 'Custom image',
                  image: URL.createObjectURL(file),
                  value: 'null',
                })
              }
            }}
            accept='image/*'
            className='hidden'
            ref={imgInputRef}
          />
          {customImage ? (
            <img className='h-full w-full object-cover' src={customImage} alt='Custom' width={100} height={100} />
          ) : (
            <div className='flex aspect-[1.7] w-full flex-1 items-center justify-center rounded-lg bg-neutral-700'>
              <ImageUpIcon className='size-8 text-neutral-200' />
            </div>
          )}
          <Paragraph className='text-md text-center text-neutral-200'>Custom image</Paragraph>
        </div>
      </div>
    </div>
  )
}

export default BackgroundSelection
