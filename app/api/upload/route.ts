import { NextResponse } from 'next/server'
import { checkToken, handleError } from '../utils'
import FileManager from '@/utils/FileManager'
import { ErrorType } from '@/constant/errors'
import { isNull } from 'lodash-es'

export const runtime = 'edge'

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
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
