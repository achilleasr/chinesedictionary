// app/index/page.tsx
// Full alphabetical index — every entry, grouped by pinyin initial, linked

import Link from 'next/link'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Entry } from '../lib/types'

function getAllEntries(): Entry[] {
  const filePath = join(process.cwd(), 'public', 'd_data', 'entries.json')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

function groupByInitial(entries: Entry[]): Record<string, Entry[]> {
  const groups: Record<string, Entry[]> = {}
  for (const entry of entries) {
    // Group by first letter of pinyin (without tone); fall back to '#'
    let key = '#'
    if (entry.pinyin_plain) {
      key = entry.pinyin_plain[0].toUpperCase()
    } else if (entry.pinyin) {
      // Strip tone marks
      const plain = entry.pinyin.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      key = plain[0]?.toUpperCase() || '#'
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }
  return groups
}

export default function IndexPage() {
  const entries = getAllEntries()
  const groups = groupByInitial(entries)
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Full Index</h1>
            <p className="text-sm text-gray-400 mt-1">{entries.length} entries</p>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            ← Search
          </Link>
        </div>

        {/* Jump links */}
        <div className="flex flex-wrap gap-2 mb-8 p-4 bg-white dark:bg-gray-900
                        rounded-xl border border-gray-100 dark:border-gray-800">
          {sortedKeys.map(key => (
            <a
              key={key}
              href={`#group-${key}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-mono
                         text-gray-500 hover:bg-red-50 hover:text-red-500
                         dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            >
              {key}
            </a>
          ))}
        </div>

        {/* Groups */}
        <div className="space-y-10">
          {sortedKeys.map(key => (
            <section key={key} id={`group-${key}`}>
              <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3
                             sticky top-0 bg-gray-50 dark:bg-gray-950 py-2">
                {key} · {groups[key].length} words
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {groups[key]
                  .sort((a, b) => (a.pinyin || '').localeCompare(b.pinyin || ''))
                  .map(entry => (
                    <Link
                      key={entry.id}
                      href={`/entry/${entry.id}`}
                      className="flex items-baseline gap-2 px-3 py-2 bg-white dark:bg-gray-900
                                 rounded-lg border border-gray-100 dark:border-gray-800
                                 hover:border-red-200 dark:hover:border-red-800
                                 hover:shadow-sm transition-all group"
                    >
                      <span className="text-lg font-bold text-gray-900 dark:text-white
                                       group-hover:text-red-600 transition-colors">
                        {entry.char}
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        {entry.pinyin}
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
