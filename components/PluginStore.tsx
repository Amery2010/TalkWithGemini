import { useState, useCallback, useLayoutEffect, memo } from 'react'
import { Globe, Mail, CloudDownload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/SearchBar'
import { usePluginStore } from '@/store/plugin'
import { useSettingStore } from '@/store/setting'
import pluginStore from '@/constant/plugins'
import { convertOpenAIPluginToPluginSchema, type OpenAIPluginManifest } from '@/utils/tool'
import { encodeToken } from '@/utils/signature'

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
  const { plugins, update: updatePlugins } = usePluginStore()
  const [pluginList, setPluginList] = useState<PluginManifest[]>([])

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
      const token = encodeToken(password)
      const response = await fetch(`/api/plugin?id=${id}&token=${token}`)
      const result = await response.json()
      console.log(result)
    },
    [password],
  )

  useLayoutEffect(() => {
    const toolList = pluginStore.map((item) => {
      return convertOpenAIPluginToPluginSchema(item as OpenAIPluginManifest)
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
                <Card
                  key={item.id}
                  className="cursor-pointer transition-colors hover:drop-shadow-md dark:hover:border-white/80"
                >
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
                    <Button className="h-8 bg-red-400 hover:bg-red-500" onClick={() => handleInstall(item.id)}>
                      安装 <CloudDownload className="ml-2 h-4 w-4" />
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
