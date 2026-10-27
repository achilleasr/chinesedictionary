'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type WordResult = { id: number; hanzi: string; pinyin: string; meaning: string | null }
type RadicalResult = {
  id: number,
  character: string,
  pinyin: string | null,
  meaning: string | null,
}

export default function DictionarySearch({
  lang,
  placeholder,
  noResultsText,
}: {
  lang: 'en' | 'gr'
  placeholder: string
  noResultsText: string
}) {
  const [query, setQuery] = useState('')
  const [words, setWords] = useState<WordResult[]>([])
  const [radicals, setRadicals] = useState<RadicalResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const qs = lang === 'gr' ? '?lang=gr' : ''
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      abortRef.current?.abort()
      setWords([])
      setRadicals([])
      setSearched(false)
      setLoading(false)
      return
    }

    // debounce, and cancel any request still in flight
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&lang=${lang}`,
          { signal: ctrl.signal }
        )
        if (!res.ok) throw new Error('search failed')
        const data = await res.json()
        setWords(data.words)
        setRadicals(data.radicals)
        setSearched(true)
        setLoading(false)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setWords([])
          setRadicals([])
          setSearched(true)
          setLoading(false)
        }
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, lang])

  const chip =
    'flex max-w-[14rem] flex-col rounded border bg-white px-3 py-2 hover:border-red-500 hover:text-red-500 dark:bg-gray-900'

  return (
    <div className="max-w-2xl mx-auto">
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 outline-none focus:border-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />

      <div className={`mt-4 space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {radicals.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {radicals.map((r) => (
              <Link
                key={`r${r.id}`}
                href={`/radical/${r.id}${qs}`}
                className={`${chip} border-dashed border-red-300 dark:border-red-900`}
              >
                <span className="text-gray-900 dark:text-gray-100">
                  <span className="text-2xl">{r.character}</span>{' '}
                  <span className="text-sm text-gray-400">
                    {r.pinyin ? `${r.pinyin} ` : ''}R{r.id}
                  </span>
                </span>
                {r.meaning && (
                  <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {r.meaning}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {words.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {words.map((w) => (
              <Link
                key={`w${w.id}`}
                href={`/word/${w.id}${qs}`}
                className={`${chip} border-gray-300 dark:border-gray-700`}
              >
                <span className="text-gray-900 dark:text-gray-100">
                  <span className="text-2xl">{w.hanzi}</span>{' '}
                  <span className="text-sm text-gray-400">{w.pinyin}</span>
                </span>
                {w.meaning && (
                  <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {w.meaning}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {searched && !loading && words.length === 0 && radicals.length === 0 && (
        <p className="mt-6 text-center text-gray-400">{noResultsText}</p>
      )}
    </div>
  )
}
