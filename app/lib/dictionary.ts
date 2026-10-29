import type { Entry, Radical, GreekIndexEntry, Extras } from './types'

// Cached in module scope
let _entries: Entry[] | null = null

export async function getEntries(): Promise<Entry[]> {
  if (_entries) return _entries
  const res = await fetch('/d_data/entries.json')
  _entries = await res.json()
  return _entries!
}

export async function getRadicals(): Promise<Radical[]> {
  const res = await fetch('/d_data/radicals.json')
  return res.json()
}

export async function getGreekIndex(): Promise<GreekIndexEntry[]> {
  const res = await fetch('/d_data/greek_index.json')
  return res.json()
}

export async function getExtras(): Promise<Extras> {
  const res = await fetch('/d_data/extras.json')
  return res.json()
}
