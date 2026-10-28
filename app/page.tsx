import Link from 'next/link'
import DictionarySearch from './components/DictionarySearch'
import { dict, langQs, LangToggle, parseLang } from '@/app/lib/i18n'
import {pool} from '@/app/lib/database'

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

// base letters first, tone marks only break ties
const collator = new Intl.Collator('en')
const words = (rows as { id: number; hanzi: string; pinyin: string }[]).sort(
  (a, b) => collator.compare(a.pinyin, b.pinyin) || a.hanzi.localeCompare(b.hanzi)
)

// group by first letter of the pinyin, ignoring tone marks
const letterOf = (p: string) =>
  p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase() || '#'

const groups: { letter: string; items: typeof words }[] = []
for (const w of words) {
  const letter = letterOf(w.pinyin)
  const last = groups[groups.length - 1]
  if (last && last.letter === letter) last.items.push(w)
  else groups.push({ letter, items: [w] })
}

const chip =
  'px-3 py-2 rounded border border-gray-300 dark:border-gray-700 hover:text-red-500 hover:border-red-500'

return (
  <main className="max-w-4xl mx-auto px-4 py-6 text-gray-900 dark:text-gray-100">
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
    {/*<h1 className="mt-6 text-4xl font-bold">
      {t.words}{' '}
      <span className="text-xl font-normal text-gray-400">{words.length}</span>
    </h1>*/}

    {/* letter jump links */}
    <nav className="my-5 flex flex-wrap justify-between mx-2 text-m text-white-400">
      {groups.map((g) => (
        <a key={g.letter} href={`#${g.letter}`} className="hover:text-red-500">
          {g.letter}
        </a>
      ))}
    </nav>
    <Link
      href="/radicals"
      className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 text-black bg-blue-200 hover:text-blue-500"
    >
      Radicals
    </Link>
    {groups.map((g) => (
      <section key={g.letter} id={g.letter} className="mt-3 scroll-mt-6">
        <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-3">
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
