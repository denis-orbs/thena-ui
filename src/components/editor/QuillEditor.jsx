import React, { useMemo } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import quillEmoji from 'react-quill-emoji'

import { cn } from '@/lib/utils'

Quill.register(
  {
    'formats/emoji': quillEmoji.EmojiBlot,
    'modules/emoji-toolbar': quillEmoji.ToolbarEmoji,
    'modules/emoji-textarea': quillEmoji.TextAreaEmoji,
    'modules/emoji-shortname': quillEmoji.ShortNameEmoji,
  },
  true,
)

function QuillEditor({ value, onChange, className, customToolbar = undefined }) {
  const toolbarOption = useMemo(() => {
    if (!customToolbar) {
      return [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'strike', 'underline', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['emoji', 'code-block'],
      ]
    }
    return customToolbar
  }, [customToolbar])

  return (
    <ReactQuill
      modules={{
        toolbar: toolbarOption,
        'emoji-toolbar': true,
        'emoji-shortname': true,
      }}
      theme='snow'
      className={cn('react-quill-create-tc w-full rounded-lg border border-neutral-700 bg-neutral-700', className)}
      value={value}
      onChange={valueChange => {
        const val = valueChange === '<p><br></p>' ? '' : valueChange
        if (onChange) {
          onChange(val)
        }
      }}
    />
  )
}

export default QuillEditor
