/* eslint-disable react/jsx-curly-newline */
import dynamic from 'next/dynamic'
import React from 'react'
import { Quill } from 'react-quill'
import quillEmoji from 'react-quill-emoji'

import 'react-quill/dist/quill.snow.css'
import 'react-quill-emoji/dist/quill-emoji.css'
import './style.css'

import Input from '@/components/input'

import LabelTooltip from '../../components/label/LabelTooltip'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const toolbarOption = [
  [{ header: [1, 2, false] }],
  ['bold', 'italic', 'strike', 'underline', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['emoji', 'image', 'code-block'],
]
Quill.register(
  {
    'formats/emoji': quillEmoji.EmojiBlot,
    'modules/emoji-toolbar': quillEmoji.ToolbarEmoji,
    'modules/emoji-textarea': quillEmoji.TextAreaEmoji,
    'modules/emoji-shortname': quillEmoji.ShortNameEmoji,
  },
  true,
)

function Detail({ data, setData }) {
  return (
    <>
      <div>
        <LabelTooltip
          label='Trading Competition Name'
          showInfoIcon
          tooltip='This is the name of your trading competition, which will be displayed on the trading competition feed.'
          id='trading-competition-name'
        />
        <Input
          onChange={e =>
            setData({
              ...data,
              name: e.target.value,
            })
          }
          type='text'
          value={data.name || ''}
          placeholder=''
        />
      </div>
      <div className='mt-3'>
        <LabelTooltip
          label='Description'
          showInfoIcon
          tooltip='Put the description for your trading competition here. You can use up to 2,000 characters and format it whatever way you would like.'
          id='trading-competition-description'
        />
        <ReactQuill
          modules={{
            toolbar: toolbarOption,
            'emoji-toolbar': true,
            'emoji-shortname': true,
          }}
          theme='snow'
          className='react-quill-create-tc w-full rounded-lg border border-neutral-700 bg-neutral-700'
          value={data.description}
          onChange={e => {
            const val = e === '<p><br></p>' ? '' : e
            setData({
              ...data,
              description: val,
            })
          }}
        />
      </div>
    </>
  )
}

export default Detail
