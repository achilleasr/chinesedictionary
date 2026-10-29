import Link from 'next/link'

export type Lang = 'en' | 'gr'

export const parseLang = (v?: string): Lang => (v === 'gr' ? 'gr' : 'en')

// appended to internal links so the language sticks
export const langQs = (lang: Lang) => (lang === 'gr' ? '?lang=gr' : '')

export const dict = {
  en: {
    backSearch: '← Back to search',
    allRadicals: 'All radicals',
    radical: 'Radical',
    meanings: 'Meanings',
    measureWords: 'Measure words',
    etymology: 'Etymology',
    relatedWords: 'Related words',
    wordsWithRadical: 'Words with this radical',
    strokes: 'strokes',
    variants: 'Variants',
    words: 'Words',
    browseIndex: 'Browse full index →',
    searchPlaceholder: 'Search hanzi, pinyin, or meaning…',
    noResults: 'No results',
  },
  gr: {
    backSearch: '← Πίσω στην αναζήτηση',
    allRadicals: 'Όλα τα ριζικά',
    radical: 'Ριζικό',
    meanings: 'Σημασίες',
    measureWords: 'Ποσοδείκτες',
    etymology: 'Ετυμολογία',
    relatedWords: 'Σχετικές λέξεις',
    wordsWithRadical: 'Λέξεις με αυτό το ριζικό',
    strokes: 'γραμμές',
    variants: 'Παραλλαγές',
    words: 'Λέξεις',
    browseIndex: 'Πλήρες ευρετήριο →',
    searchPlaceholder: 'Αναζήτηση με hanzi, pinyin ή σημασία…',
    noResults: 'Κανένα αποτέλεσμα',
  },
} as const

// relations.relation is free text, so add your real values here.
// Unknown labels fall back to the raw text.
const relationGr: Record<string, string> = {
  synonym: 'συνώνυμο',
  antonym: 'αντώνυμο',
  opposite: 'αντίθετο',
  related: 'σχετικό',
}

export const relationLabel = (relation: string, lang: Lang) =>
  lang === 'gr' ? relationGr[relation.toLowerCase()] ?? relation : relation

// Text toggle: EN / GR, current language in bold.
// `path` is the current page path without query string, e.g. "/word/12"
export function LangToggle({ path, lang }: { path: string; lang: Lang }) {
  const active = 'font-bold text-gray-900 dark:text-gray-100'
  return (
    <Link
      href={`${path}${lang === 'en' ? '?lang=gr' : ''}`}
      className="text-sm text-gray-400 hover:text-red-500"
    >
      <span className={lang === 'en' ? active : ''}>EN</span>
      {' / '}
      <span className={lang === 'gr' ? active : ''}>GR</span>
    </Link>
  )
}
