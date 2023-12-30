'use client'
import { useRef, useState, useMemo } from 'react'
import { EdgeSpeechTTS } from '@lobehub/tts'
import { useSpeechRecognition } from '@lobehub/tts/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import SiriWave from 'siriwave'
import { MessageCircleHeart, AudioLines, SendHorizontal, Mic, MessageSquareText, Settings2, Pause } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import MessageItem from '@/components/MessageItem'
import ErrorMessageItem from '@/components/ErrorMessageItem'
import { useMessageStore } from '@/store/chat'
import AudioStream from '@/utils/AudioStream'
import PromiseQueue from '@/utils/PromiseQueue'
import textStream from '@/utils/textStream'
import filterMarkdown from '@/utils/filterMarkdown'

export default function Home() {
  const siriWaveRef = useRef<HTMLDivElement>(null)
  const audioStreamRef = useRef<AudioStream>()
  const edgeSpeechRef = useRef<EdgeSpeechTTS>()
  const speechQueue = useRef<PromiseQueue>()
  const subtitleList = useRef<string[]>([])
  const { messages, addMessage, updateMessage } = useMessageStore()
  const speechRecognition = useSpeechRecognition('zh-CN')
  const [messageAutoAnimate] = useAutoAnimate()
  const [talkMode, setTalkMode] = useState<'chat' | 'voice'>('chat')
  const [siriWave, setSiriWave] = useState<SiriWave>()
  const [init, setInit] = useState<boolean>(false)
  const [content, setContent] = useState<string>('')
  const [subtitle, setSubtitle] = useState<string>('')
  const [speechSilence, setSpeechSilence] = useState<boolean>(false)
  const [status, setStatus] = useState<'thinkng' | 'silence' | 'talking'>('silence')
  const statusText = useMemo(() => {
    switch (status) {
      case 'silence':
      case 'talking':
        return ''
      case 'thinkng':
      default:
        return '正在思考'
    }
  }, [status])

  const speech = (content: string) => {
    if (content.length === 0) return
    speechQueue.current?.enqueue(
      () =>
        new Promise(async (resolve, reject) => {
          if (speechSilence) reject(false)
          const voice = await edgeSpeechRef.current?.create({
            input: content,
            options: { voice: 'zh-CN-XiaoxiaoNeural' },
          })
          if (voice) {
            const audio = await voice.arrayBuffer()
            setStatus('talking')
            siriWave?.setSpeed(0.05)
            siriWave?.setAmplitude(2)
            audioStreamRef.current?.play({
              audioData: audio,
              onStart: () => {
                const nextSubtitle = subtitleList.current.shift()
                if (nextSubtitle) setSubtitle(nextSubtitle)
              },
              onFinished: () => {
                setStatus('silence')
                setSubtitle('')
                siriWave?.setSpeed(0.04)
                siriWave?.setAmplitude(0.1)
              },
            })
            resolve(true)
          }
        }),
    )
  }

  const handleSubmit = async (text: string) => {
    initVoice()
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text }
    addMessage(newMessage)
    setStatus('thinkng')
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [...messages, newMessage],
      }),
    })
    if (response.status < 400 && response.body) {
      const newMessage: Message = { id: Date.now().toString(), role: 'model', content: '' }
      addMessage(newMessage)
      speechQueue.current = new PromiseQueue()
      subtitleList.current = []
      setSpeechSilence(false)
      await textStream(
        response.body,
        (content) => {
          updateMessage(content)
        },
        (statement) => {
          const text = filterMarkdown(statement)
          subtitleList.current.push(text)
          speech(text)
        },
      )
    } else {
      setStatus('silence')
      const errorMessage = await response.text()
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: `${response.status}: ${errorMessage}`,
        error: true,
      }
      addMessage(newMessage)
      setSubtitle(errorMessage)
    }
  }

  const updateTalkMode = (type: 'chat' | 'voice') => {
    setTalkMode(type)
    if (type === 'voice') {
      initVoice()
      setSiriWave(
        new SiriWave({
          container: siriWaveRef.current!,
          style: 'ios9',
          speed: 0.04,
          amplitude: 0.1,
          pixelDepth: 0.02,
          lerpSpeed: 0.01,
          width: window.innerWidth,
          height: window.innerHeight / 5,
        }),
      )
    } else {
      siriWave?.dispose()
    }
  }

  const handleRecorder = () => {
    if (speechRecognition.isRecording) {
      speechRecognition.stop()
      if (speechRecognition.text) handleSubmit(speechRecognition.text)
    } else {
      speechRecognition.start()
    }
  }

  const handleStopTalking = () => {
    setSpeechSilence(true)
    speechQueue.current?.empty()
    audioStreamRef.current?.stop()
  }

  const initVoice = () => {
    if (!init) {
      const audioStream = new AudioStream()
      audioStreamRef.current = audioStream
      const edgeSpeech = new EdgeSpeechTTS()
      edgeSpeechRef.current = edgeSpeech
      setInit(true)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-md flex-col justify-between pb-6 pt-10">
      <div className="my-6 flex justify-between p-4">
        <div className="flex flex-row text-xl leading-8">
          <MessageCircleHeart className="h-10 w-10 text-red-400" />
          <div className="ml-3 bg-gradient-to-r from-red-300 via-green-300 to-green-400 bg-clip-text font-bold leading-10 text-transparent">
            Talk With Gemini Pro
          </div>
        </div>
        <ThemeToggle />
      </div>
      <div ref={messageAutoAnimate} className="flex h-full flex-1 flex-col justify-start">
        {messages.slice(2).map((msg) => (
          <div
            className="flex gap-3 p-4 text-slate-500 transition-colors last:text-slate-800 hover:bg-[rgba(148,163,184,0.07)] hover:text-slate-800 dark:last:text-slate-400 dark:hover:text-slate-400"
            key={msg.id}
          >
            {!msg.error ? (
              <MessageItem role={msg.role} content={msg.content} />
            ) : (
              <ErrorMessageItem role={msg.role} content={msg.content} />
            )}
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-2 p-4">
        <Button title="语音对话模式" variant="secondary" size="icon" onClick={() => updateTalkMode('voice')}>
          <AudioLines />
        </Button>
        <Textarea
          className="min-h-10"
          rows={1}
          value={content}
          placeholder="请输入问题..."
          onChange={(ev) => setContent(ev.target.value)}
        />
        <Button title="发送" variant="secondary" size="icon" onClick={() => handleSubmit(content)}>
          <SendHorizontal />
        </Button>
      </div>
      <div style={{ display: talkMode === 'voice' ? 'block' : 'none' }}>
        <div className="fixed left-0 right-0 top-0 flex h-screen w-screen flex-col items-center justify-center bg-slate-900">
          <div className="h-1/5 w-full" ref={siriWaveRef}></div>
          <div className="absolute bottom-0 flex h-2/5 w-2/3 flex-col justify-between pb-12 text-center">
            <div className="text-sm leading-6">
              <div className="animate-pulse text-lg text-white">{statusText}</div>
              {speechRecognition.isRecording ? (
                <div className="text-center text-green-300">{speechRecognition.text}</div>
              ) : (
                <div className="text-center text-red-300">{subtitle}</div>
              )}
            </div>
            <div className="flex items-center justify-center pt-2">
              <Button
                className="h-10 w-10 rounded-full text-slate-700"
                title="聊天模式"
                variant="secondary"
                size="icon"
                onClick={() => updateTalkMode('chat')}
              >
                <MessageSquareText />
              </Button>
              {status === 'talking' ? (
                <Button
                  className="mx-6 h-14 w-14 rounded-full"
                  title="停止说话"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleStopTalking()}
                >
                  <Pause />
                </Button>
              ) : (
                <Button
                  className="mx-6 h-14 w-14 rounded-full font-mono"
                  title="开始录音"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRecorder()}
                >
                  {speechRecognition.isRecording ? speechRecognition.formattedTime : <Mic className="h-8 w-8" />}
                </Button>
              )}
              <Button
                className="h-10 w-10 rounded-full text-slate-700"
                title="聊天模式"
                variant="secondary"
                size="icon"
              >
                <Settings2 />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
