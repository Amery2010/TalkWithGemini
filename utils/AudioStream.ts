class AudioStream {
  audioContext: AudioContext
  audioBufferSource: AudioBufferSourceNode | null
  queue: ArrayBuffer[]
  isPlaying: boolean
  constructor() {
    // 创建 AudioContext
    this.audioContext = new AudioContext()
    this.audioBufferSource = null
    this.queue = []
    this.isPlaying = false
  }
  public play(audioData: ArrayBuffer, onFinished?: () => void) {
    // 如果音频正在播放则进行缓存
    if (this.isPlaying) {
      this.queue.push(audioData)
      return false
    }

    // 创建新的 AudioBufferSourceNode
    this.audioBufferSource = this.audioContext.createBufferSource()

    // 解码音频数据为 AudioBuffer
    this.audioContext.decodeAudioData(audioData, (buffer: AudioBuffer) => {
      if (this.audioBufferSource) {
        // 设置 AudioBufferSourceNode 的音频数据
        this.audioBufferSource.buffer = buffer

        // 连接 AudioBufferSourceNode 到音频输出
        this.audioBufferSource.connect(this.audioContext.destination)

        // 播放音频
        this.audioBufferSource.start()
        this.isPlaying = true

        // 在音频播放结束时，执行回调函数以继续下一段音频流的播放
        this.audioBufferSource.onended = async () => {
          this.isPlaying = false
          const data = this.queue.shift()
          // 在此处进行下一段音频流的处理和播放
          if (data) {
            setTimeout(() => {
              this.play(data, onFinished)
            }, 500)
          } else {
            if (typeof onFinished === 'function') onFinished()
          }
        }
      }
    })
  }
  public stop() {
    if (this.audioBufferSource) {
      this.audioBufferSource.stop()
      this.audioBufferSource.disconnect()
    }
  }
}

export default AudioStream
