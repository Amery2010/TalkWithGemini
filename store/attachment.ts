import { create } from 'zustand'
import { findIndex } from 'lodash-es'

type AttachmentStore = {
  files: FileInfor[]
  add: (file: FileInfor) => void
  update: (id: string, file: FileInfor) => void
  remove: (id: string) => void
  clear: () => void
}

export const useAttachmentStore = create<AttachmentStore>((set, get) => ({
  files: [],
  add: (file) => {
    const files = get().files
    if (findIndex(files, { id: file.id }) === -1) {
      set((state) => ({
        files: [...state.files, file],
      }))
    }
  },
  update: (id, file) => {
    const files = [...get().files]
    const fileIndex = findIndex(files, { id })
    if (fileIndex !== -1) {
      files[fileIndex] = file
      set(() => ({ files }))
    }
  },
  remove: (id) => {
    const files = [...get().files]
    const fileIndex = findIndex(files, { id })
    if (fileIndex !== -1) {
      files.splice(fileIndex, 1)
      set(() => ({ files }))
    }
  },
  clear: () => {
    set(() => ({ files: [] }))
  },
}))
