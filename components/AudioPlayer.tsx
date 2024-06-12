import { memo } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import useAudio from '@/hooks/useAudio'
import { formatTime } from '@/utils/common'
import { cn } from '@/utils'

type Props = {
  className?: string
  src: string
}

function AudioPlayer({ src, className }: Props) {
  const { playing, duration, current, toggle, onChange } = useAudio(src)

  return (
    <div className={cn('flex w-72 gap-2', className)}>
      <Button className="h-8 w-8 px-1.5 py-1.5" variant="ghost" onClick={() => toggle()}>
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <Slider
        className="audio-slider"
        value={[Math.ceil(current)]}
        max={Math.ceil(duration)}
        step={1}
        onValueChange={([current]) => onChange(current)}
      />
      <div className="font-mono text-sm leading-8">
        {duration > 0 ? `${formatTime(current)}/${formatTime(duration)}` : formatTime(current)}
      </div>
    </div>
  )
}

export default memo(AudioPlayer)
