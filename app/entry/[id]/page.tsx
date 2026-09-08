// app/entry/[id]/page.tsx

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Entry } from '@/app/lib/types'

// ── Data loading ─────────────────────────────────────────────────────────────

function getAllEntries(): Entry[] {
  const filePath = join(process.cwd(), 'public', 'd_data', 'entries.json')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

async function getEntry(id: string): Promise<Entry | undefined> {
  const entries = getAllEntries()
  const decoded = decodeURIComponent(id)
  return entries.find(e => e.id === decoded || e.id === decoded.split('_')[0])
}

export async function generateStaticParams() {
  return getAllEntries().map(e => ({ id: e.id }))
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

function hasHanzi(s: string) {
  return /[\u4e00-\u9fff]/.test(s)
}

function hasPinyin(s: string) {
  return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(s) || /^[a-z]+\d$/.test(s.trim())
}

interface ParsedDef {
  definitions: string[]        // pure Greek/English meaning words
  examples: ExampleSentence[]  // extracted Chinese + translation pairs
  measureWord?: string         // <<ΜΛ:X>> annotation
  crossRefs?: string[]         // <ΔΕΣ::X/Y> cross-reference annotations
}

interface ExampleSentence {
  zh: string
  pinyin?: string
  translation?: string
}

function parseDefField(raw: string | undefined): ParsedDef {
  if (!raw) return { definitions: [], examples: [] }

  const result: ParsedDef = { definitions: [], examples: [], crossRefs: [] }

  // Extract and remove <<ΜΛ:X>> measure word annotations
  const mwMatch = raw.match(/<<ΜΛ[：:]\s*([^>]+)>>/i) || raw.match(/<<ML[：:]\s*([^>]+)>>/i)
  if (mwMatch) {
    result.measureWord = mwMatch[1].trim()
    raw = raw.replace(mwMatch[0], '')
  }

  // Extract and remove <ΔΕΣ::X/Y> cross-reference annotations
  const crossRefMatch = raw.match(/<[ΔΕΣ：:]+[：:]+([^>]+)>/gi)
  if (crossRefMatch) {
    result.crossRefs = crossRefMatch.map(m =>
      m.replace(/<[^:]*:[：:]?/, '').replace('>', '').trim()
    ).flatMap(s => s.split('/').map(x => x.trim())).filter(Boolean)
    raw = raw.replace(/<[ΔΕΣ：:]+[：:]+([^>]+)>/gi, '')
  }

  // Split on semicolons — each chunk is either a definition or an example
  const chunks = raw.split(';').map(c => c.trim()).filter(Boolean)

  for (const chunk of chunks) {
    if (!chunk) continue

    // Detect example sentences: contain hanzi AND are longer phrases
    if (hasHanzi(chunk) && chunk.length > 4) {
      const parsed = parseExample(chunk)
      if (parsed) {
        result.examples.push(parsed)
        continue
      }
    }

    // Otherwise it's a definition fragment — clean it up
    const clean = chunk
      .replace(/^[,，、\s]+/, '')  // strip leading commas
      .replace(/[,，、\s]+$/, '')  // strip trailing commas
      .trim()
    if (clean && !hasHanzi(clean)) {
      result.definitions.push(clean)
    } else if (clean && hasHanzi(clean) && clean.length <= 6) {
      // Short hanzi chunk — probably a measure word example, skip
    }
  }

  return result
}

function parseExample(chunk: string): ExampleSentence | null {
  // Pattern: Chinese sentence + optional pinyin + translation
  // e.g. "请安静！Qǐng ānjìng! Παρακαλώ ησυχία!"
  // e.g. "你有什么安排吗？Míngtiān... Αύριο..."

  // Find where hanzi ends and pinyin begins
  const hanziEnd = chunk.search(/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/)

  let zh = '', pinyin = '', translation = ''

  if (hanziEnd > 0) {
    zh = chunk.slice(0, hanziEnd).trim()
    const rest = chunk.slice(hanziEnd).trim()

    // Find where pinyin ends: pinyin is latin + tone marks + spaces/punctuation
    // Translation is typically Greek (has Greek chars) or starts after a clear break
    const greekStart = rest.search(/[\u0370-\u03ff\u1f00-\u1fff]/)

    if (greekStart > 0) {
      pinyin = rest.slice(0, greekStart).trim().replace(/[.!?。！？]+$/, '')
      translation = rest.slice(greekStart).trim()
    } else {
      // No greek found — whole rest might be pinyin
      pinyin = rest.trim()
    }
  } else {
    zh = chunk.trim()
  }

  if (!hasHanzi(zh)) return null

  return {
    zh: zh.trim(),
    pinyin: pinyin || undefined,
    translation: translation || undefined,
  }
}

function parseRelated(related: string[]): RelatedWord[] {
  return related.map(r => {
    // Format: "词汇 pīnyīn definition text"
    const hanziMatch = r.match(/^([\u4e00-\u9fff]+)/)
    const char = hanziMatch?.[1] || null

    // Remove the char from the string to get the rest
    const rest = char ? r.slice(char.length).trim() : r

    // Try to extract pinyin (comes right after char, before any Greek/English def)
    const pinyinMatch = rest.match(/^([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ,/ ]+?)(?=[\u4e00-\u9fff\u0370-\u03ff,;A-Z]|$)/i)
    const pinyin = pinyinMatch?.[1]?.trim() || null
    const meaning = pinyin ? rest.slice(pinyin.length).trim() : rest.trim()

    return { char, pinyin, meaning: meaning || null, raw: r }
  })
}

interface RelatedWord {
  char: string | null
  pinyin: string | null
  meaning: string | null
  raw: string
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const entry = await getEntry(id)
  if (!entry) notFound()

  const defGr = parseDefField(entry.def_gr)
  const defEn = parseDefField(entry.def_en)
  const related = parseRelated(entry.related || [])

  // Merge examples from both fields (gr usually has more)
  const allExamples = [...defGr.examples, ...defEn.examples]
    .filter((ex, i, arr) => arr.findIndex(e => e.zh === ex.zh) === i) // dedupe

  // Greek definitions only
  const grDefs = defGr.definitions
  // English definitions only
  const enDefs = defEn.definitions.length > 0
    ? defEn.definitions
    : defGr.definitions.filter(d => /^[a-z]/i.test(d) && !/[\u0370-\u03ff]/.test(d))

  const grOnly = grDefs.filter(d => /[\u0370-\u03ff]/.test(d))
  const enOnly = enDefs.filter(d => /^[a-z]/i.test(d))

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          ← Back to search
        </Link>

        {/* ── Hero card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                        dark:border-gray-800 shadow-sm p-8">
          <div className="flex items-start gap-6">
            {/* Big character */}
            <div className="text-8xl font-bold text-gray-900 dark:text-white leading-none select-all shrink-0">
              {entry.char}
            </div>
            {/* Meta */}
            <div className="pt-1 space-y-2 min-w-0">
              {entry.pinyin && (
                <p className="text-2xl text-red-500 font-medium tracking-wide">
                  {entry.pinyin}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {entry.pos && (
                  <Badge color="gray">{entry.pos}</Badge>
                )}
                {entry.level && (
                  <Badge color="blue">Level {entry.level}</Badge>
                )}
                {defGr.measureWord && (
                  <Badge color="amber">MW: {defGr.measureWord}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Greek definition ── */}
        {grOnly.length > 0 && (
          <Section label="Ελληνικά" accent="red">
            <ul className="space-y-1">
              {grOnly.map((d, i) => (
                <li key={i} className="flex gap-2 text-base text-gray-800 dark:text-gray-200">
                  <span className="text-red-300 select-none mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── English definition ── */}
        {enOnly.length > 0 && (
          <Section label="English" accent="blue">
            <ul className="space-y-1">
              {enOnly.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-blue-300 select-none mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {/* ── Etymology ── */}
        {entry.etymology && (
          <Section label="Etymology / Components" accent="amber">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-mono">
              {entry.etymology}
            </p>
          </Section>
        )}
        {/* ── Example sentences ── */}
        {allExamples.length > 0 && (
          <Section label="Example Sentences" accent="green">
            <div className="space-y-4">
              {allExamples.map((ex, i) => (
                <div key={i} className="border-l-2 border-green-200 dark:border-green-800 pl-4">
                  <p className="text-lg text-gray-900 dark:text-white font-medium leading-snug">
                    {ex.zh}
                  </p>
                  {ex.pinyin && (
                    <p className="text-sm text-red-400 mt-0.5 leading-snug">
                      {ex.pinyin}
                    </p>
                  )}
                  {ex.translation && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                      {ex.translation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}



      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

type AccentColor = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'gray'

const accentClasses: Record<AccentColor, string> = {
  red:    'text-red-500',
  blue:   'text-blue-500',
  green:  'text-green-600',
  amber:  'text-amber-600',
  purple: 'text-purple-500',
  gray:   'text-gray-400',
}

function Section({
  label,
  accent = 'gray',
  children,
}: {
  label: string
  accent?: AccentColor
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                    dark:border-gray-800 shadow-sm p-6">
      <h2 className={`text-[10px] uppercase tracking-widest font-semibold mb-4 ${accentClasses[accent]}`}>
        {label}
      </h2>
      {children}
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: 'gray' | 'blue' | 'amber' }) {
  const cls = {
    gray:  'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    blue:  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  }[color]
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-mono ${cls}`}>
      {children}
    </span>
  )
}

function RelatedWordCard({ word }: { word: RelatedWord }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/60
                    rounded-xl border border-gray-100 dark:border-gray-700/50">
      {word.char ? (
        <Link
          href={`/entry/${encodeURIComponent(word.char)}`}
          className="text-xl font-bold text-gray-900 dark:text-white
                     hover:text-red-500 transition-colors shrink-0"
        >
          {word.char}
        </Link>
      ) : null}
      <div className="min-w-0">
        {word.pinyin && (
          <p className="text-xs text-red-400 leading-tight">{word.pinyin}</p>
        )}
        {word.meaning && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5 line-clamp-2">
            {word.meaning}
          </p>
        )}
      </div>
    </div>
  )
}
