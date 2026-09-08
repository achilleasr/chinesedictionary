'use client'

import { useState, useEffect, useRef } from 'react'
import Fuse from 'fuse.js'
import Link from 'next/link'
import type { Entry } from '@/app/lib/types'

const FUSE_OPTIONS = {
  keys: [
    { name: 'char',          weight: 2.0 },
    { name: 'pinyin',        weight: 1.5 },
    { name: 'pinyin_plain',  weight: 1.4 },
    { name: 'def_gr',        weight: 1.0 },
    { name: 'def_en',        weight: 1.0 },
    { name: 'related',       weight: 0.5 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 1,
}

// Extract just the definition part of def_gr (before first semicolon that isn't inside an example)
function extractShortDef(raw: string | undefined): { gr: string | null; en: string | null } {
  if (!raw) return { gr: null, en: null }

  // Remove annotation tags
  const cleaned = raw
    .replace(/<<[^>]+>>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()

  // Take only the first semicolon chunk — that's the pure definition
  const first = cleaned.split(';')[0].trim()

  // Split into Greek and English parts
  const parts = first.split(',').map(p => p.trim()).filter(Boolean)
  const gr: string[] = []
  const en: string[] = []

  for (const p of parts) {
    if (!p) continue
    if (/[\u4e00-\u9fff]/.test(p)) continue  // skip hanzi leaking in
    if (/[\u0370-\u03ff\u1f00-\u1fff]/.test(p)) {
      gr.push(p)
    } else if (/^[a-z]/i.test(p)) {
      en.push(p)
    }
  }

  return {
    gr: gr.slice(0, 3).join(', ') || null,
    en: en.slice(0, 2).join(', ') || null,
  }
}

export default function DictionarySearch() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Entry[]>([])
  const [ready, setReady]     = useState(false)
  const fuseRef = useRef<Fuse<Entry> | null>(null)

  useEffect(() => {
    fetch('/d_data/entries.json')
      .then(r => r.json())
      .then((data: Entry[]) => {
        fuseRef.current = new Fuse(data, FUSE_OPTIONS)
        setReady(true)
      })
  }, [])

  useEffect(() => {
    if (!fuseRef.current || !query.trim()) {
      setResults([])
      return
    }
    const hits = fuseRef.current.search(query.trim(), { limit: 30 })
    setResults(hits.map(h => h.item))
  }, [query])

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Search input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 text-lg select-none">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Chinese · Pinyin · Greek · English"
          className="w-full pl-11 pr-4 py-3.5 text-base rounded-2xl
                     border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900
                     text-gray-900 dark:text-white
                     placeholder:text-gray-300 dark:placeholder:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-red-400/60
                     disabled:opacity-40 transition-all shadow-sm"
          autoFocus
          disabled={!ready}
        />
        {!ready && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300 animate-pulse">
            loading…
          </span>
        )}
        {ready && query && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {results.length} results
          </span>
        )}
      </div>

      {/* Empty state */}
      {ready && !query && (
        <p className="mt-6 text-center text-sm text-gray-300 dark:text-gray-600">
          {/* intentionally blank — let the placeholder speak */}
        </p>
      )}

      {/* No results */}
      {ready && query && results.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm text-gray-400">No results for <span className="font-medium text-gray-600 dark:text-gray-300">&ldquo;{query}&rdquo;</span></p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map(entry => (
            <SearchCard key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchCard({ entry }: { entry: Entry }) {
  const { gr, en } = extractShortDef(entry.def_gr)

  return (
    <li>
      <Link
        href={`/entry/${encodeURIComponent(entry.id)}`}
        className="flex items-center gap-4 px-5 py-4
                   bg-white dark:bg-gray-900
                   border border-gray-100 dark:border-gray-800
                   rounded-2xl shadow-sm
                   hover:border-red-200 dark:hover:border-red-900
                   hover:shadow-md
                   transition-all group"
      >
        {/* Left: big character */}
        <div className="shrink-0 w-14 text-center">
          <span className="text-4xl font-bold text-gray-900 dark:text-white
                           group-hover:text-red-600 dark:group-hover:text-red-400
                           transition-colors leading-none">
            {entry.char}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-gray-100 dark:bg-gray-800 shrink-0" />

        {/* Right: definitions */}
        <div className="flex-1 min-w-0">

          {/* Pinyin + POS row */}
          <div className="flex items-center gap-2 mb-1.5">
            {entry.pinyin && (
              <span className="text-sm font-medium text-red-500 tracking-wide">
                {entry.pinyin}
              </span>
            )}
            {entry.pos && (
              <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800
                               px-1.5 py-0.5 rounded-full font-mono leading-none">
                {entry.pos}
              </span>
            )}
          </div>

          {/* Greek definition — primary */}
          {gr && (
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug truncate">
              {gr}
            </p>
          )}

          {/* English definition — secondary */}
          {en && (
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug mt-0.5 truncate">
              {en}
            </p>
          )}

          {/* Fallback if both parsed to null */}
          {!gr && !en && entry.def_gr && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug truncate">
              {entry.def_gr.split(';')[0].slice(0, 80)}
            </p>
          )}
        </div>

        {/* Arrow */}
        <div className="shrink-0 text-gray-200 dark:text-gray-700 group-hover:text-red-300
                        dark:group-hover:text-red-700 transition-colors text-lg">
          →
        </div>
      </Link>
    </li>
  )
}
