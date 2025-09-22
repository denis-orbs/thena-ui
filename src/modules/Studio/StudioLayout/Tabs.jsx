'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

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
      image: '/images/content-studio/bg_1.png',
      value: '/images/content-studio/bg_1.png',
    },
    {
      id: 2,
      name: 'Purple Night Sky',
      image: '/images/content-studio/bg_2.png',
      value: '/images/content-studio/bg_2.png',
    },
  ]

  return (
    <div className='w-full bg-neutral-900 px-4 py-4 md:py-4.5'>
      <div className='mx-auto flex w-full max-w-[1420px] items-center justify-between'>
        <div className='flex items-center gap-2 px-4'>
          {items.map(it => {
            const active = pathname.includes(`/content-studio/${it.slug}`)
            return (
              <Link
                key={it.slug}
                href={`/content-studio/${it.slug}`}
                className={cn(
                  'rounded-lg px-1.5 py-2 text-[11px] leading-4 font-medium text-neutral-200 md:px-4 md:py-3 md:text-base md:leading-5',
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
