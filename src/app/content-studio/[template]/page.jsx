'use client'

import useTemplateState from '@/modules/Studio/hooks/useTemplateState'
import { getTemplateBySlug } from '@/modules/Studio/lib/templateRegistry'
import PreviewCanvas from '@/modules/Studio/Preview/PreviewCanvas'
import TemplateSidebar from '@/modules/Studio/StudioLayout/Sidebar/TemplateSidebar'

export default function TemplatePage({ params, searchParams }) {
  const tpl = getTemplateBySlug(params.template) // { title, fields, Preview }
  const { state, setField, reset } = useTemplateState(tpl, searchParams)

  if (!tpl) return <div className='p-6'>Not found</div>

  const { Preview } = tpl

  return (
    <>
      {/* <Toolbar state={state} setField={setField} /> */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[396px_1fr]'>
        <TemplateSidebar
          title={tpl.title}
          subTitle={tpl.subTitle}
          fields={tpl.fields}
          state={state}
          setField={setField}
          reset={reset}
        />
        <PreviewCanvas background={state.background} gridStyle={state.gridStyle} watermark='THENA'>
          <Preview state={state} setField={setField} />
        </PreviewCanvas>
      </div>
    </>
  )
}
