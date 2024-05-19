import { useRef, memo, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { ImagePlus, Loader2 } from 'lucide-react'
import { readFileAsDataURL } from '@/utils/common'
import { isNull } from 'lodash-es'

interface Props {
  onChange: (imageDataList: string[]) => void
}

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  initialQuality: 1,
}

function ImageUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleFileUpload = async (files: FileList | null) => {
    if (isNull(files)) return false
    setLoading(true)
    const imageDataList: string[] = []
    for await (const file of files) {
      const compressedFile = await imageCompression(file, options)
      const imageData = await readFileAsDataURL(compressedFile)
      imageDataList.push(imageData)
    }
    props.onChange(imageDataList)
    setLoading(false)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
        multiple
        hidden
        onChange={(ev) => handleFileUpload(ev.target.files)}
      />
      {loading ? <Loader2 className="animate-spin" /> : <ImagePlus onClick={() => inputRef.current?.click()} />}
    </>
  )
}

export default memo(ImageUploader)
