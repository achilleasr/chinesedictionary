import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/database'

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&')

// strip tone marks and spaces: "mǎ" -> "ma", "nǐ hǎo" -> "nihao"
const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 60)
  const lang = req.nextUrl.searchParams.get('lang') === 'gr' ? 'gr' : 'en'
  if (!q) return NextResponse.json({ words: [], radicals: [] })

  const p = plain(q)
  const qLike = escapeLike(q)
  const pLike = escapeLike(p)

  const wordsQuery = pool.query(
    `SELECT w.id, w.hanzi, w.pinyin, cm.meaning
     FROM words w
     LEFT JOIN LATERAL (
       SELECT CASE WHEN $4::text = 'gr'
                   THEN COALESCE(NULLIF(m.meaning_gr, ''), NULLIF(m.meaning_en, ''))
                   ELSE COALESCE(NULLIF(m.meaning_en, ''), NULLIF(m.meaning_gr, ''))
              END AS meaning
       FROM meanings m
       WHERE m.word_id = w.id
       ORDER BY (m.meaning_en ILIKE $3 OR m.meaning_gr ILIKE $3) DESC,
                m.meaning_number
       LIMIT 1
     ) cm ON true
     CROSS JOIN LATERAL (
       SELECT replace(translate(lower(w.pinyin),
                'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü',
                'aaaaeeeeiiiioooouuuuuuuuu'), ' ', '') AS pp
     ) x
     WHERE w.hanzi ILIKE $1
        OR x.pp LIKE $2
        OR EXISTS (
             SELECT 1 FROM meanings m
             WHERE m.word_id = w.id
               AND (m.meaning_en ILIKE $3 OR m.meaning_gr ILIKE $3)
           )
     ORDER BY
       CASE
         WHEN w.hanzi = $5 THEN 0
         WHEN w.hanzi ILIKE $6 THEN 1
         WHEN x.pp = $7 THEN 2
         WHEN x.pp LIKE $8 THEN 3
         ELSE 4
       END,
       length(w.hanzi),
       w.pinyin
     LIMIT 30`,
    [
      `%${qLike}%`, // $1 hanzi
      `%${pLike}%`, // $2 pinyin
      `%${qLike}%`, // $3 meaning
      lang,         // $4
      q,            // $5 exact hanzi
      `${qLike}%`,  // $6 hanzi prefix
      p,            // $7 exact pinyin
      `${pLike}%`,  // $8 pinyin prefix
    ]
  )

  const radicalsQuery = pool.query(
    `SELECT r.id, r."character" AS character, r.pinyin,
            CASE WHEN $3::text = 'gr'
                 THEN COALESCE(NULLIF(r.meaning_gr, ''), NULLIF(r.meaning_en, ''))
                 ELSE COALESCE(NULLIF(r.meaning_en, ''), NULLIF(r.meaning_gr, ''))
            END AS meaning
     FROM radicals r
     CROSS JOIN LATERAL (
       SELECT replace(translate(lower(coalesce(r.pinyin, '')),
                'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü',
                'aaaaeeeeiiiioooouuuuuuuuu'), ' ', '') AS pp
     ) x
     WHERE r."character" ILIKE $1
        OR coalesce(r.variants, '') ILIKE $1
        OR x.pp LIKE $2
        OR r.meaning_en ILIKE $1
        OR r.meaning_gr ILIKE $1
     ORDER BY
       CASE
         WHEN r."character" = $4 THEN 0
         WHEN x.pp = $5 THEN 1
         ELSE 2
       END,
       r.id
     LIMIT 10`,
    [`%${qLike}%`, `%${pLike}%`, lang, q, p]
  )

  const [words, radicals] = await Promise.all([wordsQuery, radicalsQuery])
  return NextResponse.json({ words: words.rows, radicals: radicals.rows })
}
