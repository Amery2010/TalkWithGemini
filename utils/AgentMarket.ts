const AGENTS_INDEX_URL = process.env.AGENTS_INDEX_URL

class AgentMarket {
  private readonly baseUrl: string
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || 'https://chat-agents.lobehub.com/'
  }
  getIndexUrl(lang: string = 'en') {
    if (lang.startsWith('zh')) return this.baseUrl + 'index.zh-CN.json'
    return this.baseUrl
  }
  getAgentUrl(identifier: string, lang: string = 'en') {
    if (lang.startsWith('zh')) return this.baseUrl + `${identifier}.zh-CN.json`
    return this.baseUrl + `${identifier}.json`
  }
}

export const agentMarket = new AgentMarket(AGENTS_INDEX_URL)
