import { encodeToken } from './signature'

type Options = {
  apiKey: string
  apiProxy: string
  password: string
}

function filterModel(models: Model[]) {
  return models.filter((model) => model.name.startsWith('models/gemini-'))
}

export async function fetchModels(options: Options) {
  if (options.apiKey === '') {
    const token = encodeToken(options.password)
    const response = await fetch(`/api/models?token=${token}`)
    const { models } = await response.json()
    return filterModel(models)
  } else {
    const response = await fetch(`${options.apiProxy}/v1beta/models?key=${options.apiKey}`)
    const { models } = await response.json()
    return filterModel(models)
  }
}
