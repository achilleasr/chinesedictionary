
export interface Entry {
  id: string
  char: string
  pinyin?: string
  pinyin_plain?: string
  pos?: string
  def_gr?: string
  def_en?: string
  etymology?: string
  radical_refs?: string[]
  components?: string
  related?: string[]
  level?: string
  has_issues?: boolean
}

export interface Radical {
  number: string
  character: string
  pinyin: string
  meaning: string
  etymology?: string
}

export interface GreekIndexEntry {
  greek_word: string
  char: string
  pinyin?: string
  note?: string
}

export interface Extras {
  grammar: GrammarEntry[]
  idioms: IdiomEntry[]
  phrases: PhraseEntry[]
  similar_forms: SimilarEntry[]
  misc: MiscEntry[]
}

export interface GrammarEntry {
  pattern?: string
  pinyin?: string
  explanation_gr?: string
  explanation_en?: string
}

export interface IdiomEntry {
  idiom: string
  pinyin?: string
  meaning_gr?: string
  meaning_en?: string
}

export interface PhraseEntry {
  category?: string
  phrase_zh: string
  pinyin?: string
  meaning_gr?: string
  meaning_en?: string
}

export interface SimilarEntry {
  char: string
  pinyin?: string
  meaning?: string
}

export interface MiscEntry {
  category: string
  char?: string
  pinyin?: string
  meaning?: string
}
