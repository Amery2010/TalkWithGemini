'use client'
import { useRef } from 'react'
import { EdgeSpeechTTS } from '@lobehub/tts'
import { useSpeechRecognition } from '@lobehub/tts/react'
import { create } from 'zustand'
import AudioStream from '@/utils/AudioStream'
import PromiseQueue from '@/utils/PromiseQueue'
import type { Message } from 'ai'

type MessageStore = {
  messages: Message[]
  add: (message: Message) => void
  update: (content: string) => void
}

const useMessageStore = create<MessageStore>((set) => ({
  messages: [
    {
      id: '1',
      role: 'user',
      content:
        '你是我身边一位无所不知的朋友，我需要你用口语的方式与我沟通。你需要模拟人类的发言模式，在适当的位置加上换行符用以表示换气。',
    },
    {
      id: '2',
      role: 'assistant',
      content:
        '嗨，很高兴认识你！能成为你身边无所不知的朋友，我感到非常荣幸。就像你说的，我会用口语的方式与你沟通，并在适当的位置加上换行符用以表示换气。',
    },
  ],
  add: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },
  update: (content) => {
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
export async function textStream(readable: ReadableStream, onMessage: (text: string) => void) {
  const reader = readable.getReader()

  const decoder = new TextDecoder('utf-8')
  const reg = /(?:\n\n|\r\r|\r\n\r\n)/
  let content = ''

  while (true) {
    let { value, done } = await reader.read()
    if (done) {
      onMessage(content)
      break
    }
    // stream: true is important here,fix the bug of incomplete line
    const chunk = decoder.decode(value, { stream: true })
    // 逐字逐句进行句子分割处理
    if (reg.test(chunk)) {
      const result = chunk.split(reg)
      onMessage(content + result[0])
      content = result[1]
    } else {
      content += chunk
    }
  }
}

export default function Home() {
  const audioStreamRef = useRef<AudioStream>()
  const edgeSpeechRef = useRef<EdgeSpeechTTS>()
  const speechQueue = useRef<PromiseQueue>()
  const { messages, add, update } = useMessageStore()
  const { text, start, stop, isLoading, formattedTime } = useSpeechRecognition('zh-CN')

  const speech = (content: string) => {
    console.log(1, content)
    if (content.length === 0) return
    speechQueue.current?.enqueue(
      () =>
        new Promise(async (resolve) => {
          console.log(2)
          const voice = await edgeSpeechRef.current?.create({
            input: content,
            options: { voice: 'zh-CN-YunxiaNeural' },
          })
          console.log(3, voice)
          if (voice) {
            const audio = await voice.arrayBuffer()
            console.log(4)
            audioStreamRef.current?.play(audio)
            resolve(true)
          }
        }),
    )
  }

  const handleSubmit = async () => {
    stop()
    if (text) {
      const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text }
      add(newMessage)
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [...messages, newMessage],
        }),
      })
      if (response.body) {
        const newMessage: Message = { id: Date.now().toString(), role: 'assistant', content: '' }
        add(newMessage)
        speechQueue.current = new PromiseQueue()
        textStream(response.body, (content) => {
          if (content) {
            update(content)
            speech(content)
          }
        })
      }
    }
  }

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}
      {isLoading ? (
        <button onClick={handleSubmit}>Stop {formattedTime}</button>
      ) : (
        <button onClick={start}>Recognition</button>
      )}
      <textarea placeholder={'Recognition result...'} value={text} />
      <button
        onClick={() => {
          const audioStream = new AudioStream()
          audioStreamRef.current = audioStream
          const edgeSpeech = new EdgeSpeechTTS()
          edgeSpeechRef.current = edgeSpeech
        }}
      >
        Listen
      </button>
    </div>
  )
}
