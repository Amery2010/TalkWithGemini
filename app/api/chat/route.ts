import { NextResponse, type NextRequest } from 'next/server'
import { handleError } from '../utils'

export const runtime = 'edge'
export const preferredRegion = ['cle1', 'iad1', 'pdx1', 'sfo1', 'sin1', 'syd1', 'hnd1', 'kix1']

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const model = searchParams.get('model')

  try {
    const response = await fetch(
      `${geminiApiBaseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}?alt=sse`,
      {
        method: req.method,
        headers: {
          'Content-Type': req.headers.get('Content-Type') || 'application/json',
          'x-goog-api-client': req.headers.get('x-goog-api-client') || 'genai-js/0.14.0',
          'x-goog-api-key': geminiApiKey,
        },
        body: req.body,
      },
    )
    return new NextResponse(response.body, response)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
