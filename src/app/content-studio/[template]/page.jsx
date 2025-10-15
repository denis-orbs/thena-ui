'use client'

import useTemplateState from '@/modules/Studio/hooks/useTemplateState'
import { getTemplateBySlug } from '@/modules/Studio/lib/templateRegistry'
import PreviewCanvas from '@/modules/Studio/Preview/PreviewCanvas'
import TemplateSidebar from '@/modules/Studio/StudioLayout/Sidebar/TemplateSidebar'

export default function TemplatePage({ params, searchParams }) {
  const tpl = getTemplateBySlug(params.template)
  const { slug } = params
  const { state, setField, reset } = useTemplateState(slug, tpl, searchParams)

  if (!tpl) return <div className='p-6'>Not found</div>

  const { Preview } = tpl

  return (
    <div className='flex w-full flex-col gap-4 overflow-hidden lg:flex-row lg:gap-5'>
      <div className='order-2 w-full shrink-0 lg:order-1 lg:w-[396px]'>
        <TemplateSidebar
          title={tpl.title}
          subTitle={tpl.subTitle}
          fields={tpl.fields}
          state={state}
          setField={setField}
          reset={reset}
        />
      </div>
      <PreviewCanvas background={state.background} className='order-1 flex overflow-hidden lg:order-2 lg:flex-1'>
        <Preview state={state} setField={setField} />
      </PreviewCanvas>
    </div>
  )
}
