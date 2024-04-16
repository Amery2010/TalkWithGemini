import { memo, useEffect, useMemo, useState } from 'react'
import { EdgeSpeech } from '@xiangfa/polly'
import { useTranslation } from 'react-i18next'
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
import i18n from '@/plugins/i18n'
import locales from '@/constant/locales'
import { useSettingStore } from '@/store/setting'
import { toPairs, values } from 'lodash-es'

type SettingProps = {
  open: boolean
  onClose: () => void
}

function Setting({ open, onClose }: SettingProps) {
  const { t } = useTranslation()
  const settingStore = useSettingStore()
  const [password, setPassword] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiProxy, setApiProxy] = useState<string>('')
  const [lang, setLang] = useState<string>('')
  const [sttLang, setSttLang] = useState<string>('')
  const [ttsLang, setTtsLang] = useState<string>('')
  const [ttsVoice, setTtsVoice] = useState<string>('')
  const isProtected = useMemo(() => {
    return settingStore.isProtected
  }, [settingStore.isProtected])
  const voiceOptions = useMemo(() => {
    return new EdgeSpeech({ locale: ttsLang }).voiceOptions || []
  }, [ttsLang])

  const handleSubmit = () => {
    if (password !== settingStore.password) settingStore.setPassword(password)
    if (apiKey !== settingStore.apiKey) settingStore.setApiKey(apiKey)
    if (apiProxy !== settingStore.apiProxy) settingStore.setApiProxy(apiProxy)
    if (lang !== settingStore.lang) settingStore.setLang(lang)
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
    const options = new EdgeSpeech({ locale: value }).voiceOptions
    if (options) {
      setTtsVoice(options[0].value as string)
    }
  }

  const handleLangChange = (value: string) => {
    i18n.changeLanguage(value)
    setLang(value)
    setSttLang(value)
    setTtsLang(value)
    handleTTSChange(value)
  }

  const LangOptions = () => {
    return toPairs(locales).map((kv) => {
      return (
        <SelectItem key={kv[0]} value={kv[0]}>
          {kv[1]}
        </SelectItem>
      )
    })
  }

  useEffect(() => {
    setPassword(settingStore.password)
    setApiKey(settingStore.apiKey)
    setApiProxy(settingStore.apiProxy)
    setLang(settingStore.lang)
    setSttLang(settingStore.sttLang)
    setTtsLang(settingStore.ttsLang)
    setTtsVoice(settingStore.ttsVoice)
  }, [settingStore])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="overflow-y-auto max-sm:h-full landscape:max-md:h-full">
        <DialogHeader>
          <DialogTitle>{t('setting')}</DialogTitle>
          <DialogDescription>{t('settingDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid justify-start gap-4 py-4">
          {isProtected ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  <span className="leading-12 mr-1 text-red-500">*</span>
                  {t('accessPassword')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('accessPasswordPlaceholder')}
                  className="col-span-3"
                  defaultValue={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                />
              </div>
              <hr />
            </>
          ) : null}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="key" className="text-right">
              <span className="leading-12 mr-1 text-red-500">*</span>
              {t('geminiKey')}
            </Label>
            <Input
              id="key"
              type="password"
              placeholder={t('geminiKeyPlaceholder')}
              className="col-span-3"
              defaultValue={apiKey}
              onChange={(ev) => setApiKey(ev.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="proxy" className="text-right">
              {t('apiProxyUrl')}
            </Label>
            <Input
              id="proxy"
              placeholder={t('apiProxyUrlPlaceholder')}
              className="col-span-3"
              defaultValue={apiProxy}
              onChange={(ev) => setApiProxy(ev.target.value)}
            />
          </div>
          <hr />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stt" className="text-right">
              {t('speechRecognition')}
            </Label>
            <Select value={sttLang} onValueChange={setSttLang}>
              <SelectTrigger id="stt" className="col-span-3">
                <SelectValue placeholder={t('followTheSystem')} />
              </SelectTrigger>
              <SelectContent>
                <LangOptions />
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tts" className="text-right">
              {t('speechSynthesis')}
            </Label>
            <Select value={ttsLang} onValueChange={handleTTSChange}>
              <SelectTrigger id="tts" className="col-span-3">
                <SelectValue placeholder={t('followTheSystem')} />
              </SelectTrigger>
              <SelectContent>
                <LangOptions />
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tts" className="text-right">
              {t('soundSource')}
            </Label>
            <Select value={ttsVoice} onValueChange={setTtsVoice}>
              <SelectTrigger id="tts" className="col-span-3">
                <SelectValue placeholder={t('followTheSystem')} />
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
          <hr />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stt" className="text-right">
              {t('language')}
            </Label>
            <Select value={lang} onValueChange={handleLangChange}>
              <SelectTrigger id="stt" className="col-span-3">
                <SelectValue placeholder={t('followTheSystem')} />
              </SelectTrigger>
              <SelectContent>
                <LangOptions />
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default memo(Setting)
