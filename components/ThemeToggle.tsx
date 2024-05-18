import { memo } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import Button from '@/components/Button'

function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme, systemTheme } = useTheme()

  const handleThemeChange = () => {
    if (theme === 'system') {
      if (systemTheme === 'dark') {
        setTheme('light')
      } else if (systemTheme === 'light') {
        setTheme('dark')
      }
    } else {
      setTheme('system')
    }
  }

  return (
    <Button
      title={t('changeTheme')}
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => handleThemeChange()}
    >
      <Moon className="absolute h-5 w-5 scale-0 transition-all dark:scale-100" />
      <Sun className="absolute h-5 w-5 scale-100 transition-all dark:scale-0" />
    </Button>
  )
}

export default memo(ThemeToggle)
