import { NextResponse, type NextRequest } from 'next/server'
import { handleError } from '../utils'
import { isBase64, base64ToBlob } from '@/utils/common'
import { isEmpty, entries, values, isString, isNull } from 'lodash-es'

export const runtime = 'edge'
export const preferredRegion = ['cle1', 'iad1', 'pdx1', 'sfo1', 'sin1', 'syd1', 'hnd1', 'kix1']

const mode = process.env.NEXT_PUBLIC_BUILD_MODE

export async function POST(req: NextRequest) {
  if (mode === 'export') return new NextResponse('Not available under static deployment')

  try {
    const {
      baseUrl,
      method = 'get',
      body = {},
      formData = {},
      headers = {},
      path = {},
      query = {},
      cookie = {},
    } = (await req.json()) as GatewayPayload
    let url = baseUrl
    let payload = null
    if (!isEmpty(formData)) {
      const newFormData = new FormData()
      for (const [name, value] of entries(formData)) {
        if (isBase64(value)) {
          newFormData.append(name, base64ToBlob(value))
        } else if (isString(value)) {
          newFormData.append(name, value)
        }
      }
      headers['Content-Type']
      payload = newFormData
    } else {
      payload = body
    }
    for (const [name, value] of entries(path)) {
      url.replaceAll(new RegExp(`{${name}}`), value)
    }
    const urlSchema = new URL(url)
    for (const [name, value] of entries(query)) {
      urlSchema.searchParams.append(name, value)
    }
    const config: RequestInit = { method }
    if (isNull(payload)) config.body = payload
    if (isEmpty(headers)) config.headers = headers
    if (isEmpty(cookie)) config.headers = { ...config.headers, Cookie: values(cookie).join('; ') }
    const response = await fetch(`${urlSchema.toString()}`, config)
    return new NextResponse(response.body, response)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
