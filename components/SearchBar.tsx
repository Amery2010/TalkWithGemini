import { useState, memo } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils'
import { isFunction } from 'lodash-es'

type Props = {
  className?: string
  onSearch: (text: string) => void
  onClear?: () => void
}

function SearchBar(props: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState<string>('')
  const handleClear = () => {
    setQuery('')
    if (isFunction(props.onClear)) props.onClear()
  }

  return (
    <div className={cn('relative w-full', props.className)}>
      <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        name="query"
        placeholder={t('searchPlaceholder')}
        className="px-7"
        value={query}
        autoFocus
        onChange={(ev) => {
          setQuery(ev.target.value)
          props.onSearch(ev.target.value)
        }}
      />
      {query !== '' ? (
        <X
          className="absolute right-2 top-3 h-4 w-4 cursor-pointer text-muted-foreground"
          onClick={() => handleClear()}
        />
      ) : null}
    </div>
  )
}

export default memo(SearchBar)
