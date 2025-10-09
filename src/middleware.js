import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  const { search } = request.nextUrl
  const urlSearchParams = new URLSearchParams(search)
  const params = Object.fromEntries(urlSearchParams.entries())
  Object.entries(params).forEach(([key, value]) => {
    response.cookies.set({
      name: key,
      value,
      expires: new Date().getTime() + 7 * 1000 * 60 * 60 * 24,
    })
  })
  return response
}

export const config = {
  matcher: '/arena/:path*',
}
