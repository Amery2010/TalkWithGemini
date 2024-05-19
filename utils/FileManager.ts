export type FileManagerOptions = {
  apiKey?: string
  baseUrl?: string
  token?: string
}

const API_VERSION = 'v1beta'

class FileManager {
  options: FileManagerOptions
  constructor(options: FileManagerOptions) {
    if (!options.token && !options.apiKey) {
      throw new Error('Missing required parameters!')
    }
    this.options = options
  }
  async uploadFile(formData: FormData): Promise<{ file: FileMetadata }> {
    if (this.options.token) {
      const response = await fetch(`/api/upload?token=${this.options.token}`, {
        method: 'POST',
        body: formData,
      })
      return await response.json()
    } else {
      const response = await fetch(new URL(`/upload/${API_VERSION}/files`, this.options.baseUrl), {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.options.apiKey!,
        },
        body: formData,
      })
      return await response.json()
    }
  }
  async getFileMetadata(fileID: string) {
    if (this.options.token) {
      const response = await fetch(`/api/files?token=${this.options.token}&id=${fileID}`)
      return await response.json()
    } else {
      const response = await fetch(new URL(`/${API_VERSION}/files/${fileID}`, this.options.baseUrl), {
        method: 'GET',
        headers: {
          'x-goog-api-key': this.options.apiKey!,
        },
      })
      return await response.json()
    }
  }
}

export default FileManager
