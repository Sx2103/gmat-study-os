import { useState, useEffect } from 'react'

export function useLocalStorage(key, init) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return typeof init === 'function' ? init() : init
      return JSON.parse(raw)
    } catch {
      return typeof init === 'function' ? init() : init
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('[GMAT OS] localStorage write failed:', e)
    }
  }, [key, value])

  return [value, setValue]
}
