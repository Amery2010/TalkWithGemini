function findTextPart(message: Message) {
  const texts: string[] = []
  for (const part of message.parts) {
    if (part.text) texts.push(part.text)
  }
  return texts
}

export function summarizePrompt(messages: Message[], ids: string[], summary: string) {
  const conversation = messages.filter((item) => !ids.includes(item.id))
  const newLines = conversation.map((item) => {
    const texts = findTextPart(item)
    return `${item.role === 'user' ? 'Human' : 'AI'}: ${texts.join('\n')}\n\n`
  })
  return {
    ids: [...ids, ...conversation.map((item) => item.id)],
    prompt: `Progressively summarize the lines of conversation provided, adding onto the previous
      summary recrning a new summary.

      EXAMPLE
      Current summary:
      The human asks what the AI thinks of artificial intelligence. The AI thinks artificial intelligence is a force for good.
      New lines of conversation:
      Human: Why do you think artificial intelligence is a force for good?
      AI: Because artificial intelligence will help humans reach their full potential.
      New summary:
      The human asks what the AI thinks of artificial intelligence. The AI thinks artificial intelligence is a force for good because it will help humans reach their full potential.
      END OF EXAMPLE

      Current summary:
      ${summary}

      New lines of conversation:
      ${newLines}
      
      New summary:`,
  }
}

export function getVoiceModelPrompt(messages: Message[]): Message[] {
  return [
    {
      id: 'voiceSystemUser',
      role: 'user',
      parts: [
        {
          text: `You are an all-knowing friend of mine, we are communicating face to face.
      Please answer my question in short sentences.
      Please avoid using any text content other than the text used for spoken communication.
      The answer to the question is to avoid using list items with *, humans do not use any text formatting symbols in the communication process.
     `,
        },
      ],
    },
    {
      id: 'voiceSystemModel',
      role: 'model',
      parts: [{ text: 'Okay, I will answer your question in short sentences!' }],
    },
    ...messages,
  ]
}

export function getSummaryPrompt(content: string): Message[] {
  return [
    {
      id: 'summaryPrompt',
      role: 'user',
      parts: [{ text: 'Please summarize the previous conversation in a short text.' }],
    },
    { id: 'summary', role: 'model', parts: [{ text: content }] },
  ]
}

export function getVisionPrompt(message: Message, messages: Message[]) {
  const conversation = `
      The following conversation is my question about those pictures and your explanation:
      """
      ${messages
        .map((item) => {
          const texts = findTextPart(item)
          return `${item.role === 'user' ? 'Human' : 'AI'}: ${texts.join('\n')}`
        })
        .join('\n\n')}
      """
      Just remember the conversation and do not include the above when answering!
    `
  const content = `
      Please answer my question in the language I asked it in:
      """
      ${findTextPart(message).join('\n')}
      """
    `
  return messages.length > 0 ? conversation + content : content
}

export function getTalkAudioPrompt(messages: Message[]): Message[] {
  return [
    {
      id: 'talkAudioRequire',
      role: 'user',
      parts: [
        {
          text: `I am communicating with you through audio. Please feel the emotions in the audio, understand and answer the content in the audio. You do not need to repeat my questions, but must respond orally.`,
        },
      ],
    },
    {
      id: 'talkAudioReply',
      role: 'model',
      parts: [
        {
          text: 'OK, I will reply in the language in the audio',
        },
      ],
    },
    ...messages,
  ]
}
