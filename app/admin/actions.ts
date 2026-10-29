'use server'
import { revalidatePath } from 'next/cache'
import { pool } from '@/app/lib/database'
import { isTeacher, setEditMode } from '@/app/lib/auth'

async function requireTeacher() {
  if (!(await isTeacher())) throw new Error('Not authorized')
}

export async function toggleEditMode(on: boolean) {
  await requireTeacher()
  await setEditMode(on)
}

export type MeaningDraft = {
  id?: number
  type_id: number | null
  meaning_en: string
  meaning_gr: string
}
export type WordDraft = {
  hanzi: string
  pinyin: string
  radical_id: number | null
  meanings: MeaningDraft[]
}

export async function saveWord(
  wordId: number,
  d: WordDraft
): Promise<{ ok: true; meaningIds: number[] } | { ok: false; error: string }> {
  await requireTeacher()
  if (!Number.isInteger(wordId)) return { ok: false, error: 'Bad word id' }
  const hanzi = d.hanzi.trim()
  if (!hanzi) return { ok: false, error: 'Hanzi is required' }

  const blank = (s: string) => s.trim() || null
  const meanings = d.meanings.filter((m) => m.meaning_en.trim() || m.meaning_gr.trim())
  const keepIds = meanings.map((m) => m.id).filter((x): x is number => x != null)
  const ids: number[] = []

  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    await c.query(
      `UPDATE words SET hanzi=$2, pinyin=$3, radical_id=$4 WHERE id=$1`,
      [wordId, hanzi, blank(d.pinyin), d.radical_id]
    )

    await c.query(
      `DELETE FROM meanings WHERE word_id=$1 AND id <> ALL($2::int[])`,
      [wordId, keepIds]
    )
    await c.query(
      `UPDATE meanings SET meaning_number = meaning_number + 1000 WHERE word_id=$1`,
      [wordId]
    )

    for (const [i, m] of meanings.entries()) {
      const vals = [i + 1, m.type_id, blank(m.meaning_en), blank(m.meaning_gr)]
      if (m.id != null) {
        const r = await c.query(
          `UPDATE meanings
              SET meaning_number=$2, type_id=$3, meaning_en=$4, meaning_gr=$5
            WHERE id=$1 AND word_id=$6 RETURNING id`,
          [m.id, ...vals, wordId]
        )
        if (r.rowCount === 0) throw new Error('A meaning no longer exists, reload the page')
        ids.push(r.rows[0].id)
      } else {
        const r = await c.query(
          `INSERT INTO meanings (word_id, meaning_number, type_id, meaning_en, meaning_gr)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [wordId, ...vals]
        )
        ids.push(r.rows[0].id)
      }
    }
    await c.query('COMMIT')
  } catch (e) {
    await c.query('ROLLBACK')
    return { ok: false, error: e instanceof Error ? e.message : 'Save failed' }
  } finally {
    c.release()
  }

  revalidatePath(`/word/${wordId}`)
  return { ok: true, meaningIds: ids }
}
