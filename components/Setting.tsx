import { memo, useEffect, useMemo, useState } from 'react'
import { EdgeSpeech } from '@xiangfa/polly'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import ResponsiveDialog from '@/components/ResponsiveDialog'
import i18n from '@/plugins/i18n'
import locales from '@/constant/locales'
import { Model } from '@/constant/model'
import { useSettingStore } from '@/store/setting'
import { toPairs, values, entries } from 'lodash-es'

type SettingProps = {
  open: boolean
  hiddenTalkPanel?: boolean
  onClose: () => void
}

function Setting({ open, hiddenTalkPanel, onClose }: SettingProps) {
  const { t } = useTranslation()
  const settingStore = useSettingStore()
  const [password, setPassword] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiProxy, setApiProxy] = useState<string>('')
  const [model, setModel] = useState<string>('')
  const [maxHistoryLength, setMaxHistoryLength] = useState<number>(0)
  const [lang, setLang] = useState<string>('')
  const [sttLang, setSttLang] = useState<string>('')
  const [ttsLang, setTtsLang] = useState<string>('')
  const [ttsVoice, setTtsVoice] = useState<string>('')
  const [assistantIndexUrl, setAssistantIndexUrl] = useState<string>('')
  const isProtected = useMemo(() => {
    return settingStore.isProtected
  }, [settingStore.isProtected])
  const voiceOptions = useMemo(() => {
    return new EdgeSpeech({ locale: ttsLang }).voiceOptions || []
  }, [ttsLang])

  const handleSubmit = () => {
    if (password !== settingStore.password) settingStore.setPassword(password)
    if (assistantIndexUrl !== settingStore.assistantIndexUrl) settingStore.setAssistantIndexUrl(assistantIndexUrl)
    if (apiKey !== settingStore.apiKey) settingStore.setApiKey(apiKey)
    if (apiProxy !== settingStore.apiProxy) settingStore.setApiProxy(apiProxy)
    if (model !== settingStore.model) settingStore.setModel(model)
    if (maxHistoryLength !== settingStore.maxHistoryLength) settingStore.setMaxHistoryLength(maxHistoryLength)
    if (lang !== settingStore.lang) settingStore.setLang(lang)
    if (sttLang !== settingStore.sttLang) settingStore.setSTTLang(sttLang)
    if (ttsLang !== settingStore.ttsLang) settingStore.setTTSLang(ttsLang)
    if (ttsVoice !== settingStore.ttsVoice) settingStore.setTTSVoice(ttsVoice)
    onClose()
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
    setModel(settingStore.model)
    setLang(settingStore.lang)
    setSttLang(settingStore.sttLang)
    setTtsLang(settingStore.ttsLang)
    setTtsVoice(settingStore.ttsVoice)
    setMaxHistoryLength(settingStore.maxHistoryLength)
    setAssistantIndexUrl(settingStore.assistantIndexUrl)
  }, [settingStore])

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={t('setting')}
      description={t('settingDescription')}
      footer={
        <Button className="flex-1" type="submit" onClick={handleSubmit}>
          {t('save')}
        </Button>
      }
    >
      <Tabs className="max-sm:px-4" defaultValue="general">
        <TabsList className="mx-auto grid w-full grid-cols-3">
          <TabsTrigger value="general">{t('generalSetting')}</TabsTrigger>
          <TabsTrigger value="model">{t('llmModel')}</TabsTrigger>
          <TabsTrigger disabled={hiddenTalkPanel} value="voice">
            {t('voiceServer')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="grid w-full gap-4 px-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                {isProtected ? <span className="leading-12 mr-1 text-red-500">*</span> : null}
                {t('accessPassword')}
              </Label>
              <Input
                id="password"
                type="password"
                disabled={!isProtected}
                placeholder={t('accessPasswordPlaceholder')}
                className="col-span-3"
                defaultValue={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assistantIndexUrl" className="text-right">
                {t('assistantMarketUrl')}
              </Label>
              <Input
                id="assistantIndexUrl"
                placeholder={t('accessPasswordPlaceholder')}
                className="col-span-3"
                defaultValue={assistantIndexUrl}
                onChange={(ev) => setAssistantIndexUrl(ev.target.value)}
              />
            </div>
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
        </TabsContent>
        <TabsContent value="model">
          <div className="grid w-full gap-4 px-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key" className="text-right">
                {!isProtected ? <span className="leading-12 mr-1 text-red-500">*</span> : null}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                {t('defaultModel')}
              </Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model" className="col-span-3">
                  <SelectValue placeholder={t('selectDefaultModel')} />
                </SelectTrigger>
                <SelectContent>
                  {entries(Model).map(([key, value]) => {
                    return (
                      <SelectItem key={value} value={value as string}>
                        {key}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxHistoryLength" className="text-right">
                {t('maxHistoryLength')}
              </Label>
              <div className="col-span-3 flex h-10">
                <Slider
                  id="maxHistoryLength"
                  className="flex-1"
                  defaultValue={[maxHistoryLength]}
                  max={50}
                  step={1}
                  onValueChange={(values) => setMaxHistoryLength(values[0])}
                />
                <span className="w-1/5 text-center text-sm leading-10">
                  {maxHistoryLength === 0 ? t('unlimited') : maxHistoryLength}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="voice">
          <div className="grid w-full gap-4 px-4 py-4">
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
              <Label htmlFor="ttsVoice" className="text-right">
                {t('soundSource')}
              </Label>
              <Select value={ttsVoice} onValueChange={setTtsVoice}>
                <SelectTrigger id="ttsVoice" className="col-span-3">
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
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveDialog>
  )
}

export default memo(Setting)
