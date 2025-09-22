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
    <>
      {/* <Toolbar state={state} setField={setField} /> */}
      {/* flex w-full flex-col gap-2 lg:flex-row 2xl:gap-5 */}
      {/* grid grid-cols-1 gap-6 lg:grid-cols-[396px_1fr] */}
      <div className='flex w-full flex-col gap-6 lg:flex-row'>
        <div className='order-2 lg:order-1'>
          <TemplateSidebar
            title={tpl.title}
            subTitle={tpl.subTitle}
            fields={tpl.fields}
            state={state}
            setField={setField}
            reset={reset}
          />
        </div>
        <div className='order-1 items-center lg:order-2'>
          <PreviewCanvas background={state.background} watermark='THENA'>
            <Preview state={state} setField={setField} />
          </PreviewCanvas>
        </div>
      </div>
    </>
  )
}
