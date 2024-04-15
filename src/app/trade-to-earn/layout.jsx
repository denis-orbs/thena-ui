export const metadata = {
  title: 'Trade To Earn',
  description: 'Trade To Earn Description',
  'Content-Security-Policy': 'upgrade-insecure-requests',
}

export default function TradeToEarnLayout({ children }) {
  return <main className='relative flex min-h-screen flex-col'>{children}</main>
}
