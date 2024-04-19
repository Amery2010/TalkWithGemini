'use client'
import { useRef, useState, useMemo, KeyboardEvent, useEffect, useCallback, useLayoutEffect } from 'react'
import { EdgeSpeech, SpeechRecognition } from '@xiangfa/polly'
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
import { summarizePrompt, getVoiceModelPrompt, getSummaryPrompt } from '@/utils/prompt'
import AudioStream from '@/utils/AudioStream'
import PromiseQueue from '@/utils/PromiseQueue'
import textStream, { streamToText } from '@/utils/textStream'
import { generateSignature, generateUTCTimestamp } from '@/utils/signature'
import { shuffleArray, formatTime } from '@/utils/common'
import topics from '@/constant/topics'
import { customAlphabet } from 'nanoid'
import { findLast, isFunction, groupBy, pick } from 'lodash-es'

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8)

export default function Home() {
  const { t } = useTranslation()
  const siriWaveRef = useRef<HTMLDivElement>(null)
  const scrollAreaBottomRef = useRef<HTMLDivElement>(null)
  const audioStreamRef = useRef<AudioStream>()
  const edgeSpeechRef = useRef<EdgeSpeech>()
  const speechRecognitionRef = useRef<SpeechRecognition>()
  const speechQueue = useRef<PromiseQueue>()
  const messagesRef = useRef(useMessageStore.getState().messages)
  const messageStore = useMessageStore()
  const settingStore = useSettingStore()
  const [messageAutoAnimate] = useAutoAnimate()
  const [textareaHeight, setTextareaHeight] = useState<number>(40)
  const [randomTopic, setRandomTopic] = useState<Topic[]>([])
  const [siriWave, setSiriWave] = useState<SiriWave>()
  const [content, setContent] = useState<string>('')
  const [subtitle, setSubtitle] = useState<string>('')
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordTimer, setRecordTimer] = useState<NodeJS.Timeout>()
  const [recordTime, setRecordTime] = useState<number>(0)
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

  const speech = useCallback(
    (content: string) => {
      if (content.length === 0) return
      speechQueue.current?.enqueue(
        () =>
          new Promise(async (resolve, reject) => {
            if (speechSilence) reject(false)
            const { ttsVoice } = useSettingStore.getState()
            const voice = await edgeSpeechRef.current?.create({
              input: content,
              options: { voice: ttsVoice },
            })
            if (voice) {
              const { save: saveMessage } = useMessageStore.getState()
              const audio = await voice.arrayBuffer()
              setStatus('talking')
              const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
              siriWave?.setSpeed(isSafari ? 0.1 : 0.05)
              siriWave?.setAmplitude(2)
              audioStreamRef.current?.play({
                audioData: audio,
                text: content,
                onStart: (text) => {
                  setSubtitle(text)
                },
                onFinished: () => {
                  setStatus('silence')
                  saveMessage()
                  siriWave?.setSpeed(0.04)
                  siriWave?.setAmplitude(0.1)
                },
              })
              resolve(true)
            }
          }),
      )
    },
    [siriWave, speechSilence],
  )

  const scrollToBottom = useCallback(() => {
    scrollAreaBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchAnswer = useCallback(
    async ({
      messages,
      model,
      onResponse,
      onError,
    }: {
      messages: Message[]
      model: 'gemini-pro' | 'gemini-pro-vision'
      onResponse: (readableStream: ReadableStream) => void
      onError?: (error: string, code?: number) => void
    }) => {
      const { apiKey, apiProxy, password } = useSettingStore.getState()
      const messageList = [...messages].map((item) => {
        return pick(item, ['role', 'content', 'type'])
      })
      if (apiKey !== '') {
        const config: RequestProps = {
          messages: messageList,
          apiKey: apiKey,
          model,
        }
        if (apiProxy) config.baseUrl = apiProxy
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
                if (error instanceof Error && isFunction(onError)) {
                  onError(error.message)
                }
              }
              controller.close()
            },
          })
          onResponse(readableStream)
        } catch (error) {
          if (error instanceof Error && isFunction(onError)) {
            onError(error.message)
          }
        }
      } else {
        const utcTimestamp = generateUTCTimestamp()
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: messageList,
            model,
            ts: utcTimestamp,
            sign: generateSignature(password, utcTimestamp),
          }),
        })
        if (response.status < 400 && response.body) {
          onResponse(response.body)
        } else {
          const { message, code } = await response.json()
          if (isFunction(onError)) {
            onError(message, code)
          }
        }
      }
    },
    [],
  )

  const summarize = useCallback(
    async (messages: Message[]) => {
      const { summary, summarize: summarizeChat } = useMessageStore.getState()
      const { ids, prompt } = summarizePrompt(messages, summary.ids, summary.content)
      await fetchAnswer({
        messages: [{ id: 'summary', role: 'user', type: 'text', content: prompt }],
        model: 'gemini-pro',
        onResponse: async (readableStream) => {
          const text = await streamToText(readableStream)
          summarizeChat(ids, text.trim())
        },
      })
    },
    [fetchAnswer],
  )

  const handleError = useCallback(async (id: string, message: string, code?: number) => {
    const { replace: replaceMessage } = useMessageStore.getState()
    const newModelMessage: Message = {
      id: nanoid(),
      role: 'model',
      content: code ? `${code}: ${message}` : message,
      error: true,
    }
    setStatus('silence')
    replaceMessage(id, newModelMessage)
    setSubtitle(message)
  }, [])

  const handleResponse = useCallback(
    async (data: ReadableStream, currentMessage: Message) => {
      const { lang, talkMode, maxHistoryLength } = useSettingStore.getState()
      const { summary, update: updateMesssage, save: saveMessage } = useMessageStore.getState()
      speechQueue.current = new PromiseQueue()
      setSpeechSilence(false)
      await textStream({
        readable: data,
        locale: lang,
        onMessage: (content) => {
          updateMesssage(currentMessage.id, content)
          scrollToBottom()
        },
        onStatement: (statement) => {
          if (talkMode === 'voice') {
            // Remove list symbols and adjust layout
            const audioText = statement.replaceAll('*', '').replaceAll('\n\n', '\n')
            speech(audioText)
          }
        },
        onFinish: async () => {
          scrollToBottom()
          saveMessage()
          if (maxHistoryLength > 0) {
            const messageGroup = groupBy(messagesRef.current, 'type')
            const messageList = messageGroup.text.filter((item) => !summary.ids.includes(item.id))
            if (messageList.length > maxHistoryLength) {
              await summarize(messageGroup.text)
            }
          }
        },
      })
    },
    [scrollToBottom, speech, summarize],
  )

  const handleSubmit = useCallback(
    async (text: string): Promise<void> => {
      if (content === '') return Promise.reject(false)
      const { talkMode } = useSettingStore.getState()
      const { summary, add: addMessage } = useMessageStore.getState()
      setContent('')
      setTextareaHeight(40)
      const newUserMessage: Message = { id: nanoid(), role: 'user', type: 'text', content: text }
      addMessage(newUserMessage)
      const newModelMessage: Message = { id: nanoid(), role: 'model', type: 'text', content: '' }
      addMessage(newModelMessage)
      let model: 'gemini-pro' | 'gemini-pro-vision' = 'gemini-pro'
      let messages: Message[] = []
      const messageGroup = groupBy(messagesRef.current.slice(0, -1), 'type')
      if (messageGroup.image && messageGroup.image.length > 0) {
        model = 'gemini-pro-vision'
        messages = [...messageGroup.image]
      }
      if (summary.content === '') {
        messages = [...messages, ...messageGroup.text]
      } else {
        const newMessages = messageGroup.text.filter((item) => !summary.ids.includes(item.id))
        messages = [...messages, ...getSummaryPrompt(summary.content), ...newMessages]
      }
      if (talkMode === 'voice') {
        messages = getVoiceModelPrompt(messages)
        setStatus('thinkng')
        setSubtitle('')
      }
      await fetchAnswer({
        messages,
        model,
        onResponse: (stream) => {
          handleResponse(stream, newModelMessage)
        },
        onError: (message, code) => {
          handleError(newModelMessage.id, message, code)
        },
      })
    },
    [content, fetchAnswer, handleResponse, handleError],
  )

  const handleResubmit = useCallback(async () => {
    const { revoke: revokeMessage } = useMessageStore.getState()
    const lastQuestion = findLast(messagesRef.current, { role: 'user' })
    if (lastQuestion) {
      const { id, content } = lastQuestion
      revokeMessage(id)
      await handleSubmit(content)
    }
  }, [handleSubmit])

  const handleCleanMessage = useCallback(() => {
    const { clear: clearMessage } = useMessageStore.getState()
    clearMessage()
  }, [])

  const updateTalkMode = useCallback((type: 'chat' | 'voice') => {
    const { setTalkMode } = useSettingStore.getState()
    setTalkMode(type)
  }, [])

  const checkAccessStatus = useCallback(() => {
    const { password, apiKey } = useSettingStore.getState()
    if (password !== '' || apiKey !== '') {
      return true
    } else {
      setSetingOpen(true)
      return false
    }
  }, [])

  const startRecordTime = useCallback(() => {
    const intervalTimer = setInterval(() => {
      setRecordTime((time) => time + 1)
    }, 1000)
    setRecordTimer(intervalTimer)
  }, [])

  const endRecordTimer = useCallback(() => {
    clearInterval(recordTimer)
  }, [recordTimer])

  const handleRecorder = useCallback(() => {
    if (!checkAccessStatus()) return false
    if (!audioStreamRef.current) {
      audioStreamRef.current = new AudioStream()
    }
    if (speechRecognitionRef.current) {
      const { talkMode } = useSettingStore.getState()
      if (isRecording) {
        speechRecognitionRef.current.stop()
        if (talkMode === 'voice') {
          handleSubmit(speechRecognitionRef.current.text)
          endRecordTimer()
          setRecordTime(0)
        }
        setIsRecording(false)
      } else {
        speechRecognitionRef.current.start()
        setIsRecording(true)
        if (talkMode === 'voice') {
          startRecordTime()
        }
      }
    }
  }, [checkAccessStatus, handleSubmit, startRecordTime, endRecordTimer, isRecording])

  const handleStopTalking = useCallback(() => {
    setSpeechSilence(true)
    speechQueue.current?.empty()
    audioStreamRef.current?.stop()
    setStatus('silence')
  }, [])

  const handleKeyDown = useCallback(
    (ev: KeyboardEvent<HTMLTextAreaElement>) => {
      if (ev.key === 'Enter' && !ev.shiftKey && !isRecording) {
        if (!checkAccessStatus()) return false
        // Prevent the default carriage return and line feed behavior
        ev.preventDefault()
        handleSubmit(content)
      }
    },
    [content, isRecording, handleSubmit, checkAccessStatus],
  )

  const handleImageUpload = useCallback((imageDataList: string[]) => {
    const { add: addMessage } = useMessageStore.getState()
    imageDataList.forEach((imageData) => {
      addMessage({ id: nanoid(), role: 'user', type: 'image', content: imageData })
    })
  }, [])

  const initTopic = useCallback((topic: Topic) => {
    const { add: addMessage, clear: clearMessage } = useMessageStore.getState()
    clearMessage()
    topic.parts.forEach((part) => {
      addMessage({ id: nanoid(), ...part })
    })
  }, [])

  useEffect(() => useMessageStore.subscribe((state) => (messagesRef.current = state.messages)), [])

  useEffect(() => {
    if (messagesRef.current.length === 0) {
      const langType = settingStore.lang.split('-')[0] === 'zh' ? 'zh' : 'en'
      setRandomTopic(shuffleArray<Topic>(topics[langType]).slice(0, 3))
    }
  }, [settingStore.lang])

  useEffect(() => {
    requestAnimationFrame(scrollToBottom)
  }, [messagesRef.current.length, scrollToBottom])

  useEffect(() => {
    speechRecognitionRef.current = new SpeechRecognition({
      locale: settingStore.sttLang,
      onUpdate: (text) => {
        setContent(text)
      },
    })
  }, [settingStore.sttLang])

  useEffect(() => {
    const setting = useSettingStore.getState()
    const edgeSpeech = new EdgeSpeech({ locale: setting.ttsLang })
    edgeSpeechRef.current = edgeSpeech
    const voiceOptions = edgeSpeech.voiceOptions
    if (setting.ttsVoice === '') {
      setting.setTTSVoice(voiceOptions ? (voiceOptions[0].value as string) : 'en-US-JennyNeural')
    }
  }, [settingStore.ttsLang])

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
      <div className="mb-2 mt-6 flex justify-between p-4 pr-2 max-sm:mt-2 max-sm:pr-2 landscape:max-md:mt-0">
        <div className="flex flex-row text-xl leading-8 text-red-400 max-sm:text-base">
          <MessageCircleHeart className="h-10 w-10 max-sm:h-8 max-sm:w-8" />
          <div className="ml-3 font-bold leading-10 max-sm:leading-8">{t('title')}</div>
        </div>
        <div className="flex items-center gap-1">
          {GITHUB_URL ? (
            <Button title={t('github')} variant="ghost" size="icon" className="h-8 w-8">
              <Github className="h-5 w-5" onClick={() => window.open(GITHUB_URL)} />
            </Button>
          ) : null}
          <ThemeToggle />
          <Button
            className="h-8 w-8"
            title={t('setting')}
            variant="ghost"
            size="icon"
            onClick={() => setSetingOpen(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
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
                <div className="my-2 flex h-4 justify-center text-xs text-slate-400 duration-300 dark:text-slate-600">
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
      <div className="fixed bottom-0 flex w-full max-w-screen-md items-end gap-2 bg-[hsl(var(--background))] p-4 pb-8 max-sm:p-2 max-sm:pb-3 landscape:max-md:pb-4">
        <Button title={t('voiceMode')} variant="secondary" size="icon" onClick={() => updateTalkMode('voice')}>
          <AudioLines />
        </Button>
        <div className="relative w-full">
          <Textarea
            className="max-h-[120px] min-h-10 px-2 pr-16 transition-[height]"
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
            <div className="box-border flex h-8 w-8 cursor-pointer items-center justify-center text-slate-800">
              <ImageUploader onChange={handleImageUpload} />
            </div>
            <div
              className="box-border flex h-8 w-8 cursor-pointer items-center justify-center text-slate-800"
              onClick={() => handleRecorder()}
            >
              <Mic className={isRecording ? `animate-pulse` : ''} />
            </div>
          </div>
        </div>
        <Button
          title={t('send')}
          variant="secondary"
          size="icon"
          disabled={isRecording}
          onClick={() => handleSubmit(content)}
        >
          <SendHorizontal />
        </Button>
      </div>
      <div style={{ display: settingStore.talkMode === 'voice' ? 'block' : 'none' }}>
        <div className="fixed left-0 right-0 top-0 flex h-full w-screen flex-col items-center justify-center bg-slate-900">
          <div className="h-1/5 w-full" ref={siriWaveRef}></div>
          <div className="absolute bottom-0 flex h-2/5 w-2/3 flex-col justify-between pb-12 text-center">
            <div className="text-sm leading-6">
              <div className="animate-pulse text-lg text-white">{statusText}</div>
              {status === 'talking' ? (
                <pre className="text-center text-red-300">{subtitle}</pre>
              ) : (
                <div className="text-center text-green-300">{content}</div>
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
                  disabled={status === 'thinkng'}
                  onClick={() => handleRecorder()}
                >
                  {isRecording ? formatTime(recordTime) : <Mic className="h-8 w-8" />}
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
