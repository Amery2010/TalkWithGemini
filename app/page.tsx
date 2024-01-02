'use client'
import { useRef, useState, useMemo, useLayoutEffect, KeyboardEvent, useEffect } from 'react'
import { EdgeSpeechTTS } from '@lobehub/tts'
import { useSpeechRecognition } from '@lobehub/tts/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import SiriWave from 'siriwave'
import { MessageCircleHeart, AudioLines, Mic, MessageSquareText, Settings, Pause } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import MessageItem from '@/components/MessageItem'
import ErrorMessageItem from '@/components/ErrorMessageItem'
import Setting from '@/components/Setting'
import { useMessageStore } from '@/store/chat'
import { useSettingStore } from '@/store/setting'
import * as request from '@/utils/request'
import AudioStream from '@/utils/AudioStream'
import PromiseQueue from '@/utils/PromiseQueue'
import filterMarkdown from '@/utils/filterMarkdown'
import textStream from '@/utils/textStream'
import { generateSignature, generateUTCTimestamp } from '@/utils/signature'

export default function Home() {
  const siriWaveRef = useRef<HTMLDivElement>(null)
  const audioStreamRef = useRef<AudioStream>()
  const edgeSpeechRef = useRef<EdgeSpeechTTS>()
  const speechQueue = useRef<PromiseQueue>()
  const subtitleList = useRef<string[]>([])
  const {
    messages,
    add: addMessage,
    update: updateMessage,
    save: saveMessages,
    init: initMessages,
    reset: resetMessages,
    revoke: revokeMessage,
  } = useMessageStore()
  const { password, apiKey, apiProxy, sttLang, ttsLang, ttsVoice, init: initSetting } = useSettingStore()
  const speechRecognition = useSpeechRecognition(sttLang)
  const [messageAutoAnimate] = useAutoAnimate()
  const [talkMode, setTalkMode] = useState<'chat' | 'voice'>('chat')
  const [siriWave, setSiriWave] = useState<SiriWave>()
  const [content, setContent] = useState<string>('')
  const [subtitle, setSubtitle] = useState<string>('')
  const [settingOpen, setSetingOpen] = useState<boolean>(false)
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
            options: { voice: ttsVoice },
          })
          if (voice) {
            const audio = await voice.arrayBuffer()
            setStatus('talking')
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
            siriWave?.setSpeed(isSafari ? 0.2 : 0.05)
            siriWave?.setAmplitude(isSafari ? 3 : 2)
            audioStreamRef.current?.play({
              audioData: audio,
              onStart: () => {
                const nextSubtitle = subtitleList.current.shift()
                if (nextSubtitle) setSubtitle(nextSubtitle)
              },
              onFinished: () => {
                setStatus('silence')
                setSubtitle('')
                saveMessages()
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
    if (talkMode === 'voice') {
      if (!audioStreamRef.current) {
        audioStreamRef.current = new AudioStream()
      }
      edgeSpeechRef.current = new EdgeSpeechTTS({ locale: ttsLang })
    }
    setContent('')
    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: text }
    addMessage(newUserMessage)
    setStatus('thinkng')
    if (apiKey !== '') {
      const config: request.RequestProps = {
        messages: [...messages, newUserMessage],
        key: apiKey,
      }
      if (apiProxy) config.baseUrl = apiProxy
      const response = await request.chat(config)
      if (typeof response !== 'string') {
        const newModelMessage: Message = { id: Date.now().toString(), role: 'model', content: '' }
        addMessage(newModelMessage)
        speechQueue.current = new PromiseQueue()
        subtitleList.current = []
        setSpeechSilence(false)
        const onStatement = (line: string) => {
          if (talkMode === 'voice') {
            const text = filterMarkdown(line)
            subtitleList.current.push(text)
            speech(text)
          }
        }

        const reg = /(?:\n\n|\r\r|\r\n\r\n)/
        let buffer = ''
        for await (const chunk of response) {
          const chunkText = chunk.text()
          updateMessage(chunkText)
          const lines = (buffer + chunkText).split(reg)
          buffer = lines.pop() || ''

          for (const line of lines) {
            onStatement(line)
          }
        }
        if (buffer.length > 0) {
          onStatement(buffer)
        }
        setStatus('silence')
        saveMessages()
      } else {
        const newModelMessage: Message = {
          id: Date.now().toString(),
          role: 'model',
          content: response,
          error: true,
        }
        setStatus('silence')
        addMessage(newModelMessage)
        setSubtitle(response)
      }
    } else {
      const utcTimestamp = generateUTCTimestamp()
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          t: utcTimestamp,
          sign: generateSignature(password, utcTimestamp),
        }),
      })
      if (response.status < 400 && response.body) {
        const newModelMessage: Message = { id: Date.now().toString(), role: 'model', content: '' }
        addMessage(newModelMessage)
        speechQueue.current = new PromiseQueue()
        subtitleList.current = []
        setSpeechSilence(false)
        await textStream(
          response.body,
          (content) => {
            updateMessage(content)
          },
          (statement) => {
            if (talkMode === 'voice') {
              const text = filterMarkdown(statement)
              subtitleList.current.push(text)
              speech(text)
            }
          },
        )
        setStatus('silence')
        saveMessages()
      } else {
        const errorMessage = await response.text()
        const newModelMessage: Message = {
          id: Date.now().toString(),
          role: 'model',
          content: `${response.status}: ${errorMessage}`,
          error: true,
        }
        setStatus('silence')
        addMessage(newModelMessage)
        setSubtitle(errorMessage)
      }
    }
  }

  const handleResubmit = async () => {
    const lastQuestion = messages[messages.length - 2].content
    revokeMessage()
    await handleSubmit(lastQuestion)
  }

  const handleCleanMessage = () => {
    resetMessages()
    saveMessages()
  }

  const updateTalkMode = (type: 'chat' | 'voice') => {
    setTalkMode(type)
    if (type === 'voice') {
      setSiriWave(
        new SiriWave({
          container: siriWaveRef.current!,
          style: 'ios9',
          speed: 0.04,
          amplitude: 0.1,
          width: window.innerWidth,
          height: window.innerHeight / 5,
        }),
      )
    } else {
      siriWave?.dispose()
    }
  }

  const handleRecorder = () => {
    if (!checkAccessStatus()) return false
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

  const handleKeyDown = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      if (!checkAccessStatus()) return false
      // 阻止默认的回车换行行为
      ev.preventDefault()
      handleSubmit(content)
    }
  }

  const checkAccessStatus = () => {
    if (password !== '' || apiKey !== '') {
      return true
    } else {
      setSetingOpen(true)
      return false
    }
  }

  useLayoutEffect(() => {
    initMessages()
    initSetting()
  }, [initMessages, initSetting])

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-md flex-col justify-between pt-6 max-sm:pt-0">
      <div className="mb-2 mt-6 flex justify-between p-4 max-sm:mt-2">
        <div className="flex flex-row text-xl leading-8">
          <MessageCircleHeart className="h-10 w-10 text-red-400" />
          <div className="ml-3 bg-gradient-to-r from-red-300 via-green-300 to-green-400 bg-clip-text font-bold leading-10 text-transparent">
            Talk With Gemini Pro
          </div>
        </div>
        <ThemeToggle />
      </div>
      <div ref={messageAutoAnimate} className="flex h-full flex-1 flex-col justify-start">
        {messages.slice(2).map((msg, idx) => (
          <div
            className="group text-slate-500 transition-colors last:text-slate-800 hover:text-slate-800 max-sm:hover:bg-transparent dark:last:text-slate-400 dark:hover:text-slate-400"
            key={msg.id}
          >
            <div className="flex gap-3 p-4 hover:bg-[rgba(148,163,184,0.07)]">
              {!msg.error ? (
                <MessageItem role={msg.role} content={msg.content} />
              ) : (
                <ErrorMessageItem role={msg.role} content={msg.content} />
              )}
            </div>
            {msg.role === 'model' && idx === messages.length - 3 ? (
              <div className="my-2 flex h-4 justify-center text-xs text-slate-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-slate-600">
                <span className="mx-2 cursor-pointer hover:text-slate-500" onClick={() => handleResubmit()}>
                  重新生成答案
                </span>
                <Separator orientation="vertical" />
                <span className="mx-2 cursor-pointer hover:text-slate-500" onClick={() => handleCleanMessage()}>
                  清空聊天内容
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex w-full max-w-screen-md gap-2 bg-[hsl(var(--background))] p-4 pb-8 max-sm:pb-4">
        <Button title="语音对话模式" variant="secondary" size="icon" onClick={() => updateTalkMode('voice')}>
          <AudioLines />
        </Button>
        <Textarea
          className="min-h-10"
          rows={1}
          value={content}
          placeholder="请输入问题..."
          onChange={(ev) => setContent(ev.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button title="设置" variant="secondary" size="icon" onClick={() => setSetingOpen(true)}>
          <Settings />
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
                title="设置"
                variant="secondary"
                size="icon"
                onClick={() => setSetingOpen(true)}
              >
                <Settings />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Setting open={settingOpen} onClose={() => setSetingOpen(false)} />
    </main>
  )
}
