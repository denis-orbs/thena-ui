import { redirect } from 'next/navigation'

const DEFAULT_TEMPLATE = 'pool-apr'
export default function ContentStudioIndex() {
  const to = `/content-studio/${DEFAULT_TEMPLATE}`
  redirect(to)
}
