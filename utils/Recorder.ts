type RecorderConfig = {
  volumeThreshold?: number
  silenceThreshold?: number
  onFinish?: (audioData: Blob) => void
  onError?: (err: Error) => void
}

class Recorder {
  protected audioContext: AudioContext
  protected volumeThreshold: number = 30
  protected silenceThreshold: number = 2000
  protected isSilence: boolean = true
  onFinish?: (audioData: Blob) => void
  onError?: (err: Error) => void
  constructor(config: RecorderConfig) {
    this.audioContext = new AudioContext()
    // 设置音量阈值
    if (config.volumeThreshold) this.volumeThreshold = config.volumeThreshold
    // 设置静音持续时间阈值（单位：毫秒）
    if (config.silenceThreshold) this.silenceThreshold = config.silenceThreshold
    if (typeof config.onFinish === 'function') {
      this.onFinish = config.onFinish
    }
    if (typeof config.onError === 'function') {
      this.onError = config.onError
    }
  }
  public start() {
    // 获取麦克风音频流
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.recording(stream)
      })
      .catch((error: Error) => {
        if (typeof this.onError === 'function') this.onError(error)
      })
  }
  protected recording(stream: MediaStream) {
    const chunks: Blob[] = []
    const isSafariMediaRecorderType = MediaRecorder.isTypeSupported('audio/mp4')

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: isSafariMediaRecorderType ? 'audio/mp4' : 'audio/webm',
    })

    // 创建音频源节点
    const microphone = this.audioContext.createMediaStreamSource(stream)
    // 创建音频分析器节点
    const analyser = this.audioContext.createAnalyser()
    // 设置分析器的参数
    analyser.fftSize = 256
    // 将麦克风连接到分析器
    microphone.connect(analyser)

    // 监听录音数据可用事件，将数据发送到服务器
    mediaRecorder.addEventListener('dataavailable', (ev) => {
      if (ev.data.size > 0) {
        chunks.push(ev.data)
      }
    })
    mediaRecorder.addEventListener('pause', (ev) => {
      if (typeof this.onFinish === 'function') {
        this.onFinish(new Blob(chunks))
      }
    })

    const stopRecord = () => {
      mediaRecorder.pause()
      // stream.getTracks().forEach((track) => track.stop())
    }

    let isSpeaking: boolean = false
    let silenceTimer: any = null

    // 开始实时分析音频流
    const processAudio = () => {
      // 获取频谱数据
      const bufferLength = analyser.frequencyBinCount
      const frequencyData = new Uint8Array(bufferLength)
      analyser.getByteFrequencyData(frequencyData)

      // 计算音量
      const volume = getVolumeFromFrequencyData(frequencyData, bufferLength)

      if (volume > this.volumeThreshold) {
        // 声音超过阈值，判断为发言开始
        if (!isSpeaking) {
          isSpeaking = true
          console.log('发言开始')
          if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume()
          } else {
            mediaRecorder.start(1000)
          }
        }

        // 重置静音计时器
        clearTimeout(silenceTimer)
        silenceTimer = null
      } else {
        // 声音低于阈值，判断为发言结束
        if (isSpeaking && !silenceTimer) {
          silenceTimer = setTimeout(() => {
            isSpeaking = false
            console.log('发言结束')
            stopRecord()
            cancelAnimationFrame(requestID)
            this.isSilence = true
          }, this.silenceThreshold)
        }
      }

      // 循环处理音频流
      const requestID = requestAnimationFrame(() => {
        if (this.isSilence) {
          stopRecord()
          cancelAnimationFrame(requestID)
        } else {
          processAudio()
        }
      })
    }

    // 辅助函数：从频谱数据计算音量
    const getVolumeFromFrequencyData = (frequencyData: Uint8Array, bufferLength: number) => {
      const sum = frequencyData.reduce((acc, value) => acc + value, 0)
      const average = sum / bufferLength
      return average
    }

    // 开始处理音频流
    this.isSilence = false
    processAudio()
  }
  public stop() {
    this.isSilence = true
  }
}

export default Recorder
