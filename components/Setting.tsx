import { memo, useEffect, useMemo, useState } from 'react'
import { EdgeSpeechTTS } from '@lobehub/tts'
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
import locales from '@/constant/locales'
import { toPairs, values } from 'lodash-es'

type SettingProps = {
  open: boolean
  onClose: () => void
}

function Setting({ open, onClose }: SettingProps) {
  const settingStore = useSettingStore()
  const [password, setPassword] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiProxy, setApiProxy] = useState<string>('')
  const [sttLang, setSttLang] = useState<string>('')
  const [ttsLang, setTtsLang] = useState<string>('')
  const [ttsVoice, setTtsVoice] = useState<string>('')
  const voiceOptions = useMemo(() => {
    return new EdgeSpeechTTS({ locale: ttsLang }).voiceOptions || []
  }, [ttsLang])

  const handleSubmit = () => {
    if (password !== settingStore.password) settingStore.setPassword(password)
    if (apiKey !== settingStore.apiKey) settingStore.setApiKey(apiKey)
    if (apiProxy !== settingStore.apiProxy) settingStore.setApiProxy(apiProxy)
    if (sttLang !== settingStore.sttLang) settingStore.setSTTLang(sttLang)
    if (ttsLang !== settingStore.ttsLang) settingStore.setTTSLang(ttsLang)
    if (ttsVoice !== settingStore.ttsVoice) settingStore.setTTSVoice(ttsVoice)
    onClose()
  }
  const handleClose = (open: boolean) => {
    if (!open) onClose()
  }

  const handleTTSChange = (value: string) => {
    setTtsLang(value)
    const options = new EdgeSpeechTTS({ locale: value }).voiceOptions
    if (options) {
      setTtsVoice(options[0].value as string)
    }
  }

  useEffect(() => {
    setPassword(settingStore.password)
    setApiKey(settingStore.apiKey)
    setApiProxy(settingStore.apiProxy)
    setSttLang(settingStore.sttLang)
    setTtsLang(settingStore.ttsLang)
    setTtsVoice(settingStore.ttsVoice)
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
            <Select value={sttLang} onValueChange={setSttLang}>
              <SelectTrigger id="stt" className="col-span-3">
                <SelectValue placeholder="跟随系统" />
              </SelectTrigger>
              <SelectContent>
                {toPairs(locales).map((kv) => {
                  return (
                    <SelectItem key={kv[0]} value={kv[0]}>
                      {kv[1]}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tts" className="text-right">
              语音合成
            </Label>
            <Select value={ttsLang} onValueChange={handleTTSChange}>
              <SelectTrigger id="tts" className="col-span-3">
                <SelectValue placeholder="跟随系统" />
              </SelectTrigger>
              <SelectContent>
                {toPairs(locales).map((kv) => {
                  return (
                    <SelectItem key={kv[0]} value={kv[0]}>
                      {kv[1]}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tts" className="text-right">
              合成声源
            </Label>
            <Select value={ttsVoice} onValueChange={setTtsVoice}>
              <SelectTrigger id="tts" className="col-span-3">
                <SelectValue placeholder="跟随系统" />
              </SelectTrigger>
              <SelectContent>
                {values(voiceOptions).map((option) => {
                  return (
                    <SelectItem key={option.value} value={option.value as string}>
                      {option.label}
                    </SelectItem>
                  )
                })}
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
