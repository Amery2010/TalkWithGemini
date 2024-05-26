import imageCompression from 'browser-image-compression'
import FileManager, { type FileManagerOptions } from '@/utils/FileManager'
import FibonacciTimer from '@/utils/FibonacciTimer'
import { encodeBase64 } from '@/utils/signature'
import { isNull, isFunction } from 'lodash-es'

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

const inVercelOrNetlify = process.env.VERCEL === '1' || process.env.NETLIFY === 'true'

const compressionOptions = {
  maxSizeMB: 1,
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
  for await (const file of files) {
    const fileInfor: FileInfor = {
      id: encodeBase64(`${file.name}:${file.type}:${file.type}`),
      name: file.name,
      mimeType: file.type,
      size: file.size,
      status: 'PROCESSING',
    }
    const fileManager = new FileManager(fileManagerOptions)
    // const formData = new FormData()
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
    // Files smaller than 4MB are uploaded directly
    if (file.size <= 4194304 || !inVercelOrNetlify) {
      fileManager
        .uploadFile(uploadFile)
        .then((fileMetadata) => checkFileStatus(fileMetadata.file))
        .catch((err: string) => {
          if (isFunction(onError)) {
            fileInfor.status = 'FAILED'
            updateAttachment(fileInfor.id, fileInfor)
            onError(err)
          }
        })
    } else {
      fileManager
        .resumableUploadFile(uploadFile)
        .then((fileMetadata) => checkFileStatus(fileMetadata.file))
        .catch((err: string) => {
          if (isFunction(onError)) {
            fileInfor.status = 'FAILED'
            updateAttachment(fileInfor.id, fileInfor)
            onError(err)
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
