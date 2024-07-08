import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkToken } from '@/app/api/utils'
import { ErrorType } from '@/constant/errors'
import { isNull } from 'lodash-es'

const uploadLimit = Number(process.env.NEXT_PUBLIC_UPLOAD_LIMIT || '0')

const proxyRoutes = ['/api/google/upload/v1beta/files', '/api/upload/files']
const apiRoutes = ['/api/chat', '/api/upload']

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: '/api/:path*',
}

export function middleware(request: NextRequest) {
  for (const proxyRoute of proxyRoutes) {
    if (request.nextUrl.pathname.startsWith(proxyRoute)) {
      const contentLength = request.headers.get('Content-Length')
      if (uploadLimit !== 0 && Number(contentLength) > uploadLimit) {
        return NextResponse.json({ code: 413, success: false, message: 'Payload Too Large' }, { status: 413 })
      }
    }
  }
  for (const apiRoute of apiRoutes) {
    if (request.nextUrl.pathname.startsWith(apiRoute)) {
      const searchParams = request.nextUrl.searchParams
      const token = searchParams.get('token')
      if (isNull(token) || !checkToken(token)) {
        return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
      }
    }
  }
}
