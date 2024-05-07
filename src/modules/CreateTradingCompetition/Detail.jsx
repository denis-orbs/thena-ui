/* eslint-disable react/jsx-curly-newline */
import dynamic from 'next/dynamic'
import React from 'react'

import 'react-quill/dist/quill.snow.css'
import 'react-quill-emoji/dist/quill-emoji.css'
import './style.css'

import Input from '@/components/input'

import LabelTooltip from '../../components/label/LabelTooltip'

const QuillEditor = dynamic(() => import('@/components/editor/QuillEditor'), { ssr: false })

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
        <QuillEditor
          value={data.description}
          onChange={value => {
            setData({
              ...data,
              description: value,
            })
          }}
          customToolbar={[
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'strike', 'underline', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            ['emoji', 'code-block'],
          ]}
        />
      </div>
    </>
  )
}

export default Detail
