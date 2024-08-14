import React from 'react'

export default function ProgressBar({ process, bgProcess = 'bg-[#35243D]', bgComplete = 'bg-custom-gradient' }) {
  return (
    <div className={`h-2 w-full rounded-full ${bgProcess}`}>
      <div className={`h-2 rounded-full ${bgComplete}`} style={{ width: process }} />
    </div>
  )
}
