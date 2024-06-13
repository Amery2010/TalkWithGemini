import { memo, useEffect, useMemo, useState } from 'react'
import { EdgeSpeech } from '@xiangfa/polly'
import { useTranslation } from 'react-i18next'
import { MonitorDown } from 'lucide-react'
import { usePWAInstall } from 'react-use-pwa-install'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import ResponsiveDialog from '@/components/ResponsiveDialog'
import i18n from '@/plugins/i18n'
import locales from '@/constant/locales'
import { Model } from '@/constant/model'
import { useSettingStore } from '@/store/setting'
import { toPairs, values } from 'lodash-es'

type SettingProps = {
  open: boolean
  hiddenTalkPanel?: boolean
  onClose: () => void
}

const GEMINI_MODEL_LIST = process.env.NEXT_PUBLIC_GEMINI_MODEL_LIST

function Setting({ open, hiddenTalkPanel, onClose }: SettingProps) {
  const { t } = useTranslation()
  const pwaInstall = usePWAInstall()
  const settingStore = useSettingStore()
  const [password, setPassword] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiProxy, setApiProxy] = useState<string>('')
  const [uploadProxy, setUploadProxy] = useState<string>('')
  const [model, setModel] = useState<string>('')
  const [maxHistoryLength, setMaxHistoryLength] = useState<number>(0)
  const [lang, setLang] = useState<string>('')
  const [sttLang, setSttLang] = useState<string>('')
  const [ttsLang, setTtsLang] = useState<string>('')
  const [ttsVoice, setTtsVoice] = useState<string>('')
  const [assistantIndexUrl, setAssistantIndexUrl] = useState<string>('')
  const [topP, setTopP] = useState<number>(0.95)
  const [topK, setTopK] = useState<number>(64)
  const [temperature, setTemperature] = useState<number>(1)
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(8192)
  const [safety, setSafety] = useState<string>('none')
  const [autoStopRecord, setAutoStopRecord] = useState<boolean>(false)
  const isProtected = useMemo(() => {
    return settingStore.isProtected
  }, [settingStore.isProtected])
  const voiceOptions = useMemo(() => {
    return new EdgeSpeech({ locale: ttsLang }).voiceOptions || []
  }, [ttsLang])
  const modelOptions = useMemo(() => {
    const { setModel } = useSettingStore.getState()

    let modelList: string[] = []
    let defaultModel = 'gemini-1.5-flash-latest'
    const defaultModelList: string[] = Object.values(Model)
    const userModels: string[] = GEMINI_MODEL_LIST ? GEMINI_MODEL_LIST.split(',') : []

    userModels.forEach((modelName) => {
      if (modelName === 'all' || modelName === '+all') {
        for (const name of defaultModelList) {
          if (!modelList.includes(name)) modelList.push(name)
        }
      } else if (modelName === '-all') {
        modelList = modelList.filter((name) => !defaultModelList.includes(name))
      } else if (modelName.startsWith('-')) {
        modelList = modelList.filter((name) => name !== modelName.substring(1))
      } else if (modelName.startsWith('@')) {
        const name = modelName.substring(1)
        if (!modelList.includes(name)) modelList.push(name)
        setModel(name)
        defaultModel = name
      } else {
        modelList.push(modelName.startsWith('+') ? modelName.substring(1) : modelName)
      }
    })

    const models = modelList.length > 0 ? modelList : defaultModelList
    if (!models.includes(defaultModel)) {
      setModel(models[0])
    }

    return models
  }, [])

  const handleSubmit = () => {
    if (password !== settingStore.password) settingStore.setPassword(password)
    if (assistantIndexUrl !== settingStore.assistantIndexUrl) settingStore.setAssistantIndexUrl(assistantIndexUrl)
    if (apiKey !== settingStore.apiKey) settingStore.setApiKey(apiKey)
    if (apiProxy !== settingStore.apiProxy) settingStore.setApiProxy(apiProxy)
    if (uploadProxy !== settingStore.uploadProxy) settingStore.setUploadProxy(uploadProxy)
    if (model !== settingStore.model) settingStore.setModel(model)
    if (maxHistoryLength !== settingStore.maxHistoryLength) settingStore.setMaxHistoryLength(maxHistoryLength)
    if (lang !== settingStore.lang) settingStore.setLang(lang)
    if (sttLang !== settingStore.sttLang) settingStore.setSTTLang(sttLang)
    if (ttsLang !== settingStore.ttsLang) settingStore.setTTSLang(ttsLang)
    if (ttsVoice !== settingStore.ttsVoice) settingStore.setTTSVoice(ttsVoice)
    if (topP !== settingStore.topP) settingStore.setTopP(topP)
    if (topK !== settingStore.topK) settingStore.setTopK(topK)
    if (temperature !== settingStore.temperature) settingStore.setTemperature(temperature)
    if (maxOutputTokens !== settingStore.maxOutputTokens) settingStore.setMaxOutputTokens(maxOutputTokens)
    if (safety !== settingStore.safety) settingStore.setSafety(safety)
    if (autoStopRecord !== settingStore.autoStopRecord) settingStore.setAutoStopRecord(autoStopRecord)
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
    setUploadProxy(settingStore.uploadProxy)
    setModel(settingStore.model)
    setLang(settingStore.lang)
    setSttLang(settingStore.sttLang)
    setTtsLang(settingStore.ttsLang)
    setTtsVoice(settingStore.ttsVoice)
    setMaxHistoryLength(settingStore.maxHistoryLength)
    setAssistantIndexUrl(settingStore.assistantIndexUrl)
    setTopP(settingStore.topP)
    setTopK(settingStore.topK)
    setTemperature(settingStore.temperature)
    setMaxOutputTokens(settingStore.maxOutputTokens)
    setSafety(settingStore.safety)
    setAutoStopRecord(settingStore.autoStopRecord)
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
        <TabsList className="mx-auto grid h-fit w-full grid-cols-4">
          <TabsTrigger className="text-wrap" value="general">
            {t('generalSetting')}
          </TabsTrigger>
          <TabsTrigger className="text-wrap" value="model">
            {t('llmModel')}
          </TabsTrigger>
          <TabsTrigger className="text-wrap" value="params">
            {t('modelParams')}
          </TabsTrigger>
          <TabsTrigger className="text-wrap" disabled={hiddenTalkPanel} value="voice">
            {t('voiceServer')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
            {isProtected ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  <span className="leading-12 mr-1 text-red-500">*</span>
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
            ) : null}
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
            {pwaInstall ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stt" className="text-right">
                  {t('language')}
                </Label>
                <Button className="col-span-3" variant="ghost" onClick={() => pwaInstall()}>
                  <MonitorDown className="mr-1.5 h-4 w-4" />
                  {t('pwaInstall')}
                </Button>
              </div>
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="model">
          <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
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
                disabled={apiKey === ''}
                onChange={(ev) => setApiProxy(ev.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="uploadProxy" className="text-right">
                {t('uploadProxyUrl')}
              </Label>
              <Input
                id="uploadProxy"
                placeholder={t('uploadProxyUrlPlaceholder')}
                className="col-span-3"
                defaultValue={uploadProxy}
                disabled={apiKey === ''}
                onChange={(ev) => setUploadProxy(ev.target.value)}
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
                  {modelOptions.map((value) => {
                    return (
                      <SelectItem key={value} value={value}>
                        {value}
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
        <TabsContent value="params">
          <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topP" className="text-right">
                Top-P
              </Label>
              <div className="col-span-3 flex h-10">
                <Slider
                  id="topP"
                  className="flex-1"
                  defaultValue={[topP]}
                  max={1}
                  step={0.1}
                  onValueChange={(values) => setTopP(values[0])}
                />
                <span className="w-1/5 text-center text-sm leading-10">{topP}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topK" className="text-right">
                Top-K
              </Label>
              <div className="col-span-3 flex h-10">
                <Slider
                  id="topK"
                  className="flex-1"
                  defaultValue={[topK]}
                  max={128}
                  step={1}
                  onValueChange={(values) => setTopK(values[0])}
                />
                <span className="w-1/5 text-center text-sm leading-10">{topK}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temperature" className="text-right">
                {t('temperature')}
              </Label>
              <div className="col-span-3 flex h-10">
                <Slider
                  id="temperature"
                  className="flex-1"
                  defaultValue={[temperature]}
                  max={1}
                  step={0.1}
                  onValueChange={(values) => setTemperature(values[0])}
                />
                <span className="w-1/5 text-center text-sm leading-10">{temperature}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxOutputTokens" className="text-right">
                {t('maxOutputTokens')}
              </Label>
              <div className="col-span-3 flex h-10">
                <Slider
                  id="maxOutputTokens"
                  className="flex-1"
                  defaultValue={[maxOutputTokens]}
                  max={8196}
                  step={1}
                  onValueChange={(values) => setMaxOutputTokens(values[0])}
                />
                <span className="w-1/5 text-center text-sm leading-10">{maxOutputTokens}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="safety" className="text-right">
                {t('safety')}
              </Label>
              <div className="col-span-3 flex h-10">
                <RadioGroup
                  id="safety"
                  className="grid w-full grid-cols-4"
                  defaultValue={safety}
                  onValueChange={(value) => setSafety(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">{t('none')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low">{t('low')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="middle" id="middle" />
                    <Label htmlFor="middle">{t('middle')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high">{t('high')}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="voice">
          <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="autoStopRecord" className="text-right">
                {t('autoStopRecord')}
              </Label>
              <Switch checked={autoStopRecord} onCheckedChange={setAutoStopRecord} />
              <span className="text-center">{autoStopRecord ? t('settingEnable') : t('settingDisable')}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveDialog>
  )
}

export default memo(Setting)
