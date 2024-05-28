import imageCompression from 'browser-image-compression'
import FileManager, { type FileManagerOptions } from '@/utils/FileManager'
import FibonacciTimer from '@/utils/FibonacciTimer'
import { encodeBase64 } from '@/utils/signature'
import { formatSize } from '@/utils/common'
import { isNull, isFunction, isString } from 'lodash-es'

type fileUploadOptions = {
  files: FileList | File[] | null
  fileManagerOptions: FileManagerOptions
  addAttachment: (fileInfor: FileInfor) => void
  updateAttachment: (id: string, fileInfor: FileInfor) => void
  onError?: (error: string) => void
}

type imageUploadOptions = {
  files: FileList | File[] | null
  addAttachment: (fileInfor: FileInfor) => void
  updateAttachment: (id: string, fileInfor: FileInfor) => void
  onError?: (error: string) => void
}

const UPLOAD_SIZE_LIMIT = Number(process.env.NEXT_PUBLIC_UPLOAD_LIMIT || '0')

const compressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  initialQuality: 0.85,
}

export async function fileUpload({
  files,
  fileManagerOptions,
  addAttachment,
  updateAttachment,
  onError,
}: fileUploadOptions) {
  if (isNull(files)) return false
  if (fileManagerOptions.token === '' || fileManagerOptions.apiKey === '') return false

  for await (const file of files) {
    if (UPLOAD_SIZE_LIMIT > 0 && file.size > UPLOAD_SIZE_LIMIT) {
      const errorMessage = `File size larger than ${formatSize(UPLOAD_SIZE_LIMIT)} limit!`
      if (isFunction(onError)) onError(errorMessage)
      throw new Error(errorMessage)
    }
    const fileInfor: FileInfor = {
      id: encodeBase64(`${file.name}:${file.type}:${file.type}`),
      name: file.name,
      mimeType: file.type,
      size: file.size,
      status: 'PROCESSING',
    }
    let uploadFile: File
    if (file.type.startsWith('image/')) {
      const compressedFile = await imageCompression(file, compressionOptions)
      uploadFile = new File([compressedFile], file.name, { type: file.type })
      fileInfor.preview = await imageCompression.getDataUrlFromFile(uploadFile)
      fileInfor.size = uploadFile.size
    } else {
      uploadFile = file
    }
    addAttachment(fileInfor)

    const checkFileStatus = async (fileMeta: FileMetadata) => {
      if (fileMeta.state === 'PROCESSING') {
        const fibonacciTimer = new FibonacciTimer()
        const task = async () => {
          const fileManager = new FileManager(fileManagerOptions)
          const fileMetadata: FileMetadata = await fileManager.getFileMetadata(fileMeta.name.substring(6))
          if (fileMetadata.state !== 'PROCESSING') {
            fileInfor.status = fileMetadata.state
            fileInfor.metadata = fileMetadata
            updateAttachment(fileInfor.id, fileInfor)
            fibonacciTimer.stopTimer()
          }
        }
        fibonacciTimer.startTimer(task, 1000, 1)
      } else {
        fileInfor.status = fileMeta.state
        fileInfor.metadata = fileMeta
        updateAttachment(fileInfor.id, fileInfor)
      }
      return false
    }

    const fileManager = new FileManager(fileManagerOptions)
    // Files smaller than 4MB are uploaded directly
    if (file.size <= 4194304) {
      fileManager
        .uploadFile(uploadFile)
        .then((fileMetadata) => {
          if (fileMetadata.file) {
            checkFileStatus(fileMetadata.file)
          } else {
            throw new Error('File upload fail')
          }
        })
        .catch((err: string) => {
          if (isFunction(onError)) {
            fileInfor.status = 'FAILED'
            updateAttachment(fileInfor.id, fileInfor)
            onError(isString(err) ? err : 'File upload fail')
          }
        })
    } else {
      fileManager
        .resumableUploadFile(uploadFile)
        .then((fileMetadata) => {
          if (fileMetadata.file) {
            checkFileStatus(fileMetadata.file)
          } else {
            throw new Error('File upload fail')
          }
        })
        .catch((err: string) => {
          if (isFunction(onError)) {
            fileInfor.status = 'FAILED'
            updateAttachment(fileInfor.id, fileInfor)
            onError(isString(err) ? err : 'File upload fail')
          }
        })
    }
  }
}

export async function imageUpload({ files, addAttachment, updateAttachment, onError }: imageUploadOptions) {
  if (isNull(files)) return false
  for await (const file of files) {
    const fileInfor: FileInfor = {
      id: encodeBase64(`${file.name}:${file.type}:${file.type}`),
      name: file.name,
      mimeType: file.type,
      size: file.size,
      status: 'PROCESSING',
    }
    addAttachment(fileInfor)
    const compressedFile = await imageCompression(file, compressionOptions).catch((err: string) => {
      if (isFunction(onError)) {
        fileInfor.status = 'FAILED'
        updateAttachment(fileInfor.id, fileInfor)
        onError(err)
      }
    })
    if (compressedFile) {
      fileInfor.preview = await imageCompression.getDataUrlFromFile(compressedFile)
      fileInfor.size = compressedFile.size
      fileInfor.status = 'ACTIVE'
      updateAttachment(fileInfor.id, fileInfor)
    }
  }
}
