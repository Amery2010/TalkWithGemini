import { useRef, memo } from 'react'
import { Paperclip } from 'lucide-react'
import { useSettingStore } from '@/store/setting'
import { useAttachmentStore } from '@/store/attachment'
import FileManager from '@/utils/FileManager'
import { encodeToken, encodeBase64 } from '@/utils/signature'
import { readFileAsDataURL } from '@/utils/common'
import mimeType from '@/constant/attachment'
import { isNull } from 'lodash-es'

function FileUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const settingStore = useSettingStore()

  const handleFileUpload = async (files: FileList | null) => {
    if (isNull(files)) return false
    const { apiKey, apiProxy, password } = settingStore
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
      formData.append('file', file)
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
      if (file.type.startsWith('image/')) {
        fileInfor.preview = await readFileAsDataURL(file)
      }
      addAttachment(fileInfor)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={mimeType.join(',')}
        multiple
        hidden
        onChange={(ev) => handleFileUpload(ev.target.files)}
      />
      <Paperclip onClick={() => inputRef.current?.click()} />
    </>
  )
}

export default memo(FileUploader)
