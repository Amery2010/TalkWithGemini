import { useRef, memo, useMemo } from 'react'
import { Paperclip, ImagePlus } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { useSettingStore } from '@/store/setting'
import { useAttachmentStore } from '@/store/attachment'
import FileManager from '@/utils/FileManager'
import { encodeToken, encodeBase64 } from '@/utils/signature'
import { readFileAsDataURL } from '@/utils/common'
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
  const attachmentRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const { apiKey, apiProxy, password, model } = useSettingStore()
  const isVisionModel = useMemo(() => {
    return [Model['Gemini Pro Vision'], Model['Gemini 1.0 Pro Vision']].includes(model as Model)
  }, [model])

  const handleFileUpload = async (files: FileList | null) => {
    if (isNull(files)) return false
    const options = apiKey !== '' ? { apiKey, baseUrl: apiProxy } : { token: encodeToken(password) }
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
      const formData = new FormData()
      if (file.type.startsWith('image/')) {
        const compressedFile = await imageCompression(file, compressionOptions)
        fileInfor.preview = await readFileAsDataURL(compressedFile)
        fileInfor.size = compressedFile.size
        formData.append('file', compressedFile)
      } else {
        formData.append('file', file)
      }
      addAttachment(fileInfor)
      fileManager.uploadFile(formData).then(async ({ file }) => {
        if (file.state === 'PROCESSING') {
          const timer = setInterval(async () => {
            const fileManager = new FileManager(options)
            const fileMetadata: FileMetadata = await fileManager.getFileMetadata(file.name.substring(6))
            if (fileMetadata.state === 'ACTIVE') {
              fileInfor.status = fileMetadata.state
              fileInfor.metadata = fileMetadata
              updateAttachment(fileInfor.id, fileInfor)
              clearInterval(timer)
            }
          }, 1000)
        } else {
          fileInfor.status = file.state
          fileInfor.metadata = file
          updateAttachment(fileInfor.id, fileInfor)
        }
        return false
      })
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
      fileInfor.preview = await readFileAsDataURL(compressedFile)
      fileInfor.size = compressedFile.size
      fileInfor.status = 'ACTIVE'
      updateAttachment(fileInfor.id, fileInfor)
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
