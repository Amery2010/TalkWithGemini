import { memo } from 'react'
import { File, FileImage, FileAudio2, FileVideo2, Loader2, X } from 'lucide-react'
import { formatSize } from '@/utils/common'
import { cn } from '@/utils'
import { isFunction } from 'lodash-es'

type Props = {
  fileList: FileInfor[]
  onRemove?: (id: string) => void
}

function FileCover({ file }: { file: FileInfor }) {
  if (file.mimeType.startsWith('image/')) {
    return file.preview ? (
      // eslint-disable-next-line
      <img className="block h-14 w-full rounded-sm object-cover" src={file.preview} alt="preview" />
    ) : (
      <FileImage className="m-1 h-12 w-12" />
    )
  } else if (file.mimeType.startsWith('audio/')) {
    return <FileAudio2 className="m-1 h-12 w-12" />
  } else if (file.mimeType.startsWith('video/')) {
    return <FileVideo2 className="m-1 h-12 w-12" />
  } else {
    return <File className="m-1 h-12 w-12" />
  }
}

function FileList({ fileList, onRemove }: Props) {
  return (
    <div className="grid w-full grid-cols-3 flex-wrap gap-1 max-md:grid-cols-2 max-[430px]:grid-cols-1">
      {fileList.map((file) => {
        return (
          <div
            className={cn(
              'flex rounded-md border p-1.5',
              file.status === 'FAILED' ? 'border-red-500 text-red-500' : '',
            )}
            key={file.id}
          >
            <div className="relative mr-1.5 h-14 w-1/3">
              {<FileCover file={file} />}
              {file.status === 'PROCESSING' ? <Loader2 className="absolute left-4 top-4 h-6 w-6 animate-spin" /> : null}
            </div>
            <div className="relative h-14 w-2/3 flex-auto pr-4 text-sm">
              <h4 className="text-line-clamp-2 font-medium leading-5">{file.name}</h4>
              <p>
                <small>{formatSize(file.size)}</small>
              </p>
              {isFunction(onRemove) ? (
                <X className="absolute -right-1 -top-0.5 h-5 w-5 cursor-pointer" onClick={() => onRemove(file.id)} />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default memo(FileList)
