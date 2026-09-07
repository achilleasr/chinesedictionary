'use client'

import { useState, useEffect, useRef } from 'react'
import Fuse from 'fuse.js'
import Link from 'next/link'
import type { Entry } from '../lib/types'

const FUSE_OPTIONS = {
  keys: [
    { name: 'char',         weight: 2.0 },
    { name: 'pinyin',       weight: 1.5 },
    { name: 'pinyin_plain', weight: 1.4 },
    { name: 'def_gr',       weight: 1.0 },
    { name: 'def_en',       weight: 1.0 },
    { name: 'related',      weight: 0.5 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 1,
}

export default function DictionarySearch() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Entry[]>([])
  const [ready, setReady]       = useState(false)
  const fuseRef = useRef<Fuse<Entry> | null>(null)

  useEffect(() => {
    fetch('/data/entries.json')
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
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search in Chinese, pinyin, Greek or English…"
          className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-red-400
                     dark:bg-gray-900 dark:border-gray-700 dark:text-white
                     disabled:opacity-40 transition-opacity"
          autoFocus
          disabled={!ready}
        />
        {!ready && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">
            Loading…
          </span>
        )}
      </div>

      {ready && query && results.length === 0 && (
        <p className="mt-4 text-sm text-gray-400 text-center">
          No results for &ldquo;{query}&rdquo;
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {results.map(entry => (
          <SearchResultCard key={entry.id} entry={entry} />
        ))}
      </ul>
    </div>
  )
}

function SearchResultCard({ entry }: { entry: Entry }) {
  return (
    <li>
      <Link
        href={`/entry/${entry.id}`}
        className="block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100
                   dark:border-gray-700 shadow-sm hover:shadow-md hover:border-red-200
                   dark:hover:border-red-800 transition-all group"
      >
        {/* Top row: character + pinyin + POS */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">
            {entry.char}
          </span>
          {entry.pinyin && (
            <span className="text-base text-red-500 font-medium">
              {entry.pinyin}
            </span>
          )}
          {entry.pos && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700
                             px-2 py-0.5 rounded-full font-mono">
              {entry.pos}
            </span>
          )}
        </div>

        {/* Greek definition — primary */}
        {entry.def_gr && (
          <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 leading-snug">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 mr-1">ΕΛ</span>
            {entry.def_gr}
          </p>
        )}

        {/* English definition — secondary, visually lower */}
        {entry.def_en && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 leading-snug">
            <span className="uppercase tracking-widest mr-1">EN</span>
            {entry.def_en}
          </p>
        )}
      </Link>
    </li>
  )
}
