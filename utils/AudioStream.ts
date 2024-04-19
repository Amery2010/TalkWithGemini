interface AudioOptions {
  audioData: ArrayBuffer
  text?: string
  onStart?: (text: string) => void
  onFinished?: () => void
}

class AudioStream {
  audioContext: AudioContext
  queue: AudioOptions[] = []
  audioBufferSources: AudioBufferSourceNode[] = []
  isPlaying: boolean = false
  constructor() {
    // 创建 AudioContext
    this.audioContext = new AudioContext()
  }
  public play(options: AudioOptions) {
    // 如果音频正在播放则进行缓存
    if (this.isPlaying) {
      this.queue.push(options)
      return false
    }

    // 创建新的 AudioBufferSourceNode
    const audioBufferSource = this.audioContext.createBufferSource()

    if (typeof options.onStart === 'function') options.onStart(options.text || '')

    // 解码音频数据为 AudioBuffer
    this.audioContext.decodeAudioData(options.audioData, (buffer: AudioBuffer) => {
      if (audioBufferSource) {
        // 设置 AudioBufferSourceNode 的音频数据
        audioBufferSource.buffer = buffer

        // 连接 AudioBufferSourceNode 到音频输出
        audioBufferSource.connect(this.audioContext.destination)

        // 播放音频
        audioBufferSource.start()
        this.isPlaying = true

        // 在音频播放结束时，执行回调函数以继续下一段音频流的播放
        audioBufferSource.addEventListener('ended', async () => {
          this.isPlaying = false
          const newOptions = this.queue.shift()
          // 在此处进行下一段音频流的处理和播放
          if (newOptions) {
            this.play(newOptions)
          } else {
            if (typeof options.onFinished === 'function') options.onFinished()
          }
        })
      }
    })

    this.audioBufferSources.push(audioBufferSource)
  }
  public stop() {
    this.queue = []
    this.audioBufferSources.forEach((audioBufferSource) => {
      audioBufferSource.disconnect()
      audioBufferSource.stop()
    })
    this.audioBufferSources = []
  }
}

export default AudioStream
