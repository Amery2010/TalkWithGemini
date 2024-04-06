'use client'
import { useRef, useState, useMemo, KeyboardEvent, useEffect, useCallback, useLayoutEffect } from 'react'
import { EdgeSpeechTTS } from '@lobehub/tts'
import { useSpeechRecognition } from '@lobehub/tts/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import SiriWave from 'siriwave'
import {
  MessageCircleHeart,
  AudioLines,
  Mic,
  MessageSquareText,
  Settings,
  Pause,
  PackageOpen,
  SendHorizontal,
  Github,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ThemeToggle from '@/components/ThemeToggle'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import MessageItem from '@/components/MessageItem'
import ErrorMessageItem from '@/components/ErrorMessageItem'
import Setting from '@/components/Setting'
import Topic from '@/components/Topic'
import Button from '@/components/Button'
import ImageUploader from '@/components/ImageUploader'
import { useMessageStore } from '@/store/chat'
import { useSettingStore } from '@/store/setting'
import chat, { type RequestProps } from '@/utils/chat'
import AudioStream from '@/utils/AudioStream'
import PromiseQueue from '@/utils/PromiseQueue'
import filterMarkdown from '@/utils/filterMarkdown'
import textStream from '@/utils/textStream'
import { generateSignature, generateUTCTimestamp } from '@/utils/signature'
import { shuffleArray } from '@/utils/common'
import topics from '@/constant/topics'
import { customAlphabet } from 'nanoid'
import { findLast, findIndex } from 'lodash-es'

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8)

export default function Home() {
  const { t } = useTranslation()
  const siriWaveRef = useRef<HTMLDivElement>(null)
  const scrollAreaBottomRef = useRef<HTMLDivElement>(null)
  const audioStreamRef = useRef<AudioStream>()
  const edgeSpeechRef = useRef<EdgeSpeechTTS>()
  const speechQueue = useRef<PromiseQueue>()
  const subtitleList = useRef<string[]>([])
  const messageStore = useMessageStore()
  const settingStore = useSettingStore()
  const speechRecognition = useSpeechRecognition(settingStore.sttLang)
  const [messageAutoAnimate] = useAutoAnimate()
  const [textareaHeight, setTextareaHeight] = useState<number>(40)
  const [randomTopic, setRandomTopic] = useState<Topic[]>([])
  const [siriWave, setSiriWave] = useState<SiriWave>()
  const [content, setContent] = useState<string>('')
  const [subtitle, setSubtitle] = useState<string>('')
  const [settingOpen, setSetingOpen] = useState<boolean>(false)
  const [topicOpen, setTopicOpen] = useState<boolean>(false)
  const [speechSilence, setSpeechSilence] = useState<boolean>(false)
  const [status, setStatus] = useState<'thinkng' | 'silence' | 'talking'>('silence')
  const statusText = useMemo(() => {
    switch (status) {
      case 'silence':
      case 'talking':
        return ''
      case 'thinkng':
      default:
        return t('status.thinking')
    }
  }, [status, t])

  const speech = (content: string) => {
    if (content.length === 0) return
    speechQueue.current?.enqueue(
      () =>
        new Promise(async (resolve, reject) => {
          if (speechSilence) reject(false)
          const voice = await edgeSpeechRef.current?.create({
            input: content,
            options: { voice: settingStore.ttsVoice },
          })
          if (voice) {
            const audio = await voice.arrayBuffer()
            setStatus('talking')
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
            siriWave?.setSpeed(isSafari ? 0.1 : 0.05)
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
                messageStore.save()
                siriWave?.setSpeed(0.04)
                siriWave?.setAmplitude(0.1)
              },
            })
            resolve(true)
          }
        }),
    )
  }

  const handleError = async (id: string, message: string, code?: number) => {
    const newModelMessage: Message = {
      id: nanoid(),
      role: 'model',
      content: code ? `${code}: ${message}` : message,
      error: true,
    }
    setStatus('silence')
    messageStore.replace(id, newModelMessage)
    setSubtitle(message)
  }

  const handleSubmit = async (text: string) => {
    setContent('')
    const newUserMessage: Message = { id: nanoid(), role: 'user', content: text }
    messageStore.add(newUserMessage)
    setStatus('thinkng')
    const newModelMessage: Message = { id: nanoid(), role: 'model', content: '' }
    messageStore.add(newModelMessage)
    const handleResponse = async (data: ReadableStream) => {
      speechQueue.current = new PromiseQueue()
      subtitleList.current = []
      setSpeechSilence(false)
      await textStream({
        readable: data,
        locale: settingStore.lang,
        onMessage: (content) => {
          messageStore.update(newModelMessage.id, content)
          scrollToBottom()
        },
        onStatement: (statement) => {
          if (settingStore.talkMode === 'voice') {
            const text = filterMarkdown(statement)
            subtitleList.current.push(text)
            speech(text)
          }
        },
        onFinish: () => {
          scrollToBottom()
          setStatus('silence')
          messageStore.save()
        },
      })
    }
    const model =
      findIndex(messageStore.messages, (item) => item.type === 'image') !== -1 ? 'gemini-pro-vision' : 'gemini-pro'
    const { messages } = useMessageStore.getState()
    if (settingStore.apiKey !== '') {
      const config: RequestProps = {
        messages: messages.slice(0, -1),
        apiKey: settingStore.apiKey,
        model,
      }
      if (settingStore.apiProxy) config.baseUrl = settingStore.apiProxy
      try {
        const result = await chat(config)
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const chunkText = chunk.text()
                controller.enqueue(encoder.encode(chunkText))
              }
            } catch (error) {
              if (error instanceof Error) {
                handleError(newModelMessage.id, error.message)
              }
            }
            controller.close()
          },
        })
        handleResponse(readableStream)
      } catch (error) {
        if (error instanceof Error) handleError(newModelMessage.id, error.message)
      }
    } else {
      const utcTimestamp = generateUTCTimestamp()
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.slice(0, -1),
          model,
          ts: utcTimestamp,
          sign: generateSignature(settingStore.password, utcTimestamp),
        }),
      })
      if (response.status < 400 && response.body) {
        handleResponse(response.body)
      } else {
        const errorMessage = await response.text()
        handleError(newModelMessage.id, errorMessage, response.status)
      }
    }
  }

  const handleResubmit = async () => {
    const lastQuestion = findLast(messageStore.messages, { role: 'user' })
    if (lastQuestion) {
      const { id, content } = lastQuestion
      messageStore.revoke(id)
      await handleSubmit(content)
    }
  }

  const handleCleanMessage = () => {
    messageStore.clear()
  }

  const updateTalkMode = (type: 'chat' | 'voice') => {
    settingStore.setTalkMode(type)
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
    setStatus('silence')
  }

  const handleKeyDown = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      if (!checkAccessStatus()) return false
      // Prevent the default carriage return and line feed behavior
      ev.preventDefault()
      handleSubmit(content)
    }
  }

  const handleImageUpload = (imageDataList: string[]) => {
    imageDataList.forEach((imageData) => {
      messageStore.add({ id: nanoid(), role: 'user', content: imageData, type: 'image' })
    })
  }

  const checkAccessStatus = () => {
    if (settingStore.password !== '' || settingStore.apiKey !== '') {
      return true
    } else {
      setSetingOpen(true)
      return false
    }
  }

  const initTopic = (topic: Topic) => {
    messageStore.clear()
    topic.parts.forEach((part) => {
      messageStore.add({ id: nanoid(), ...part })
    })
  }

  const scrollToBottom = useCallback(() => {
    scrollAreaBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (messageStore.messages.length === 0) {
      const langType = settingStore.lang.split('-')[0] === 'zh' ? 'zh' : 'en'
      setRandomTopic(shuffleArray<Topic>(topics[langType]).slice(0, 3))
    }
  }, [messageStore.messages, settingStore.lang])

  useEffect(() => {
    requestAnimationFrame(scrollToBottom)
  }, [messageStore.messages.length, scrollToBottom])

  useEffect(() => {
    if (settingStore.talkMode === 'voice') {
      audioStreamRef.current = new AudioStream()
      edgeSpeechRef.current = new EdgeSpeechTTS({ locale: settingStore.ttsLang })
    }
  }, [settingStore.talkMode, settingStore.ttsLang])

  useLayoutEffect(() => {
    const instance = new SiriWave({
      container: siriWaveRef.current!,
      style: 'ios9',
      speed: 0.04,
      amplitude: 0.1,
      width: window.innerWidth,
      height: window.innerHeight / 5,
    })
    setSiriWave(instance)
    return () => {
      instance.dispose()
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-full max-w-screen-md flex-col justify-between pb-20 pt-6 max-sm:pb-16 max-sm:pt-0 landscape:max-md:pt-0">
      <div className="mb-2 mt-6 flex justify-between p-4 max-sm:mt-2 landscape:max-md:mt-0">
        <div className="flex flex-row text-xl leading-8 text-red-400">
          <MessageCircleHeart className="h-10 w-10" />
          <div className="ml-3 font-bold leading-10">{t('title')}</div>
        </div>
        <div className="flex items-center gap-1">
          {GITHUB_URL ? (
            <Button title={t('github')} variant="ghost" size="icon" className="h-8 w-8">
              <Github className="h-5 w-5" onClick={() => window.open(GITHUB_URL)} />
            </Button>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
      {messageStore.messages.length === 0 && content === '' ? (
        <div className="relative flex min-h-full grow items-center justify-center text-sm">
          <div className="relative -top-8 text-center text-sm">
            <PackageOpen
              className="mx-auto h-32 w-32 text-gray-300 landscape:max-md:h-16 landscape:max-md:w-16 dark:text-gray-700"
              strokeWidth="1"
            />
            <p className="my-2 text-gray-300 dark:text-gray-700">{t('chatEmpty')}</p>
            <p className="text-gray-600">{t('selectTopicTip')}</p>
          </div>
          <div className="absolute bottom-2 flex text-gray-600">
            {randomTopic.map((topic) => {
              return (
                <div
                  key={topic.id}
                  className="mx-1 cursor-pointer overflow-hidden text-ellipsis text-nowrap rounded-md border px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900"
                  onClick={() => initTopic(topic)}
                >
                  {topic.title}
                </div>
              )
            })}
            <div
              className="mx-1 cursor-pointer rounded-md p-1 text-center underline underline-offset-4"
              onClick={() => setTopicOpen(true)}
            >
              {t('more')}
            </div>
          </div>
        </div>
      ) : (
        <div ref={messageAutoAnimate} className="flex min-h-full flex-1 grow flex-col justify-start">
          {messageStore.messages.map((msg, idx) => (
            <div
              className="group text-slate-500 transition-colors last:text-slate-800 hover:text-slate-800 max-sm:hover:bg-transparent dark:last:text-slate-400 dark:hover:text-slate-400"
              key={msg.id}
            >
              <div className="flex gap-3 p-4 hover:bg-gray-50/80 dark:hover:bg-gray-900/80">
                {!msg.error ? <MessageItem {...msg} isLoading={msg.content === ''} /> : <ErrorMessageItem {...msg} />}
              </div>
              {msg.role === 'model' && idx === messageStore.messages.length - 1 ? (
                <div className="my-2 flex h-4 justify-center text-xs text-slate-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-slate-600">
                  <span className="mx-2 cursor-pointer hover:text-slate-500" onClick={() => handleResubmit()}>
                    {t('regenerateAnswer')}
                  </span>
                  <Separator orientation="vertical" />
                  <span className="mx-2 cursor-pointer hover:text-slate-500" onClick={() => setTopicOpen(true)}>
                    {t('changeTopic')}
                  </span>
                  <Separator orientation="vertical" />
                  <span className="mx-2 cursor-pointer hover:text-slate-500" onClick={() => handleCleanMessage()}>
                    {t('clearChatContent')}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
          {content !== '' ? (
            <div className="group text-slate-500 transition-colors last:text-slate-800 hover:text-slate-800 max-sm:hover:bg-transparent dark:last:text-slate-400 dark:hover:text-slate-400">
              <div className="flex gap-3 p-4 hover:bg-gray-50/80 dark:hover:bg-gray-900/80">
                <MessageItem id="tmp" role="user" content={content} />
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div ref={scrollAreaBottomRef}></div>
      <div className="fixed bottom-0 flex w-full max-w-screen-md items-end gap-2 bg-[hsl(var(--background))] p-4 pb-8 max-sm:pb-4 landscape:max-md:pb-4">
        <Button title={t('voiceMode')} variant="secondary" size="icon" onClick={() => updateTalkMode('voice')}>
          <AudioLines />
        </Button>
        <div className="relative w-full">
          <Textarea
            className="max-h-[120px] min-h-10 px-2 pr-16"
            style={{ height: `${textareaHeight}px` }}
            value={content}
            placeholder={t('askAQuestion')}
            onChange={(ev) => {
              setContent(ev.target.value)
              setTextareaHeight(ev.target.scrollHeight)
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute bottom-1 right-1 flex">
            <div className="box-border flex h-8 w-8 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-800">
              <ImageUploader onChange={handleImageUpload} />
            </div>
            <div
              className="box-border flex h-8 w-8 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-800"
              onClick={() => handleSubmit(content)}
            >
              <SendHorizontal />
            </div>
          </div>
        </div>
        <Button title={t('setting')} variant="secondary" size="icon" onClick={() => setSetingOpen(true)}>
          <Settings />
        </Button>
      </div>
      <div style={{ display: settingStore.talkMode === 'voice' ? 'block' : 'none' }}>
        <div className="fixed left-0 right-0 top-0 flex h-full w-screen flex-col items-center justify-center bg-slate-900">
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
                title={t('chatMode')}
                variant="secondary"
                size="icon"
                onClick={() => updateTalkMode('chat')}
              >
                <MessageSquareText />
              </Button>
              {status === 'talking' ? (
                <Button
                  className="mx-6 h-14 w-14 rounded-full"
                  title={t('stopTalking')}
                  variant="destructive"
                  size="icon"
                  onClick={() => handleStopTalking()}
                >
                  <Pause />
                </Button>
              ) : (
                <Button
                  className="mx-6 h-14 w-14 rounded-full font-mono"
                  title={t('startRecording')}
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRecorder()}
                >
                  {speechRecognition.isRecording ? speechRecognition.formattedTime : <Mic className="h-8 w-8" />}
                </Button>
              )}
              <Button
                className="h-10 w-10 rounded-full text-slate-700"
                title={t('setting')}
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
      <Topic open={topicOpen} onClose={() => setTopicOpen(false)} onSelect={initTopic} />
    </main>
  )
}
