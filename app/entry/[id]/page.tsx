// app/entry/[id]/page.tsx
// Full detail view for a single dictionary entry

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Entry } from '@/app/lib/types'

// We load JSON server-side at request time (static or dynamic depending on config)
async function getAllEntries(): Promise<Entry[]> {
  const { readFileSync } = await import('fs')
  const { join } = await import('path')
  const filePath = join(process.cwd(), 'public', 'data', 'entries.json')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

async function getEntry(id: string): Promise<Entry | undefined> {
  const entries = await getAllEntries()
  const decoded = decodeURIComponent(id)   // ← this is the key fix
  return entries.find(e => e.id === decoded)
}

// Generate all static paths at build time
export async function generateStaticParams() {
  const entries = await getAllEntries()
  return entries.map(e => ({ id: e.id }))
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getEntry(id)   // getEntry now decodes internally
  if (!entry) notFound()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors mb-8"
        >
          ← Back to search
        </Link>

        {/* Hero: big character */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                        dark:border-gray-800 shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6">
            <span className="text-8xl font-bold text-gray-900 dark:text-white leading-none select-all">
              {entry.char}
            </span>
            <div className="pt-2">
              {entry.pinyin && (
                <p className="text-2xl text-red-500 font-medium">{entry.pinyin}</p>
              )}
              {entry.pos && (
                <span className="mt-2 inline-block text-xs text-gray-400 bg-gray-100
                                 dark:bg-gray-800 px-2 py-1 rounded-full font-mono">
                  {entry.pos}
                </span>
              )}
              {entry.level && (
                <span className="mt-2 ml-2 inline-block text-xs text-gray-400 bg-gray-100
                                 dark:bg-gray-800 px-2 py-1 rounded-full">
                  Level {entry.level}
                </span>
              )}
            </div>
          </div>

          {/* Definitions */}
          <div className="mt-6 space-y-3">
            {entry.def_gr && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                  Ελληνικά
                </span>
                <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                  {entry.def_gr}
                </p>
              </div>
            )}
            {entry.def_en && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                  English
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {entry.def_en}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Etymology */}
        {entry.etymology && (
          <Section title="Etymology / Components">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {entry.etymology}
            </p>
          </Section>
        )}

        {/* Related / compound words — each word linked */}
        {entry.related && entry.related.length > 0 && (
          <Section title="Related & Compound Words">
            <LinkedWordList words={entry.related} />
          </Section>
        )}

        {/* Radical references */}
        {entry.radical_refs && entry.radical_refs.length > 0 && (
          <Section title="Radical">
            <div className="flex flex-wrap gap-2">
              {entry.radical_refs.map(ref => (
                <Link
                  key={ref}
                  href={`/radicals#${ref}`}
                  className="text-sm px-3 py-1 bg-amber-50 dark:bg-amber-900/20
                             text-amber-700 dark:text-amber-400 rounded-lg
                             hover:bg-amber-100 transition-colors font-mono"
                >
                  {ref}
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Components */}
        {entry.components && (
          <Section title="Component Characters">
            <LinkedWordList words={entry.components.split(/\s+/).filter(Boolean)} />
          </Section>
        )}

      </div>
    </main>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                    dark:border-gray-800 shadow-sm p-6 mb-4">
      <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function LinkedWordList({ words }: { words: string[] }) {
  // Each item might be a full string like "学习 xuéxí to study"
  // We try to find the leading hanzi and make it a link, keep the rest as label.
  return (
    <div className="flex flex-wrap gap-2">
      {words.map((word, i) => {
        const hanziMatch = word.match(/^([\u4e00-\u9fff]+)/)
        const hanzi = hanziMatch?.[1]
        const rest = hanzi ? word.slice(hanzi.length).trim() : word

        if (hanzi) {
          // ID matches how we generated it: char_pinyinplain (or just char)
          // We use the character itself as a search — link to search page with prefill
          return (
            <span key={i} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800
                                      rounded-lg px-3 py-1.5 text-sm">
              <Link
                href={`/entry/${encodeURIComponent(hanzi)}`}
                className="font-bold text-gray-900 dark:text-white hover:text-red-500 transition-colors"
              >
                {hanzi}
              </Link>
              {rest && (
                <span className="text-gray-400 text-xs">{rest}</span>
              )}
            </span>
          )
        }

        return (
          <span key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
            {word}
          </span>
        )
      })}
    </div>
  )
}
