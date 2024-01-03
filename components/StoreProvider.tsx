'use client'
import { useLayoutEffect } from 'react'
import { useSettingStore } from '@/store/setting'
import { useMessageStore } from '@/store/chat'

function StoreProvider({ children }: { children: React.ReactNode }) {
  const { init: initSettingStore } = useSettingStore()
  const { init: initMessageStore } = useMessageStore()

  useLayoutEffect(() => {
    initSettingStore()
    initMessageStore()
  }, [initSettingStore, initMessageStore])
  return children
}

export default StoreProvider
