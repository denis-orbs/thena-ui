function buildImageUrl(account, filename) {
  return `http://thena-s3.s3.eu-west-2.amazonaws.com/arena/content-studio/${account}/${encodeURIComponent(filename)}`
}

export async function generateMetadata({ params }) {
  const { account, filename } = params || {}
  const imageUrl = buildImageUrl(account, filename)

  const siteBase = 'https://thena.fi'
  const pageUrl = `${siteBase}/studio/${account}/${encodeURIComponent(filename)}`

  const title = `Content Studio • ${filename}`
  const description = ''

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    icons: {
      other: [{ rel: 'image_src', url: imageUrl }],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function Page({ params }) {
  const { account, filename } = params || {}
  const imageUrl = buildImageUrl(account, filename)
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} alt={filename} style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
}
