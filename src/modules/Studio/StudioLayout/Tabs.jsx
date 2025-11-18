'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import cn from '@/utils/classes'

import ImageSelect from './Sidebar/fields/ImageSelect'
import useTemplateState from '../hooks/useTemplateState'

const items = [
  { slug: 'pools-apr', label: 'Pools APR' },
  { slug: 'incentives', label: 'Incentives' },
  { slug: 'portfolio', label: 'Portfolio' },
  { slug: 'metrics', label: 'Metrics' },
]

export default function Tabs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
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
      value: '/images/content-studio/3d_grid_option.png',
    },
    {
      id: 2,
      name: 'Violet Glow',
      image: '/images/content-studio/violet_glow.png',
      value: '/images/content-studio/violet_glow_option.png',
    },
    {
      id: 3,
      name: 'Starry Night',
      image: '/images/content-studio/starry_night.png',
      value: '/images/content-studio/starry_night_option.png',
    },
    {
      id: 4,
      name: 'Tech Horizon',
      image: '/images/content-studio/tech_horizon.png',
      value: '/images/content-studio/tech_horizon_option.png',
    },
  ]

  return (
    <div className='w-full bg-neutral-900 px-4 py-4 md:py-4.5'>
      <div className='mx-auto flex w-full max-w-[1440px] items-center justify-between'>
        <div className='flex items-center gap-2'>
          {items.map(it => {
            const active = pathname.includes(`/content-studio/${it.slug}`)
            return (
              <Link
                key={it.slug}
                href={`/content-studio/${it.slug}`}
                className={cn(
                  'rounded-lg px-1.5 py-2 text-[11px] leading-4 font-medium text-nowrap text-neutral-200 md:px-4 md:py-3 md:text-base md:leading-5',
                  active ? 'bg-neutral-800' : 'hover:bg-neutral-700',
                )}
              >
                {it.label}
              </Link>
            )
          })}
        </div>
        <div>
          <ImageSelect
            options={imageOptions}
            selectedOption={background}
            setSelectedOption={value => setField('background', value)}
          />
        </div>
      </div>
    </div>
  )
}
