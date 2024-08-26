import React from 'react'

import Loading from '@/app/loading'

export default function VideoBanner({ src, width, height, className, videoRef }) {
  return src ? (
    <video
      ref={videoRef}
      className={className}
      width={width}
      height={height}
      loop
      autoPlay
      muted
      onError={() => console.error('Video failed to load')}
    >
      <source src={src} type='video/mp4' />
      Your browser does not support the video tag.
    </video>
  ) : (
    <Loading />
  )
}
