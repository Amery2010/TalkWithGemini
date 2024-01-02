import { memo, useEffect, useState } from 'react'
import { useSettingStore } from '@/store/setting'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type SettingProps = {
  open: boolean
  onClose: () => void
}

function Setting({ open, onClose }: SettingProps) {
  const settingStore = useSettingStore()
  const [password, setPassword] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiProxy, setApiProxy] = useState<string>('')

  const handleSubmit = () => {
    if (password) settingStore.setPassword(password)
    if (apiKey) settingStore.setApiKey(apiKey)
    if (apiProxy) settingStore.setApiProxy(apiProxy)
    onClose()
  }
  const handleClose = (open: boolean) => {
    if (!open) onClose()
  }

  useEffect(() => {
    setPassword(settingStore.password)
    setApiKey(settingStore.apiKey)
    setApiProxy(settingStore.apiProxy)
  }, [settingStore])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-sm:h-full">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            请输入访问密码或者使用自己的{' '}
            <a className="underline underline-offset-4" href="https://ai.google.dev/" target="_blank">
              Gemini 密钥
            </a>
            ，密钥通过浏览器发送请求，不会转发到后端服务器。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              <span className="leading-12 mr-1 text-red-500">*</span>访问密码
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入访问密码"
              className="col-span-3"
              defaultValue={password}
              onChange={(ev) => setPassword(ev.target.value)}
            />
          </div>
          <hr />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="key" className="text-right">
              <span className="leading-12 mr-1 text-red-500">*</span>密钥
            </Label>
            <Input
              id="key"
              type="password"
              placeholder="请输入 Gemini 密钥"
              className="col-span-3"
              defaultValue={apiKey}
              onChange={(ev) => setApiKey(ev.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="proxy" className="text-right">
              接口地址
            </Label>
            <Input
              id="proxy"
              placeholder="请输入接口代理地址（可选）"
              className="col-span-3"
              defaultValue={apiProxy}
              onChange={(ev) => setApiProxy(ev.target.value)}
            />
          </div>
          <hr />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stt" className="text-right">
              语音识别
            </Label>
            <Select defaultValue="zh-CN">
              <SelectTrigger id="stt" className="col-span-3">
                <SelectValue placeholder="跟随系统" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tts" className="text-right">
              语音合成
            </Label>
            <Select defaultValue="zh-CN">
              <SelectTrigger id="tts" className="col-span-3">
                <SelectValue placeholder="跟随系统" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tts" className="text-right">
              合成声源
            </Label>
            <Select defaultValue="zh-CN-XiaoxiaoNeural">
              <SelectTrigger id="tts" className="col-span-3">
                <SelectValue placeholder="跟随系统" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN-XiaoxiaoNeural">晓晓</SelectItem>
                <SelectItem value="zh-CN-YunxiNeural">云希</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default memo(Setting)
