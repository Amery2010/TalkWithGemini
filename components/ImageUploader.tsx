import { useRef, memo, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { ImagePlus, Loader2 } from 'lucide-react'
import { isNull } from 'lodash-es'

interface Props {
  onChange: (imageDataList: string[]) => void
}

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.addEventListener('load', () => resolve(reader.result as string))
    reader.addEventListener('error', reject)
  })
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
      const imageData = await readFile(compressedFile)
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
