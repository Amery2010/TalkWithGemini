export type FileManagerOptions = {
  apiKey?: string
  baseUrl?: string
  uploadUrl?: string
  token?: string
}

class FileManager {
  options: FileManagerOptions
  uploadUrl: string
  constructor(options: FileManagerOptions) {
    if (!options.token && !options.apiKey) {
      throw new Error('Missing required parameters!')
    }
    this.options = options
    this.uploadUrl = this.options.uploadUrl || 'https://generativelanguage.googleapis.com'
  }
  async createUploadSession(fileName: string, mimeType: string) {
    const res = await fetch(
      this.options.token
        ? `/api/upload?uploadType=resumable&token=${this.options.token}`
        : `${this.uploadUrl}/upload/v1beta/files?uploadType=resumable&key=${this.options.apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify({
          file: {
            displayName: fileName,
            mimeType,
          },
        }),
      },
    )

    const uploadUrl = res.headers.get('Location')
    return uploadUrl
  }
  async resumableUploadFile(file: File): Promise<{ file: FileMetadata }> {
    return new Promise(async (resolve, reject) => {
      // The size of each chunk, the api has a minimum fragment size limit of 8MB for multipart upload files.
      const chunkSize = 8388608
      let currentChunk = 0

      const checkUploadStatus = async (uploadUrl: string) => {
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            'Content-Range': `bytes */${file.size}`,
          },
        })
        if (res.status === 308) {
          const startByte = res.headers.get('Range')?.split('-')[1]
          return startByte ? Number(startByte) + 1 : 0
        } else {
          return 0
        }
      }

      const uploadChunk = async (uploadUrl: string, startByte: number, endByte: number) => {
        const chunk = file.slice(startByte, endByte + 1)

        return await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Range': `bytes ${startByte}-${endByte}/${file.size}`,
          },
          body: chunk,
        })
      }

      const uploadFile = async (uploadUrl: string, startByte = 0) => {
        const fileSize = file.size
        if (startByte === 0) {
          startByte = currentChunk * chunkSize
        }
        let endByte = Math.min(startByte + chunkSize - 1, fileSize - 1)

        const result = await uploadChunk(uploadUrl, startByte, endByte)

        if (result.status >= 400) {
          return reject('File upload failed')
        }

        if (startByte === 0) currentChunk++

        if (endByte < fileSize - 1) {
          uploadFile(uploadUrl)
        } else {
          return resolve(await result.json())
        }
      }

      let uploadUrl = await this.createUploadSession(file.name, file.type)
      if (uploadUrl) {
        uploadUrl = this.uploadUrl
          ? uploadUrl?.replace('https://generativelanguage.googleapis.com', this.uploadUrl)
          : uploadUrl
        // const uploadedByte = await checkUploadStatus(uploadUrl)
        uploadFile(uploadUrl)
      } else {
        reject('Unable to get the upload link, please check whether the upload proxy allows CORS.')
      }
    })
  }
  async uploadFile(file: File): Promise<{ file: FileMetadata }> {
    const generateBoundary = () => {
      let str = ''
      for (let i = 0; i < 2; i++) {
        str = str + Math.random().toString().slice(2)
      }
      return str
    }
    const boundary = generateBoundary()
    // Multipart formatting code taken from @firebase/storage
    const metadataString = JSON.stringify({
      file: {
        mimeType: file.type,
        displayName: file.name,
      },
    })
    const preBlobPart =
      '--' +
      boundary +
      '\r\n' +
      'Content-Type: application/json; charset=utf-8\r\n\r\n' +
      metadataString +
      '\r\n--' +
      boundary +
      '\r\n' +
      'Content-Type: ' +
      file.type +
      '\r\n\r\n'
    const postBlobPart = '\r\n--' + boundary + '--'
    const blob = new Blob([preBlobPart, file, postBlobPart])
    const response = await fetch(
      `${this.options.token ? '/api/google' : this.uploadUrl}/upload/v1beta/files?uploadType=multipart&key=${this.options.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: blob,
      },
    )
    return await response.json()
  }
  async getFileMetadata(fileID: string) {
    const response = await fetch(
      `${this.options.token ? '/api/google' : this.uploadUrl}/v1beta/files/${fileID}?key=${this.options.apiKey}`,
      {
        method: 'GET',
      },
    )
    return await response.json()
  }
}

export default FileManager
