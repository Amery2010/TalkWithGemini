import { NextResponse, type NextRequest } from 'next/server'
import { checkToken, handleError } from '../utils'
import FileManager from '@/utils/FileManager'
import { ErrorType } from '@/constant/errors'
import { isNull } from 'lodash-es'

export const runtime = 'edge'
export const preferredRegion = ['cle1', 'iad1', 'pdx1', 'sfo1', 'sin1', 'syd1', 'hnd1', 'kix1']

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com'
const geminiUploadProxyUrl = process.env.GEMINI_UPLOAD_BASE_URL || 'https://generativelanguage.googleapis.com'

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')
  const uploadType = searchParams.get('uploadType')

  if (isNull(token) || !checkToken(token)) {
    return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
  }
  if (!geminiApiKey) {
    return NextResponse.json({ code: 50001, message: ErrorType.NoGeminiKey }, { status: 500 })
  }

  try {
    const fileManager = new FileManager({
      apiKey: geminiApiKey,
      baseUrl: geminiApiBaseUrl,
      uploadUrl: geminiUploadProxyUrl,
    })
    if (uploadType === 'resumable') {
      const { fileName, mimeType } = await req.json()
      const sessionUrl = await fileManager.createUploadSession(fileName, mimeType)
      if (isNull(sessionUrl)) {
        return NextResponse.json({ code: 50002, message: ErrorType.NoUploadURL }, { status: 500 })
      }
      const uploadUrl = new URL(sessionUrl)
      uploadUrl.protocol = req.nextUrl.protocol
      uploadUrl.host = req.nextUrl.host
      uploadUrl.pathname = '/api/google' + uploadUrl.pathname
      uploadUrl.searchParams.delete('key')
      const url = uploadUrl.toString()
      return NextResponse.json({ url }, { headers: { Location: url } })
    } else {
      const formData = await req.formData()
      const fileManager = new FileManager({
        apiKey: geminiApiKey,
        baseUrl: geminiApiBaseUrl,
        uploadUrl: geminiUploadProxyUrl,
      })
      const result = await fileManager.uploadFile(formData.get('file') as File)
      return NextResponse.json(result)
    }
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
