'use client'
import { useRef, useState } from 'react'
import { EdgeSpeechTTS } from '@lobehub/tts'
import { useSpeechRecognition } from '@lobehub/tts/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { create } from 'zustand'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import MessageItem, { filterMarkdown } from '@/components/MessageItem'
import ErrorMessageItem from '@/components/ErrorMessageItem'
import AudioStream from '@/utils/AudioStream'
import PromiseQueue from '@/utils/PromiseQueue'
import { FetchEventResult } from 'next/dist/server/web/types'

type MessageStore = {
  messages: Message[]
  addMessage: (message: Message) => void
  updateMessage: (content: string) => void
}

const useMessageStore = create<MessageStore>((set) => ({
  messages: [
    {
      id: '1',
      role: 'user',
      content: '你是我身边一位无所不知的朋友，我需要你用口语的方式与我沟通。',
    },
    {
      id: '2',
      role: 'model',
      content:
        '嗨，很高兴认识你！能成为你身边无所不知的朋友，我感到非常荣幸。我会用口语的方式与你沟通，并在适当的位置加上换行符。',
    },
  ],
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },
  updateMessage: (content) => {
    set((state) => {
      state.messages[state.messages.length - 1].content += content
      return {
        messages: state.messages,
      }
    })
  },
}))

/**
 * 文本流截断处理
 * @param readable 可读流
 * @param onMessage 消息回调函数
 */
export async function textStream(
  readable: ReadableStream,
  onMessage: (text: string) => void,
  onStatement: (statement: string) => void,
) {
  const reader = readable.getReader()

  const decoder = new TextDecoder('utf-8')
  const reg = /(?:\n\n|\r\r|\r\n\r\n)/
  let buffer = ''

  while (true) {
    let { value, done } = await reader.read()
    if (done) {
      buffer && onStatement(filterMarkdown(buffer))
      break
    }
    // stream: true is important here, fix the bug of incomplete line
    const chunk = decoder.decode(value, { stream: true })
    onMessage(chunk)
    const lines = (buffer + chunk).split(reg)
    buffer = lines.pop() || ''

    for (const line of lines) {
      onStatement(filterMarkdown(line))
    }
  }
}

export default function Home() {
  const audioStreamRef = useRef<AudioStream>()
  const edgeSpeechRef = useRef<EdgeSpeechTTS>()
  const speechQueue = useRef<PromiseQueue>()
  const { messages, addMessage, updateMessage } = useMessageStore()
  const { text, start, stop, isLoading, formattedTime } = useSpeechRecognition('zh-CN')
  const [parent] = useAutoAnimate()
  const [init, setInit] = useState<boolean>(false)
  const [content, setContent] = useState<string>('')

  const speech = (content: string) => {
    if (content.length === 0) return
    speechQueue.current?.enqueue(
      () =>
        new Promise(async (resolve) => {
          const voice = await edgeSpeechRef.current?.create({
            input: content,
            options: { voice: 'zh-CN-XiaoxiaoNeural' },
          })
          if (voice) {
            const audio = await voice.arrayBuffer()
            audioStreamRef.current?.play(audio)
            resolve(true)
          }
        }),
    )
  }

  const handleSubmit = async (text: string) => {
    initApp()
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text }
    addMessage(newMessage)
    setContent('')
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
      await textStream(
        response.body,
        (content) => {
          updateMessage(content)
        },
        (statement) => {
          speech(statement)
        },
      )
    } else {
      const errorMessage = await response.text()
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: `${response.status}: ${errorMessage}`,
        error: true,
      }
      addMessage(newMessage)
    }
  }

  const initApp = () => {
    if (!init) {
      const audioStream = new AudioStream()
      audioStreamRef.current = audioStream
      const edgeSpeech = new EdgeSpeechTTS()
      edgeSpeechRef.current = edgeSpeech
      setInit(true)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-md flex-col pb-6 pt-10">
      <div ref={parent}>
        {messages.map((msg) => (
          <div className="flex gap-3 p-4 transition-colors hover:bg-[#94a3b812]" key={msg.id}>
            {!msg.error ? (
              <MessageItem role={msg.role} content={msg.content} />
            ) : (
              <ErrorMessageItem role={msg.role} content={msg.content} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-4">
        <Textarea
          className="min-h-10"
          rows={1}
          value={content}
          placeholder="请输入问题..."
          onChange={(ev) => setContent(ev.target.value)}
        />
        <Button variant="secondary" onClick={() => handleSubmit(content)}>
          发送
        </Button>
      </div>
      {/* {isLoading ? (
        <button
          onClick={() => {
            stop()
            if (text) handleSubmit(text)
          }}
        >
          Stop {formattedTime}
        </button>
      ) : (
        <button onClick={start}>Recognition</button>
      )}
      <textarea placeholder={'Recognition result...'} value={text} /> */}
    </main>
  )
}
