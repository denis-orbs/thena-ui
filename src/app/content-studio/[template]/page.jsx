'use client'

import useTemplateState from '@/modules/Studio/hooks/useTemplateState'
import { getTemplateBySlug } from '@/modules/Studio/lib/templateRegistry'
import PreviewCanvas from '@/modules/Studio/Preview/PreviewCanvas'
import BackgroundSelection from '@/modules/Studio/StudioLayout/BackgroundSelection'
import TemplateSidebar from '@/modules/Studio/StudioLayout/Sidebar/TemplateSidebar'

export default function TemplatePage({ params, searchParams }) {
  const tpl = getTemplateBySlug(params.template)
  const { slug } = params
  const { state, setField, reset } = useTemplateState(slug, tpl, searchParams)

  if (!tpl) return <div className='p-6'>Not found</div>

  const { Preview } = tpl

  return (
    <div className='flex w-full flex-col gap-4 overflow-hidden xl:flex-row'>
      <div className='w-full shrink-0 xl:w-[438px]'>
        <TemplateSidebar
          title={tpl.title}
          subTitle={tpl.subTitle}
          fields={tpl.fields}
          split={tpl.split}
          state={state}
          setField={setField}
          reset={reset}
        />
      </div>
      <div className='flex flex-col gap-6 overflow-hidden xl:flex-1'>
        <PreviewCanvas background={state.background} className='hidden xl:flex'>
          <Preview state={state} setField={setField} />
        </PreviewCanvas>
        <BackgroundSelection state={state} setField={setField} tpl={tpl} />
      </div>
    </div>
  )
}
