class Storage<State extends any> {
  private namespace: string

  constructor(namespace: string = '') {
    this.namespace = namespace
  }

  private addNamespace(key: string): string {
    return this.namespace ? this.namespace + '::' + key : key
  }

  public get<T extends State>(key: string): T | null {
    if (typeof window === 'undefined') return null
    const data = window.localStorage.getItem(this.addNamespace(key))
    return data ? (JSON.parse(data) as T) : null
  }

  public set<T extends State>(key: string, value: T): void {
    if (typeof window !== 'undefined') window.localStorage.setItem(this.addNamespace(key), JSON.stringify(value))
  }

  public remove(key: string): void {
    if (typeof window !== 'undefined') window.localStorage.removeItem(this.addNamespace(key))
  }

  public clear(): void {
    if (typeof window !== 'undefined') window.localStorage.clear()
  }

  public store<T extends State>(data: Record<string, T>): void {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        this.set(key, data[key])
      }
    }
  }
}

export default Storage
