import { useRef, useMemo, memo } from 'react'
import { Paperclip, ImagePlus } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { useToast } from '@/components/ui/use-toast'
import { useSettingStore } from '@/store/setting'
import { useAttachmentStore } from '@/store/attachment'
import FileManager, { type FileManagerOptions } from '@/utils/FileManager'
import FibonacciTimer from '@/utils/FibonacciTimer'
import { encodeToken, encodeBase64 } from '@/utils/signature'
import { Model } from '@/constant/model'
import mimeType, { imageMimeType } from '@/constant/attachment'
import { isNull } from 'lodash-es'

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  initialQuality: 0.85,
}

function FileUploader() {
  const { toast } = useToast()
  const attachmentRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const { apiKey, apiProxy, uploadProxy, password, model } = useSettingStore()
  const isVisionModel = useMemo(() => {
    return [Model['Gemini Pro Vision'], Model['Gemini 1.0 Pro Vision']].includes(model as Model)
  }, [model])

  const handleFileUpload = async (files: FileList | null) => {
    if (isNull(files)) return false
    const options: FileManagerOptions =
      apiKey !== ''
        ? { apiKey, baseUrl: apiProxy, uploadUrl: uploadProxy }
        : { token: encodeToken(password), uploadUrl: uploadProxy }
    const { add: addAttachment, update: updateAttachment } = useAttachmentStore.getState()

    for await (const file of files) {
      const fileInfor: FileInfor = {
        id: encodeBase64(`${file.name}:${file.type}:${file.type}`),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        status: 'PROCESSING',
      }
      const fileManager = new FileManager(options)
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
            const fileManager = new FileManager(options)
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
      // Files smaller than 8MB are uploaded directly
      if (file.size <= 4194304) {
        fileManager
          .uploadFile(uploadFile)
          .then((fileMetadata) => checkFileStatus(fileMetadata.file))
          .catch((err: string) => {
            toast({ description: err })
          })
      } else {
        fileManager
          .resumableUploadFile(uploadFile)
          .then((fileMetadata) => checkFileStatus(fileMetadata.file))
          .catch((err: string) => {
            toast({ description: err })
          })
      }
    }
    if (attachmentRef.current && attachmentRef.current.value) {
      attachmentRef.current.value = ''
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (isNull(files)) return false
    const { add: addAttachment, update: updateAttachment } = useAttachmentStore.getState()
    for await (const file of files) {
      const fileInfor: FileInfor = {
        id: encodeBase64(`${file.name}:${file.type}:${file.type}`),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        status: 'PROCESSING',
      }
      addAttachment(fileInfor)
      const compressedFile = await imageCompression(file, compressionOptions)
      fileInfor.preview = await imageCompression.getDataUrlFromFile(compressedFile)
      fileInfor.size = compressedFile.size
      fileInfor.status = 'ACTIVE'
      updateAttachment(fileInfor.id, fileInfor)
    }
    if (imageRef.current && imageRef.current.value) {
      imageRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={attachmentRef}
        type="file"
        accept={mimeType.join(',')}
        multiple
        hidden
        onChange={(ev) => handleFileUpload(ev.target.files)}
      />
      <input
        ref={imageRef}
        type="file"
        accept={imageMimeType.join(',')}
        multiple
        hidden
        onChange={(ev) => handleImageUpload(ev.target.files)}
      />
      {isVisionModel ? (
        <ImagePlus onClick={() => imageRef.current?.click()} />
      ) : (
        <Paperclip onClick={() => attachmentRef.current?.click()} />
      )}
    </>
  )
}

export default memo(FileUploader)
