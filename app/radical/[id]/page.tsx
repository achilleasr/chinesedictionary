import Link from 'next/link'
import { notFound } from 'next/navigation'
import { pool } from '@/app/lib/database'
import { dict, langQs, LangToggle, parseLang } from '@/app/lib/i18n'

export default async function RadicalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { id } = await params
  const { lang: langParam } = await searchParams
  const lang = parseLang(langParam)
  const t = dict[lang]
  const qs = langQs(lang)

  const radicalId = Number(id)
  if (!Number.isInteger(radicalId)) notFound()

  const { rows } = await pool.query(
    `SELECT id, "character", pinyin, meaning_en, meaning_gr,
            stroke_count, variants
     FROM radicals
     WHERE id = $1`,
    [radicalId]
  )
  if (rows.length === 0) notFound()
  const radical = rows[0]

  const meaning =
    lang === 'gr'
      ? radical.meaning_gr || radical.meaning_en
      : radical.meaning_en || radical.meaning_gr

  const { rows: words } = await pool.query(
    `SELECT id, hanzi, pinyin
     FROM words
     WHERE radical_id = $1
     ORDER BY pinyin
     LIMIT 200`,
    [radicalId]
  )

  const chip =
    'px-3 py-2 rounded border border-gray-300 dark:border-gray-700 hover:text-red-500 hover:border-red-500'

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <Link
          href={`/radicals${qs}`}
          className="text-sm text-gray-400 hover:text-red-500"
        >
          {t.allRadicals}
        </Link>
        <LangToggle path={`/radical/${radicalId}`} lang={lang} />
      </div>

      <header className="mt-6">
        <p className="text-sm uppercase tracking-wide text-gray-400">
                 R{radical.id}
        </p>
        <h1 className="text-7xl font-bold">{radical.character}</h1>
        {radical.pinyin && (
          <p className="text-2xl text-gray-500 dark:text-gray-400 mt-1">
            {radical.pinyin}
          </p>
        )}
      </header>

      <section className="mt-8 space-y-1">
        {meaning && <p className="text-lg">{meaning}</p>}
        {radical.stroke_count && (
          <p className="text-sm text-gray-400">
            {radical.stroke_count} {t.strokes}
          </p>
        )}
        {radical.variants && (
          <p className="text-sm text-gray-400">
            {t.variants}: {radical.variants}
          </p>
        )}
      </section>

      {words.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-2">
            {t.wordsWithRadical}
          </h2>
          <div className="flex flex-wrap gap-3">
            {words.map((w) => (
              <Link key={w.id} href={`/word/${w.id}${qs}`} className={chip}>
                {w.hanzi} <span className="text-gray-400">{w.pinyin}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
