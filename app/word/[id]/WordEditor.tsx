'use client'
import { useEffect, useState, useTransition } from 'react'
import { saveWord, type WordDraft, type MeaningDraft } from '@/app/admin/actions'

type TypeOpt = { id: number; name_en: string | null; name_gr: string | null }
type RadicalOpt = {
  id: number
  character: string
  pinyin: string | null
  meaning_en: string | null
}

const input =
  'w-full rounded border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:border-red-500'
const select = `${input} dark:bg-gray-950`
const label = 'block text-xs uppercase tracking-wide text-gray-400 mb-1'
const smallBtn =
  'px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-500 disabled:opacity-30'

export default function WordEditor({
  wordId,
  initial,
  types,
  radicals,
  lang,
}: {
  wordId: number
  initial: WordDraft
  types: TypeOpt[]
  radicals: RadicalOpt[]
  lang: 'en' | 'gr'
}) {
  const [draft, setDraft] = useState<WordDraft>(initial)
  const [saved, setSaved] = useState(JSON.stringify(initial))
  const [msg, setMsg] = useState<{ error: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const dirty = JSON.stringify(draft) !== saved

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const setField = <K extends keyof WordDraft>(k: K, v: WordDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const setMeaning = (i: number, patch: Partial<MeaningDraft>) =>
    setDraft((d) => ({
      ...d,
      meanings: d.meanings.map((m, j) => (j === i ? { ...m, ...patch } : m)),
    }))

  const moveMeaning = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const arr = [...d.meanings]
      const j = i + dir
      if (j < 0 || j >= arr.length) return d
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...d, meanings: arr }
    })

  const removeMeaning = (i: number) =>
    setDraft((d) => ({ ...d, meanings: d.meanings.filter((_, j) => j !== i) }))

  const addMeaning = () =>
    setDraft((d) => ({
      ...d,
      meanings: [...d.meanings, { type_id: null, meaning_en: '', meaning_gr: '' }],
    }))

  function save() {
    start(async () => {
      setMsg(null)
      const clean: WordDraft = {
        ...draft,
        meanings: draft.meanings.filter((m) => m.meaning_en.trim() || m.meaning_gr.trim()),
      }
      const res = await saveWord(wordId, clean)
      if (!res.ok) {
        setMsg({ error: true, text: res.error })
        return
      }
      const next: WordDraft = {
        ...clean,
        meanings: clean.meanings.map((m, i) => ({ ...m, id: res.meaningIds[i] })),
      }
      setDraft(next)
      setSaved(JSON.stringify(next))
      setMsg({ error: false, text: 'Saved' })
    })
  }

  const typeName = (t: TypeOpt) =>
    (lang === 'gr' ? t.name_gr || t.name_en : t.name_en || t.name_gr) ?? `#${t.id}`

  return (
    <div className="mt-6">
      {/* Word fields */}
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <div>
          <label className={label}>Hanzi</label>
          <input
            className={`${input} text-3xl`}
            value={draft.hanzi}
            onChange={(e) => setField('hanzi', e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Pinyin</label>
          <input
            className={`${input} text-xl`}
            value={draft.pinyin}
            onChange={(e) => setField('pinyin', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Kangxi radical</label>
          <select
            className={select}
            value={draft.radical_id ?? ''}
            onChange={(e) =>
              setField('radical_id', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">(none)</option>
            {radicals.map((r) => (
              <option key={r.id} value={r.id}>
                R{r.id} {r.character} {r.pinyin ?? ''} {r.meaning_en ? `(${r.meaning_en})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meanings */}
      <h2 className="text-sm uppercase tracking-wide text-gray-400 mt-10 mb-2">Meanings</h2>
      <ol className="space-y-4">
        {draft.meanings.map((m, i) => (
          <li
            key={m.id ?? `new-${i}`}
            className="rounded border border-gray-200 dark:border-gray-800 p-3 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-400 w-6">{i + 1}.</span>
              <select
                className={`${select} w-auto!`}
                value={m.type_id ?? ''}
                onChange={(e) =>
                  setMeaning(i, { type_id: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">(type)</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{typeName(t)}</option>
                ))}
              </select>
              <span className="flex-1" />
              <button className={smallBtn} disabled={i === 0} onClick={() => moveMeaning(i, -1)}>↑</button>
              <button className={smallBtn} disabled={i === draft.meanings.length - 1} onClick={() => moveMeaning(i, 1)}>↓</button>
              <button className={smallBtn} onClick={() => removeMeaning(i)}>Remove</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>English</label>
                <textarea
                  rows={2}
                  className={input}
                  value={m.meaning_en}
                  onChange={(e) => setMeaning(i, { meaning_en: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>Greek</label>
                <textarea
                  rows={2}
                  className={input}
                  value={m.meaning_gr}
                  onChange={(e) => setMeaning(i, { meaning_gr: e.target.value })}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button className={`${smallBtn} mt-3`} onClick={addMeaning}>+ Add meaning</button>

      {/* Save bar */}
      <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-3 flex items-center gap-4 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur">
        <button
          onClick={save}
          disabled={!dirty || pending}
          className="px-5 py-2 rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red-500"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {dirty && !pending && <span className="text-sm text-gray-400">Unsaved changes</span>}
        {msg && (
          <span className={`text-sm ${msg.error ? 'text-red-500' : 'text-green-600'}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
