import { useState, useEffect, useMemo } from 'react'

function useAudio(url: string) {
  const [playing, setPlaying] = useState<boolean>(false)
  const [duration, setDuration] = useState<number>(0)
  const [current, setCurrent] = useState<number>(0)
  const audio = useMemo(() => new Audio(url), [url])

  const toggle = () => {
    if (!playing) {
      audio.play()
    }
    setPlaying(!playing)
  }

  useEffect(() => {
    playing ? audio.play() : audio.pause()
  }, [audio, playing])

  useEffect(() => {
    let audioDuration = 0
    audio.muted = false
    audio.addEventListener('ended', () => setPlaying(false))
    audio.addEventListener('loadeddata', () => {
      if (audio.duration === Infinity) {
        // HACK: Set a duration longer than the audio to get the actual duration of the audio
        audio.currentTime = 1e1
      }
    })
    audio.addEventListener('timeupdate', () => {
      if (audioDuration === 0) {
        audioDuration = audio.currentTime
        setDuration(audioDuration)
        setTimeout(() => {
          audio.currentTime = 0
        }, 0)
      }
      setCurrent(audio.currentTime)
    })
    return () => {
      audioDuration = 0
      audio.removeEventListener('ended', () => setPlaying(false))
      audio.removeEventListener('loadeddata', () => setDuration(0))
      audio.removeEventListener('timeupdate', () => setCurrent(0))
    }
  }, [audio])

  return {
    playing,
    current,
    duration,
    toggle,
    onChange: (value: number) => {
      audio.currentTime = value
    },
  }
}

export default useAudio
