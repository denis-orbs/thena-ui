import html2canvas from 'html2canvas'
import { useTranslations } from 'next-intl'

import { PrimaryButton } from '@/components/buttons/Button'
import { DownloadIcon } from '@/svgs'

export default function DownloadButton() {
  const t = useTranslations()

  const handleRender = async () => {
    const originShare = document.querySelector('#share-origin') || null
    if (originShare) {
      const canvas = await html2canvas(originShare, {
        width: 1024,
        height: 576,
        scale: 1,
        allowTaint: true,
        useCORS: true,
        removeContainer: true,
        backgroundColor: '#0B040D',
        onclone(clonedDoc) {
          clonedDoc.getElementById('share-origin').style.display = 'block'
          clonedDoc.getElementById('share-origin').style.width = '1024px'
          clonedDoc.getElementById('share-origin').style.width = '576px'
        },
      })

      canvas.toBlob(blob => {
        const tempLink = document.createElement('a')
        tempLink.download = 'profile.png'
        tempLink.href = URL.createObjectURL(blob)
        tempLink.click()
      })
    }
  }

  return (
    <PrimaryButton onClick={handleRender} className='mb-3 mt-5'>
      <DownloadIcon className='mr-2 h-4 w-4' />
      {t('Download image')}
    </PrimaryButton>
  )
}
