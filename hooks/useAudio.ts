import { useState, useEffect, useCallback } from 'react'

async function getAudioObjectURL(src: string): Promise<string> {
  const blob = await fetch(src).then((resp) => resp.blob())
  return URL.createObjectURL(blob)
}

function useAudio(url: string) {
  const [audio] = useState<HTMLAudioElement>(new Audio())
  const [playing, setPlaying] = useState<boolean>(false)
  const [duration, setDuration] = useState<number>(0)
  const [current, setCurrent] = useState<number>(0)

  const toggle = useCallback(() => {
    if (!playing) {
      audio.play()
    }
    setPlaying(!playing)
  }, [audio, playing])

  const init = useCallback(async () => {
    const audioObjectURL = await getAudioObjectURL(url)
    audio.src = audioObjectURL
    audio.preload = 'auto'
  }, [audio, url])

  useEffect(() => {
    playing ? audio.play() : audio.pause()
  }, [audio, playing])

  useEffect(() => {
    init()
    let audioDuration = 0
    audio.addEventListener('ended', () => setPlaying(false))
    audio.addEventListener('loadeddata', () => {
      if (audio.duration === Infinity) {
        // HACK: Set a duration longer than the audio to get the actual duration of the audio
        audio.currentTime = 1e1
      } else {
        setDuration(audio.duration)
        audioDuration = audio.duration
      }
    })
    audio.addEventListener('timeupdate', () => {
      if (audioDuration === 0) {
        audioDuration = audio.currentTime
        setDuration(audioDuration)
        setTimeout(() => {
          audio.currentTime = 0
          setCurrent(0)
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
