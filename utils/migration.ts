import storage from '@/utils/Storage'

type OldMessage = {
  id: string
  role: string
  type?: 'text' | 'image'
  content: string
}

/**
 * Since the project storage structure has changed since 0.9.3,
 * this code is only used for data migration work in version 0.8.x.
 */
export async function dataMigration() {
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i)
    if (name?.startsWith('TWG::')) {
      const data = JSON.parse(localStorage.getItem(name) || '')
      if (name === 'TWG::messages') {
        const messageList: Message[] = []
        data.forEach((item: OldMessage) => {
          if (item.content.startsWith('data:image/')) {
            const imageDataInfor = item.content.split(';base64,')
            messageList.push({
              id: item.id,
              role: item.role,
              parts: [{ inlineData: { mimeType: imageDataInfor[0].substring(5), data: imageDataInfor[1] } }],
            } as Message)
          } else {
            messageList.push({ id: item.id, role: item.role, parts: [{ text: item.content }] } as Message)
          }
        })
        await storage.setItem(name.substring(5), messageList)
      } else {
        await storage.setItem(name.substring(5), data)
      }
      localStorage.removeItem(name)
    }
  }
}
