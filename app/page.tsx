import Link from 'next/link'
import DictionarySearch from './components/DictionarySearch'
import { dict, langQs, LangToggle, parseLang } from '@/app/lib/i18n'
import {pool} from '@/app/lib/database'
import { page, chip, btn} from '@/app/lib/ui'

export default async function Home({
  searchParams,
}: {
searchParams: Promise<{ lang?: string }>
}) {
const { lang: langParam } = await searchParams
const lang = parseLang(langParam)
const t = dict[lang]
const qs = langQs(lang)

const { rows } = await pool.query(
  `SELECT id, hanzi, pinyin FROM words`
)

const collator = new Intl.Collator('en')
const words = (rows as { id: number; hanzi: string; pinyin: string }[]).sort(
  (a, b) => collator.compare(a.pinyin, b.pinyin) || a.hanzi.localeCompare(b.hanzi)
)

const letterOf = (p: string) =>
  p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase() || '#'

const groups: { letter: string; items: typeof words }[] = []
for (const w of words) {
  const letter = letterOf(w.pinyin)
  const last = groups[groups.length - 1]
  if (last && last.letter === letter) last.items.push(w)
  else groups.push({ letter, items: [w] })
}

return (
  <main className={page}>
    <div className="flex w-full justify-end">

      <LangToggle path="/" lang={lang} />
    </div>
    <div className="max-w-2xl mx-auto my-5 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
        中文词典
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Chinese · Greek · English
      </p>
    </div>
    <DictionarySearch
      lang={lang}
      placeholder={t.searchPlaceholder}
      noResultsText={t.noResults}
    />

    <nav className="my-5 flex flex-wrap justify-between mx-2 text-gray-400 hover:text-red-500">
      {groups.map((g) => (
        <a key={g.letter} href={`#${g.letter}`} className="hover:text-red-500">
          {g.letter}
        </a>
      ))}
    </nav>
    <Link href={`/radicals${qs}`} className={btn}>
      Radicals
    </Link>
    {groups.map((g) => (
      <section key={g.letter} id={g.letter} className="mt-3 scroll-mt-6">
        <h2 className='{${heading} mb-3}'>
          {g.letter}
        </h2>
        <div className="flex flex-wrap gap-2">
          {g.items.map((w) => (
            <Link key={w.id} href={`/word/${w.id}${qs}`} className={chip}>
              {w.hanzi} <span className="text-gray-400">{w.pinyin}</span>
            </Link>
          ))}
        </div>
      </section>
    ))}
  </main>
)
}
