import { useTranslations } from 'use-intl'

import { Paragraph, TextHeading } from '@/components/typography'
import DownloadButton from '@/modules/Profile/DownloadImage'

import DisplayCountPickerField from './fields/DisplayCountPickerField'
import PairPickerField from './fields/PairPickerField'

const map = {
  select: DisplayCountPickerField,
  pair: PairPickerField,
}

export default function TemplateSidebar({ title, subTitle = '', fields, state, setField }) {
  const t = useTranslations()

  // ---- expand fields have repeatBy ----
  const expandedFields = fields.flatMap(f => {
    if (f.repeatBy) {
      const count = Number(state[f.repeatBy] ?? 0)
      const max = f.max ?? count
      const safeCount = Math.min(count, max)

      return Array.from({ length: safeCount }, (_, i) => ({
        ...f,
        __baseName: f.name,
        __index: i,
        label: `${f.label} ${i + 1}`,
        name: `${f.name}[${i}]`,
      }))
    }
    return [f]
  })

  const getValue = f => {
    if (typeof f.__index === 'number' && f.__baseName) {
      return (state?.[f.__baseName] ?? [])[f.__index]
    }
    return state?.[f.name]
  }

  const handleChange = (f, v) => {
    if (typeof f.__index === 'number' && f.__baseName) {
      const arr = Array.isArray(state?.[f.__baseName]) ? [...state[f.__baseName]] : []
      arr[f.__index] = v
      setField(f.__baseName, arr)
    } else if (f.name && fields.some(x => x.repeatBy === f.name)) {
      // when displayCount change ⇒ sync pairs again
      const count = Number(v)
      setField(f.name, count)
      fields.forEach(x => {
        if (x.repeatBy === f.name) {
          const current = Array.isArray(state?.[x.name]) ? [...state[x.name]] : []
          setField(x.name, current.slice(0, count))
        }
      })
    } else {
      setField(f.name, v)
    }
  }

  return (
    <aside className='flex h-[576px] flex-col gap-5 rounded-xl bg-neutral-900 p-6'>
      <div className='flex flex-col gap-1'>
        <TextHeading className='font-archia text-2xl font-semibold text-white'>{t(title)}</TextHeading>
        <Paragraph>{t(subTitle)}</Paragraph>
      </div>
      <div className='max-h-[360px] space-y-6 overflow-y-auto'>
        {expandedFields.map(f => {
          const Field = map[f.type] ?? null
          if (!Field) return null
          return <Field key={f.name} {...f} value={getValue(f)} onChange={v => handleChange(f, v)} />
        })}
      </div>
      <div className='mt-auto w-full'>
        <DownloadButton />
      </div>
    </aside>
  )
}
