import type { Content } from '@google/generative-ai'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

declare global {
  interface Message extends Content {
    id: string
    attachments?: FileInfor[]
  }

  interface Setting {
    password: string
    apiKey: string
    apiProxy: string
    model: string
    lang: string
    sttLang: string
    ttsLang: string
    ttsVoice: string
    isProtected: boolean
    talkMode: 'chat' | 'voice'
    maxHistoryLength: number
    assistantIndexUrl: string
    uploadProxy: string
    topP: number
    topK: number
    temperature: number
    maxOutputTokens: number
    safety: string
    autoStopRecord: boolean
  }

  interface Assistant {
    author: string
    createAt: string
    homepage: string
    identifier: string
    meta: {
      avatar: string
      tags: string[]
      title: string
      description: string
    }
    schemaVersion: number
  }

  interface AssistantDetail extends Assistant {
    config: {
      systemRole: string
    }
  }

  type OpenAPIDocument<T extends {} = {}> = OpenAPIV3.Document<T> | OpenAPIV3_1.Document<T>

  type OpenAPIOperation<T extends {} = {}> = OpenAPIV3.OperationObject<T> | OpenAPIV3_1.OperationObject<T>

  type OpenAPIParameter =
    | OpenAPIV3_1.ReferenceObject
    | OpenAPIV3_1.ParameterObject
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.ParameterObject

  type OpenAPIParameters =
    | (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[]
    | (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]

  type OpenAPIRequestBody = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject

  interface PluginManifest {
    schemaVersion: 'v1'
    id: string
    title: string
    description: string
    systemRole: string
    auth: {
      type: 'none' | 'oauth' | 'service_http'
      clientUrl?: string
      scope?: string
      authorizationType?: string
      authorizationUrl?: string
      authorizationContentType?: string
      headers?: Record<string, string>
      verificationTokens?: {
        openai: string
      }
    }
    api: {
      type: 'openapi'
      url: string
    }
    logoUrl: string
    email: string
    legalInfoUrl: string
  }

  interface FileMetadata {
    name: string
    displayName?: string
    mimeType: string
    sizeBytes: string
    createTime: string
    updateTime: string
    expirationTime: string
    sha256Hash: string
    uri: string
    state: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED'
  }

  interface FileInfor {
    id: string
    name: string
    mimeType: string
    size: number
    preview?: string
    metadata?: FileMetadata
    status: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED'
  }

  interface GatewayParams<T = unknown> {
    [name: string]: T
  }

  interface GatewayPayload {
    baseUrl: string
    method: 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
    body?: GatewayParams
    formData?: GatewayParams<string>
    headers?: GatewayParams<string>
    path?: GatewayParams<string>
    query?: GatewayParams<string>
    cookie?: GatewayParams<string>
  }

  interface Model {
    name: string
    baseModelId: string
    version: string
    displayName: string
    description: string
    inputTokenLimit: number
    outputTokenLimit: number
    supportedGenerationMethods: string[]
    temperature: number
    maxTemperature: number
    topP: number
    topK: number
  }
}
