import { create } from 'zustand'
import storage from '@/utils/Storage'
import { type FunctionDeclaration } from '@google/generative-ai'
import { find, findIndex, filter } from 'lodash-es'

interface Plugin extends PluginManifest {
  openapi: OpenAPIDocument
}

type PluginStore = {
  plugins: PluginManifest[]
  installedPlugins: Record<string, Plugin>
  tools: FunctionDeclaration[]
  init: () => Promise<FunctionDeclaration[]>
  update: (plugins: PluginManifest[]) => void
  installPlugin: (id: string, schema: OpenAPIDocument) => void
  uninstallPlugin: (id: string) => void
  updatePlugin: (id: string, manifest: Partial<PluginManifest>) => void
  addTool: (tool: FunctionDeclaration) => void
  removeTool: (name: string) => void
}

export const usePluginStore = create<PluginStore>((set, get) => ({
  plugins: [],
  installedPlugins: {},
  tools: [],
  init: async () => {
    const tools = (await storage.getItem<FunctionDeclaration[]>('tools')) || []
    const installedPlugins = (await storage.getItem<Record<string, Plugin>>('installedPlugins')) || {}
    set(() => ({ tools, installedPlugins }))
    return tools
  },
  update: (plugins) => {
    set(() => ({
      plugins: [...plugins],
    }))
  },
  updatePlugin: (id, manifest) => {
    const plugins = [...get().plugins]
    const index = findIndex(plugins, { id })
    plugins[index] = { ...plugins[index], ...manifest }
    set(() => ({ plugins }))
  },
  installPlugin: (id, schema) => {
    const installedPlugins = { ...get().installedPlugins }
    const plugin = find(get().plugins, { id })
    if (plugin) {
      installedPlugins[id] = { ...plugin, openapi: schema }
      set(() => ({ installedPlugins }))
      storage.setItem<Record<string, Plugin>>('installedPlugins', installedPlugins)
    }
  },
  uninstallPlugin: (id) => {
    const installedPlugins = { ...get().installedPlugins }
    delete installedPlugins[id]
    set(() => ({ installedPlugins }))
    storage.setItem<Record<string, Plugin>>('installedPlugins', installedPlugins)
  },
  addTool: async (tool) => {
    const tools = [...get().tools]
    if (!find(tools, { name: tool.name })) {
      tools.push(tool)
      set(() => ({ tools }))
      await storage.setItem<FunctionDeclaration[]>('tools', tools)
    }
  },
  removeTool: async (name: string) => {
    const tools = [...get().tools]
    const newTools = filter(tools, (tool) => tool.name !== name)
    set(() => ({ tools: newTools }))
    await storage.setItem<FunctionDeclaration[]>('tools', newTools)
  },
}))
