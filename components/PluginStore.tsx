import { useState, useCallback, useLayoutEffect, memo } from 'react'
import { Globe, Mail, CloudDownload, LoaderCircle, Trash } from 'lucide-react'
import { type FunctionDeclarationSchema, FunctionDeclarationSchemaType } from '@google/generative-ai'
import type { OpenAPI } from 'openapi-types'
import { convertParametersToJSONSchema } from 'openapi-jsonschema-parameters'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/SearchBar'
import { usePluginStore } from '@/store/plugin'
import { useSettingStore } from '@/store/setting'
import pluginStore from '@/constant/plugins'
import { convertOpenAIPluginToPluginSchema, type OpenAIPluginManifest } from '@/utils/tool'
import { encodeToken } from '@/utils/signature'
import { values } from 'lodash-es'

type PluginStoreProps = {
  open: boolean
  onClose: () => void
}

function search(keyword: string, data: PluginManifest[]): PluginManifest[] {
  const results: PluginManifest[] = []
  // 'i' means case-insensitive
  const regex = new RegExp(keyword.trim(), 'gi')
  data.forEach((item) => {
    if (regex.test(item.title) || regex.test(item.description) || regex.test(item.systemRole)) {
      results.push(item)
    }
  })
  return results
}

function PluginStore({ open, onClose }: PluginStoreProps) {
  const { password } = useSettingStore()
  const {
    plugins,
    tools,
    installedPlugins,
    update: updatePlugins,
    installPlugin,
    uninstallPlugin,
    addTool,
    removeTool,
  } = usePluginStore()
  const [pluginList, setPluginList] = useState<PluginManifest[]>([])
  const [loadingList, setLoadingList] = useState<string[]>([])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose()
        setPluginList(plugins)
      }
    },
    [plugins, onClose],
  )

  const handleSearch = useCallback(
    (keyword: string) => {
      const result = search(keyword, plugins)
      setPluginList(result)
    },
    [plugins],
  )

  const handleClear = useCallback(() => {
    setPluginList(plugins)
  }, [plugins])

  const handleInstall = useCallback(
    async (id: string) => {
      loadingList.push(id)
      setLoadingList([...loadingList])
      const token = encodeToken(password)
      const response = await fetch(`/api/plugin?id=${id}&token=${token}`)
      const result: OpenAPI.Document = await response.json()
      if (result.paths) {
        const convertOpenAPIParameter = (parameters: OpenAPI.Parameters) => {
          const parametersSchema = convertParametersToJSONSchema(parameters || [])
          let properties = {}
          let required: string[] = []
          for (const schema of values(parametersSchema)) {
            if (schema && schema.properties) {
              properties = { ...properties, ...schema.properties }

              if (Array.isArray(schema.required)) {
                required = [...required, ...schema.required]
              }
            }
          }
          return {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties,
            required,
          } as FunctionDeclarationSchema
        }
        for (const operations of values(result.paths)) {
          for (const operation of values(operations) as OpenAPI.Operation[]) {
            if (operation.parameters) {
              addTool({
                name: `${id}_${operation.operationId}`,
                description: operation.summary || operation.description || operation.operationId,
                parameters: convertOpenAPIParameter(operation.parameters),
              })
            }
          }
        }
        installPlugin(id)
      }
      setLoadingList(loadingList.filter((pluginId) => pluginId !== id))
    },
    [password, loadingList, installPlugin, addTool],
  )

  const handleUninstall = useCallback(
    (id: string) => {
      loadingList.push(id)
      setLoadingList([...loadingList])
      tools.forEach((tool) => {
        const toolPrefix = `${id}_`
        if (tool.name.startsWith(toolPrefix)) {
          removeTool(tool.name)
        }
      })
      uninstallPlugin(id)
      setLoadingList(loadingList.filter((pluginId) => pluginId !== id))
    },
    [loadingList, tools, uninstallPlugin, removeTool],
  )

  useLayoutEffect(() => {
    const toolList = pluginStore.map((item) => {
      return {
        ...convertOpenAIPluginToPluginSchema(item as OpenAIPluginManifest),
      }
    })
    setPluginList(toolList)
    updatePlugins(toolList)
  }, [updatePlugins])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-screen-md p-0 max-sm:h-full landscape:max-md:h-full">
        <DialogHeader className="p-6 pb-0 max-sm:p-4 max-sm:pb-0">
          <DialogTitle>插件商店</DialogTitle>
          <DialogDescription className="pb-2">插件是通过 Gemini 的函数调用实现的一组特殊工具。</DialogDescription>
          <div className="flex gap-2">
            <SearchBar onSearch={handleSearch} onClear={() => handleClear()} />
          </div>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full scroll-smooth max-sm:h-full">
          <div className="grid grid-cols-2 gap-2 p-6 pt-0 max-sm:grid-cols-1 max-sm:p-4 max-sm:pt-0">
            {pluginList.map((item) => {
              return (
                <Card key={item.id} className="transition-colors dark:hover:border-white/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex truncate text-base font-medium">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-line-clamp-3 h-16 text-sm">{item.description}</CardContent>
                  <CardFooter className="flex justify-between px-4 pb-2">
                    <div>
                      <Button className="h-8 w-8" size="icon" variant="ghost">
                        <a href={item.legalInfoUrl} target="_blank">
                          <Globe className="h-5 w-5" />
                        </a>
                      </Button>
                      <Button className="h-8 w-8" size="icon" variant="ghost">
                        <a href={`mailto://${item.email}`} target="_blank">
                          <Mail className="h-5 w-5" />
                        </a>
                      </Button>
                    </div>
                    <Button
                      className="h-8 bg-red-400 hover:bg-red-500"
                      disabled={loadingList.includes(item.id)}
                      onClick={() =>
                        installedPlugins.includes(item.id) ? handleUninstall(item.id) : handleInstall(item.id)
                      }
                    >
                      {installedPlugins.includes(item.id) ? (
                        <>
                          卸载{' '}
                          {loadingList.includes(item.id) ? (
                            <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="ml-2 h-4 w-4" />
                          )}
                        </>
                      ) : (
                        <>
                          安装{' '}
                          {loadingList.includes(item.id) ? (
                            <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CloudDownload className="ml-2 h-4 w-4" />
                          )}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default memo(PluginStore)
