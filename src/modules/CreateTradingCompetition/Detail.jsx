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
          tooltip='Trading Competition Name Tooltip'
          id='trading-competition-name'
          required
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
          tooltip='Trading Competition Description Tooltip'
          id='trading-competition-description'
          required
        />
        <QuillEditor
          value={data.description}
          onChange={value => {
            setData({
              ...data,
              description: value,
            })
          }}
        />
      </div>
    </>
  )
}

export default Detail
