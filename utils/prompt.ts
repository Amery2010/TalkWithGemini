export function summarizePrompt(messages: Message[], ids: string[], summary: string) {
  const conversation = messages.filter((item) => !ids.includes(item.id))
  const newLines = conversation.map((item) => {
    return `${item.role === 'user' ? 'Human' : 'AI'}: ${item.content}\n`
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
      type: 'text',
      content: `You are an all-knowing friend of mine, we are communicating face to face.
       Please answer my question in short sentences.
       Please avoid using any text content other than the text used for spoken communication.
       The answer to the question is to avoid using list items with *, humans do not use any text formatting symbols in the communication process.
      `,
    },
    {
      id: 'voiceSystemModel',
      role: 'model',
      type: 'text',
      content: 'Okay, I will answer your question in short sentences!',
    },
    ...messages,
  ]
}

export function getSummaryPrompt(content: string): Message[] {
  return [
    {
      id: 'summaryPrompt',
      role: 'user',
      content: 'Please summarize the previous conversation in a short text.',
    },
    { id: 'summary', role: 'model', content },
  ]
}

export function getVisionPrompt(
  message: Pick<Message, 'role' | 'content' | 'type'>,
  messages: Pick<Message, 'role' | 'content' | 'type'>[],
) {
  const conversation = `
      The following conversation is my question about those pictures and your explanation:
      """
      ${messages
        .map((item) => {
          return `${item.role === 'user' ? 'Human' : 'AI'}: ${item.content}`
        })
        .join('\n')}
      """
      Just remember the conversation and do not include the above when answering!
    `
  const content = `
      Please answer my question in the language I asked it in:
      """
      ${message.content}
      """
    `
  return messages.length > 0 ? conversation + content : content
}
