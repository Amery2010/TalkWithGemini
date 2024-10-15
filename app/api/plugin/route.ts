import { NextResponse, type NextRequest } from 'next/server'
import OASNormalize from 'oas-normalize'
import { ErrorType } from '@/constant/errors'
import pluginStore from '@/constant/plugins'
import { type OpenAIPluginManifest } from '@/utils/tool'
import { handleError } from '../utils'
import { isNull, camelCase } from 'lodash-es'

export const preferredRegion = ['sfo1']

const mode = process.env.NEXT_PUBLIC_BUILD_MODE

export async function GET(req: NextRequest) {
  if (mode === 'export') return new NextResponse('Not available under static deployment')

  const searchParams = req.nextUrl.searchParams
  const id = searchParams.get('id')

  if (isNull(id)) {
    return NextResponse.json({ code: 40001, message: ErrorType.MissingParam }, { status: 400 })
  }

  try {
    const plugins: Record<string, OpenAIPluginManifest> = {}

    for (const manifest of pluginStore) {
      plugins[camelCase(manifest.name_for_model)] = manifest as OpenAIPluginManifest
    }
    const pluginManifest = plugins[id]
    if (pluginManifest) {
      if (pluginManifest.api?.type === 'openapi') {
        try {
          const oasNormalize = new OASNormalize(pluginManifest.api?.url)
          const openApiDocument = await oasNormalize.validate({ convertToLatest: true })
          return NextResponse.json(openApiDocument)
        } catch (err) {
          if (err instanceof Error) {
            return NextResponse.json({ code: 50001, message: err.message }, { status: 500 })
          }
        }
      } else {
        return NextResponse.json({ code: 50002, message: ErrorType.UnsupportedApiType }, { status: 500 })
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
