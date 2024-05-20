import { NextResponse, type NextRequest } from 'next/server'
import { checkToken, handleError } from '../utils'
import FileManager from '@/utils/FileManager'
import { ErrorType } from '@/constant/errors'
import { isNull } from 'lodash-es'

export const runtime = 'edge'

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com'
const mode = process.env.NEXT_PUBLIC_BUILD_MODE

export async function POST(req: NextRequest) {
  if (mode === 'export') return new NextResponse('Not available under static deployment')

  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')

  if (isNull(token) || !checkToken(token)) {
    return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
  }
  if (!geminiApiKey) {
    return NextResponse.json({ code: 50001, message: ErrorType.NoGeminiKey }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const fileManager = new FileManager({ apiKey: geminiApiKey, baseUrl: geminiApiBaseUrl })
    const result = await fileManager.uploadFile(formData)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
