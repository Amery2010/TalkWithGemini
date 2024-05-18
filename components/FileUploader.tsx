import { useState, useRef, memo } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import { useSettingStore } from '@/store/setting'
import FileManager, { type FileManagerOptions } from '@/utils/FileManager'
import { encodeToken } from '@/utils/signature'
import { isNull } from 'lodash-es'

type Props = {
  onChange: (fileMetadataList: Promise<FileMetadata>[]) => void
}

async function checkFileStatus(fileID: string, options: FileManagerOptions): Promise<'ACTIVE' | 'FAILED'> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const fileManager = new FileManager(options)
      const fileMetadata = await fileManager.getFileMetadata(fileID)
      if (fileMetadata.state === 'PROCESSING') {
        resolve(await checkFileStatus(fileID, options))
      } else if (fileMetadata.state === 'FAILED') {
        reject('FAILED')
      } else {
        resolve('ACTIVE')
      }
    }, 1000)
  })
}

function FileUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const settingStore = useSettingStore()
  const [loading, setLoading] = useState<boolean>(false)

  const handleFileUpload = async (files: FileList | null) => {
    if (isNull(files)) return false
    setLoading(true)
    const { apiKey, apiProxy, password } = settingStore
    const options = apiKey !== '' ? { apiKey, baseUrl: apiProxy } : { token: encodeToken(password) }
    const fileMetadataList: Promise<FileMetadata>[] = []
    for await (const file of files) {
      const fileManager = new FileManager(options)
      const formData = new FormData()
      formData.append('file', file)
      fileMetadataList.push(fileManager.uploadFile(formData))
    }
    const fileStatusList = await Promise.all(fileMetadataList)
    // for await (const fileStatus of fileStatusList) {
    //   if (fileStatus.state === 'PROCESSING') {
    //     const status = await checkFileStatus(fileStatus.name, options)
    //     if (status === 'ACTIVE') {
    //       // set active status
    //     } else {
    //       // set failed status
    //     }
    //   } else if (fileStatus.state === 'FAILED') {
    //     // set failed status
    //   } else {
    //     // set active status
    //   }
    // }
    props.onChange(fileMetadataList)
    setLoading(false)
  }

  return (
    <>
      <input ref={inputRef} type="file" multiple hidden onChange={(ev) => handleFileUpload(ev.target.files)} />
      {loading ? <Loader2 className="animate-spin" /> : <Paperclip onClick={() => inputRef.current?.click()} />}
    </>
  )
}

export default memo(FileUploader)
