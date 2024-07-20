import { create } from 'zustand'
import { type FunctionDeclaration } from '@google/generative-ai'
import { find } from 'lodash-es'

type PluginStore = {
  plugins: PluginManifest[]
  tools: FunctionDeclaration[]
  update: (plugins: PluginManifest[]) => void
  addTool: (tool: FunctionDeclaration) => void
}

export const usePluginStore = create<PluginStore>((set, get) => ({
  plugins: [],
  tools: [],
  update: (plugins) => {
    set(() => ({
      plugins: [...plugins],
    }))
  },
  addTool: (tool) => {
    const tools = [...get().tools]
    if (!find(tools, { name: tool.name })) {
      tools.push(tool)
      set(() => ({ tools }))
    }
  },
}))
