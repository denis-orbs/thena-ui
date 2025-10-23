import { usePathname } from 'next/navigation'
import { useMemo, useRef } from 'react'
import { useTranslations } from 'use-intl'

import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { cn, isInvalidAmount } from '@/lib/utils'
import ActionButtons from '@/modules/Profile/ActionButtons'
import { useV3PoolsWithGauge } from '@/state/pools/hooks'

import CheckboxListField from './fields/CheckboxListField'
import DisplayCountPickerField from './fields/DisplayCountPickerField'
import InputField from './fields/InputField'
import PairPickerField from './fields/PairPickerField'
import RadioGroupField from './fields/RadioGroupField'
import Tabs from './Tabs'
import { PATH_NAME } from '../../lib/utils'

export default function TemplateSidebar({ title, subTitle = '', fields, state, setField, split = false }) {
  const t = useTranslations()

  // For Pool apr
  const { pairs } = usePairs()
  const pairFilteredSubpools = pairs.map(ele => {
    let { subpools } = ele
    if ([PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(ele.type)) {
      subpools = ele.subpools.filter(sub => sub.version === 3)
    }
    if (ele.type === PAIR_TYPES.LSD) {
      const hasCLFarming = ele.subpools.some(sub => sub.title === 'CL_Farming')
      if (hasCLFarming) {
        subpools = ele.subpools.filter(sub => sub.title !== 'CL_SwapFee')
      }
    }
    return { ...ele, subpools }
  })

  // not allow select same pool
  const excluded = useMemo(
    () =>
      new Set(
        (state.pairs || [])
          .map(x => (typeof x === 'string' ? x : x?.address))
          .filter(Boolean)
          .map(s => String(s).toLowerCase()),
      ),
    [state.pairs],
  )

  const poolApr = useMemo(
    () =>
      pairFilteredSubpools
        .filter(ele => !excluded.has(String(ele.address || ele.pool?.address || '').toLowerCase()))
        .filter(ele => {
          if (ele.type === PAIR_TYPES.WEIGHTED) {
            return !isInvalidAmount(ele.aprNumber)
          }
          return ele.highApr > 0
        })
        .sort(
          (a, b) =>
            (b.type === PAIR_TYPES.WEIGHTED ? b.aprNumber : b.highApr) -
            (a.type === PAIR_TYPES.WEIGHTED ? a.aprNumber : a.highApr),
        ),
    [excluded, pairFilteredSubpools],
  )

  // For incentives
  const v3PoolsWithGauge = useV3PoolsWithGauge()
  const incentivesPool = useMemo(
    () =>
      v3PoolsWithGauge
        .filter(ele => !excluded.has(String(ele.address || ele.pool?.address || '').toLowerCase()))
        .sort((a, b) => a.gauge.bribeUsd.minus(b.gauge.bribeUsd).times(-1).toNumber()),
    [excluded, v3PoolsWithGauge],
  )

  const pathname = usePathname()

  const map = {
    select: {
      component: DisplayCountPickerField,
    },
    pair: {
      component: PairPickerField,
      options:
        pathname === PATH_NAME.POOL_APR || pathname === PATH_NAME.PORTFOLIO
          ? poolApr
          : PATH_NAME.INCENTIVES === pathname
            ? incentivesPool
            : [],
    },
    input: {
      component: InputField,
    },
    radioGroup: {
      component: RadioGroupField,
    },
    checkboxList: {
      component: CheckboxListField,
    },
  }

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
        label: f.label ? `${f.label} ${i + 1}` : undefined,
        name: `${f.name}[${i}]`,
      }))
    }
    return [f]
  })

  const hydratedFields = expandedFields.map(f => {
    if (f.dependsOn && f.optionMap) {
      const key = state?.[f.dependsOn]
      return { ...f, options: f.optionMap[key] ?? [] }
    }
    return f
  })

  const getValue = f => {
    if (typeof f.__index === 'number' && f.__baseName) {
      return (state?.[f.__baseName] ?? [])[f.__index] ?? 0
    }
    return state?.[f.name]
  }

  const handleChange = (f, v) => {
    if (typeof f.__index === 'number' && f.__baseName) {
      const base = f.__baseName
      const arr = Array.isArray(state?.[base]) ? [...state[base]] : []
      arr[f.__index] = v
      setField(base, arr)
      return
    }

    if (f.name && fields.some(x => x.repeatBy === f.name)) {
      const count = Math.max(0, Number(v) || 0)
      setField(f.name, count)

      fields.forEach(x => {
        if (x.repeatBy === f.name) {
          const curr = Array.isArray(state?.[x.name]) ? [...state[x.name]] : []
          const next = curr.slice(0, count)
          while (next.length < count) next.push(null)
          setField(x.name, next)
        }
      })
      return
    }

    if (f.name && fields.some(x => x.dependsOn === f.name)) {
      setField(f.name, v)

      fields.forEach(dep => {
        if (dep.dependsOn === f.name) {
          const allowed = dep.optionMap?.[v] ?? []

          if (dep.type === 'checkboxList') {
            const current = Array.isArray(state?.[dep.name]) ? state[dep.name] : []
            const filtered = current.filter(x => allowed.includes(x))
            setField(dep.name, filtered)
          } else {
            const curr = state?.[dep.name]
            setField(dep.name, allowed.includes(curr) ? curr : allowed[0] ?? null)
          }
        }
      })
      return
    }

    // normal field
    setField(f.name, v)
  }

  const ref = useRef(null)
  return (
    <aside className='flex h-full min-h-[576px] flex-col gap-6 rounded-xl'>
      <div className='flex flex-1 flex-col gap-6'>
        <Tabs />
        <div className='flex flex-col gap-1'>
          {title && (
            <TextHeading className='font-archia text-2xl font-semibold -tracking-[0.03em] text-white'>
              {t(title)}
            </TextHeading>
          )}
          {subTitle && <Paragraph>{t(subTitle)}</Paragraph>}
        </div>
        <div ref={ref} className={cn('scrollbar-gutter-stable space-y-4')}>
          {hydratedFields.map((f, index) => {
            const Field = map[f.type]?.component ?? null
            if (!Field) return <></>
            return (
              <div key={f.name} className='flex flex-col gap-6'>
                {split && index > 0 && <div className='h-px w-full bg-neutral-700' />}
                <Field
                  key={f.name}
                  {...f}
                  options={f.type !== 'pair' ? f.options : map[f.type]?.options || []}
                  value={getValue(f)}
                  onChange={v => handleChange(f, v)}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className='mt-auto flex w-full gap-3'>
        <ActionButtons scale={1920 / 1024} fileName={title.replace(/ /g, '_')} backgroundColor='transparent' />
      </div>
    </aside>
  )
}
