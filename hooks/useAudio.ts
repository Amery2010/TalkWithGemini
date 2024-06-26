import { useState, useEffect, useCallback, useMemo } from 'react'

function useAudio(url: string) {
  const [playing, setPlaying] = useState<boolean>(false)
  const [duration, setDuration] = useState<number>(0)
  const [current, setCurrent] = useState<number>(0)
  const audio = useMemo(() => new Audio(url), [url])

  const toggle = useCallback(() => {
    if (!playing) {
      audio.play()
    }
    setPlaying(!playing)
  }, [audio, playing])

  const init = useCallback(async () => {
    audio.preload = 'auto'
  }, [audio])

  useEffect(() => {
    init()
    audio.addEventListener('ended', () => setPlaying(false))
    audio.addEventListener('loadeddata', () => {
      setDuration(audio.duration)
    })
    audio.addEventListener('timeupdate', () => {
      setCurrent(audio.currentTime)
    })
    return () => {
      audio.removeEventListener('ended', () => setPlaying(false))
      audio.removeEventListener('loadeddata', () => setDuration(0))
      audio.removeEventListener('timeupdate', () => setCurrent(0))
    }
  }, [audio, init])

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
