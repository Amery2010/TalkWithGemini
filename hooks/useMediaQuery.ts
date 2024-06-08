import { useState, useLayoutEffect, useCallback } from 'react'

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

function useMediaQuery(
  query: string,
  { defaultValue = false, initializeWithValue = true }: UseMediaQueryOptions = {},
): boolean {
  const getMatches = useCallback(
    (query: string): boolean => {
      if (typeof window === 'undefined') {
        return defaultValue
      }
      return window.matchMedia(query).matches
    },
    [defaultValue],
  )

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query)
    }
    return defaultValue
  })

  // Handles the change event of the media query.
  const handleChange = useCallback(() => {
    setMatches(getMatches(query))
  }, [getMatches, query])

  useLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)

    // Triggered at the first client-side load and if query changes
    handleChange()

    // Use deprecated `addListener` and `removeListener` to support Safari < 14 (#135)
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange)
    } else {
      matchMedia.addEventListener('change', handleChange)
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange)
      } else {
        matchMedia.removeEventListener('change', handleChange)
      }
    }
  }, [query, handleChange])

  return matches
}

export default useMediaQuery
