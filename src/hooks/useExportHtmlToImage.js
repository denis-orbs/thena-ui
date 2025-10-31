import html2canvas from 'html2canvas-pro'

export const useExportHtmlToImage = () => {
  const exportImage = async ({
    elementId,
    width = 1024,
    height = 576,
    backgroundColor = '#0B040D',
    fileName = 'fileName.jpg',
  }) => {
    const element = document.getElementById(elementId) || null

    if (element) {
      const canvas = await html2canvas(element, {
        width,
        height,
        scale: 1,
        allowTaint: true,
        useCORS: true,
        removeContainer: true,
        backgroundColor,
        onclone(clonedDoc) {
          clonedDoc.getElementById(elementId).style.display = 'block'
          clonedDoc.getElementById(elementId).style.width = `${width}px`
          clonedDoc.getElementById(elementId).style.height = `${height}px`
        },
      })
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], fileName, { type: 'image/jpeg' })
            resolve(file)
          } else {
            resolve(null)
          }
        }, 'image/jpeg')
      })
    }

    return null
  }

  return { exportImage }
}
