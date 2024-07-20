export interface OpenAIPluginManifest {
  schema_version: 'v1'
  name_for_model: string
  name_for_human: string
  description_for_model: string
  description_for_human: string
  auth: {
    type: 'none' | 'oauth' | 'service_http'
    instructions?: string
    client_url?: string
    scope?: string
    authorization_type?: string
    authorization_url?: string
    authorization_content_type?: string
    custom_auth_header?: Record<string, string>
    verification_tokens?: {
      openai: string
    }
  }
  api: {
    type: 'openapi'
    url: string
  }
  logo_url: string
  contact_email: string
  legal_info_url: string
}

export function convertOpenAIPluginToPluginSchema(manifest: OpenAIPluginManifest) {
  const authSetting: PluginManifest['auth'] = {
    type: manifest.auth.type,
  }

  if (manifest.auth.type === 'service_http') {
    authSetting.authorizationType = manifest.auth.authorization_type
    authSetting.verificationTokens = manifest.auth.verification_tokens
    if (manifest.auth.custom_auth_header) authSetting.headers = manifest.auth.custom_auth_header
  } else if (manifest.auth.type === 'oauth') {
    authSetting.clientUrl = manifest.auth.client_url
    authSetting.scope = manifest.auth.scope
    authSetting.authorizationUrl = manifest.auth.authorization_url
    authSetting.authorizationContentType = manifest.auth.authorization_content_type
    authSetting.verificationTokens = manifest.auth.verification_tokens
  }

  return {
    schemaVersion: manifest.schema_version,
    id: manifest.name_for_model,
    title: manifest.name_for_human,
    description: manifest.description_for_human,
    systemRole: manifest.description_for_model,
    auth: authSetting,
    api: manifest.api,
    logoUrl: manifest.logo_url,
    email: manifest.contact_email,
    legalInfoUrl: manifest.legal_info_url,
  }
}
