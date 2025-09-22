import { redirect } from 'next/navigation'

const DEFAULT_TEMPLATE = 'pools-apr'
export default function ContentStudioIndex({ searchParams }) {
  const qs = new URLSearchParams(searchParams ?? {}).toString()
  const to = qs ? `/content-studio/${DEFAULT_TEMPLATE}?${qs}` : `/content-studio/${DEFAULT_TEMPLATE}`

  redirect(to)
}
