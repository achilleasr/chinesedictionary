import Link from 'next/link'
import { notFound } from 'next/navigation'
import { pool } from '@/app/lib/database'
import { dict, langQs, LangToggle, parseLang, relationLabel } from '@/app/lib/i18n'
import HighlightedText from './HighlightedText'
import EtymologyTree, { EtymRow } from './EtymologyTree'

type Sentence = {
  key: number
  meaning_id: number
  chinese: string
  pinyin: string | null
  english: string | null
  greek: string | null
}

export default async function WordPage({
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

  const wordId = Number(id)
  if (!Number.isInteger(wordId)) notFound()

  // 1. The word itself + its radical
  const { rows } = await pool.query(
    `SELECT w.id, w.hanzi, w.pinyin, w.radical_id,
            r."character" AS radical,
            r.pinyin AS radical_pinyin,
            CASE WHEN $2::text = 'gr'
                 THEN COALESCE(r.meaning_gr, r.meaning_en)
                 ELSE COALESCE(r.meaning_en, r.meaning_gr)
            END AS radical_meaning
     FROM words w
     LEFT JOIN radicals r ON r.id = w.radical_id
     WHERE w.id = $1`,
    [wordId, lang]
  )
  if (rows.length === 0) notFound()
  const word = rows[0]

  // 2. Everything else, fetched at the same time
  const [meaningsRes, sentencesRes, measureRes, relationsRes, etymRes] =
    await Promise.all([
      // meanings + word type
      pool.query(
        `SELECT m.id, m.meaning_number,
                CASE WHEN $2::text = 'gr'
                     THEN COALESCE(t.name_gr, t.name_en)
                     ELSE COALESCE(t.name_en, t.name_gr)
                END AS type,
                m.meaning_en, m.meaning_gr
         FROM meanings m
         LEFT JOIN word_types t ON t.id = m.type_id
         WHERE m.word_id = $1
         ORDER BY m.meaning_number`,
        [wordId, lang]
      ),

      // example sentences, linked through meanings
      pool.query(
        `SELECT sw.id AS key, sw.meaning_id,
                s.chinese, s.pinyin, s.english, s.greek
         FROM sentence_words sw
         JOIN meanings m  ON m.id = sw.meaning_id
         JOIN sentences s ON s.id = sw.sentence_id
         WHERE m.word_id = $1
         ORDER BY s.id`,
        [wordId]
      ),

      // measure words
      pool.query(
        `SELECT mwd.id, mwd.hanzi, mwd.pinyin
         FROM measurewords mw
         JOIN words mwd ON mwd.id = mw.measure_word_id
         WHERE mw.word_id = $1`,
        [wordId]
      ),

      // related words (synonyms, opposites, ...)
      pool.query(
        `SELECT rel.id, rel.relation,
                rw.id AS related_id, rw.hanzi, rw.pinyin
         FROM relations rel
         JOIN words rw ON rw.id = rel.related_word_id
         WHERE rel.word_id = $1
         ORDER BY rel.relation, rel.id`,
        [wordId]
      ),

      // etymology: each position is a component word OR a radical
            pool.query(
              `WITH RECURSIVE tree AS (
                   SELECT e.id, e.word_id AS parent_id, e."position",
                          e.component_word_id, e.radical_id,
                          1 AS depth, ARRAY[e.word_id] AS path
                   FROM etymologies e
                   WHERE e.word_id = $1
                   UNION ALL
                   SELECT e.id, e.word_id, e."position",
                          e.component_word_id, e.radical_id,
                          t.depth + 1, t.path || e.word_id
                   FROM etymologies e
                   JOIN tree t ON e.word_id = t.component_word_id
                   WHERE t.depth < 8 AND NOT e.word_id = ANY(t.path)
                 )
                 SELECT t.id, t.parent_id, t."position",
                        t.component_word_id, cw.hanzi, cw.pinyin,
                        cm.meaning AS word_meaning,
                        t.radical_id, r."character" AS radical_char,
                                         r.pinyin AS radical_pinyin,
                        CASE WHEN $2::text = 'gr'
                             THEN COALESCE(NULLIF(r.meaning_gr, ''), r.meaning_en)
                             ELSE COALESCE(NULLIF(r.meaning_en, ''), r.meaning_gr)
                        END AS radical_meaning
                 FROM tree t
                 LEFT JOIN words cw   ON cw.id = t.component_word_id
                 LEFT JOIN radicals r ON r.id  = t.radical_id
                 LEFT JOIN LATERAL (
                   SELECT CASE WHEN $2::text = 'gr'
                               THEN COALESCE(NULLIF(m.meaning_gr, ''), NULLIF(m.meaning_en, ''))
                               ELSE COALESCE(NULLIF(m.meaning_en, ''), NULLIF(m.meaning_gr, ''))
                          END AS meaning

                   FROM meanings m
                   WHERE m.word_id = t.component_word_id
                   ORDER BY m.meaning_number
                   LIMIT 1
                 ) cm ON true`,
              [wordId, lang]
      ),
    ])

  const meanings = meaningsRes.rows
  const measureWords = measureRes.rows
  const etymology = etymRes.rows as EtymRow[]
  const first = meanings[0]
    const rootMeaning: string | null = first
      ? lang === 'gr'
        ? first.meaning_gr || first.meaning_en || null
        : first.meaning_en || first.meaning_gr || null
      : null
  // group sentences by the meaning they belong to
  const sentencesByMeaning = new Map<number, Sentence[]>()
  for (const s of sentencesRes.rows as Sentence[]) {
    const list = sentencesByMeaning.get(s.meaning_id) ?? []
    list.push(s)
    sentencesByMeaning.set(s.meaning_id, list)
  }

  // group related words by relation label
  const relationGroups: Record<string, typeof relationsRes.rows> = {}
  for (const r of relationsRes.rows) {
    ;(relationGroups[r.relation ?? 'related'] ??= []).push(r)
  }

  const chip =
    'px-3 py-2 rounded border border-gray-300 dark:border-gray-700 hover:text-red-500 hover:border-red-500'
  const heading = 'text-sm uppercase tracking-wide text-gray-400 mb-2'

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <Link href={`/${qs}`} className="text-sm text-gray-400 hover:text-red-500">
          {t.backSearch}
        </Link>
        <LangToggle path={`/word/${wordId}`} lang={lang} />
      </div>

      {/* Header */}
      <header className="mt-6">
        <h1 className="text-6xl font-bold">{word.hanzi}</h1>
        <p className="text-2xl text-gray-500 dark:text-gray-400 mt-1">
          {word.pinyin}
        </p>
        {word.radical && (
          <Link
            href={`/radical/${word.radical_id}${qs}`}
            className="inline-block mt-3 text-gray-500 hover:text-red-500"
          >
            {word.radical_pinyin && `${word.radical_pinyin} `}R{word.radical_id}: {word.radical}
                      {word.radical_meaning && ` (${word.radical_meaning})`}
          </Link>
        )}
      </header>

      {/* Meanings + their example sentences */}
      {meanings.length > 0 && (
        <section className="mt-10">
          <h2 className={heading}>{t.meanings}</h2>
          <ol className="space-y-6">
            {meanings.map((m) => {
              const examples = sentencesByMeaning.get(m.id) ?? []
              const meaningText =
                lang === 'gr'
                  ? m.meaning_gr || m.meaning_en
                  : m.meaning_en || m.meaning_gr
              return (
                <li key={m.id}>
                  <div>
                    <span className="text-gray-400 mr-2">
                      {m.meaning_number}.
                    </span>
                    {m.type && (
                      <span className="text-sm italic text-gray-400 mr-2">
                        {m.type}
                      </span>
                    )}
                    <span className="text-lg">{meaningText}</span>
                  </div>

                  {examples.length > 0 && (
                    <ul className="mt-3 ml-6 space-y-3 border-l-2 border-gray-200 dark:border-gray-800 pl-4">
                      {examples.map((s) => {
                        const translation =
                          lang === 'gr'
                            ? s.greek || s.english
                            : s.english || s.greek
                        return (
                          <li key={s.key}>
                            <p className="text-lg">
                              <HighlightedText text={s.chinese} target={word.hanzi} />
                            </p>
                            {s.pinyin && (
                              <p className="text-sm text-gray-500">{s.pinyin}</p>
                            )}
                            {translation && <p className="text-sm">{translation}</p>}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* Measure words */}
      {measureWords.length > 0 && (
        <section className="mt-10">
          <h2 className={heading}>{t.measureWords}</h2>
          <div className="flex flex-wrap gap-3">
            {measureWords.map((mw) => (
              <Link key={mw.id} href={`/word/${mw.id}${qs}`} className={chip}>
                {mw.hanzi}{' '}
                <span className="text-gray-400">{mw.pinyin}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Etymology */}
      {etymology.length > 0 && (
             <section className="mt-10">
               <h2 className={heading}>{t.etymology}</h2>
               <EtymologyTree
                 rows={etymology}
                 rootId={word.id}
                 root={{ hanzi: word.hanzi, pinyin: word.pinyin, meaning: rootMeaning }}
                 lang={lang}
               />
             </section>
           )}

      {/* Related words */}
      {Object.keys(relationGroups).length > 0 && (
        <section className="mt-10">
          <h2 className={heading}>{t.relatedWords}</h2>
          <div className="space-y-4">
            {Object.entries(relationGroups).map(([relation, items]) => (
              <div key={relation}>
                <p className="text-sm text-gray-500 mb-1 capitalize">
                  {relationLabel(relation, lang)}
                </p>
                <div className="flex flex-wrap gap-3">
                  {items.map((r) => (
                    <Link
                      key={r.id}
                      href={`/word/${r.related_id}${qs}`}
                      className={chip}
                    >
                      {r.hanzi}{' '}
                      <span className="text-gray-400">{r.pinyin}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
