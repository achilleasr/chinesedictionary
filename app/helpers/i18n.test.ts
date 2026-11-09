import { describe, it, expect } from 'vitest'
import {
  parseLang,
  langQs,
  pickByLang,
  parseId,
  relationLabel,
  dict,
} from './i18n'

describe('parseLang', () => {
  it('returns gr only for "gr"', () => {
    expect(parseLang('gr')).toBe('gr')
  })
  it.each([undefined, '', 'en', 'GR', 'fr', 'gr '])(
    'defaults to en for %j',
    (v) => expect(parseLang(v)).toBe('en')
  )
})

describe('langQs', () => {
  it('adds the query string only for Greek', () => {
    expect(langQs('gr')).toBe('?lang=gr')
    expect(langQs('en')).toBe('')
  })
})

describe('pickByLang', () => {
  it('prefers English when lang is en', () => {
    expect(pickByLang('en', 'water', 'νερό')).toBe('water')
  })
  it('prefers Greek when lang is gr', () => {
    expect(pickByLang('gr', 'water', 'νερό')).toBe('νερό')
  })
  it('falls back to the other language when preferred is missing', () => {
    expect(pickByLang('gr', 'water', null)).toBe('water')
    expect(pickByLang('en', '', 'νερό')).toBe('νερό')
  })
  it('returns null when both are missing', () => {
    expect(pickByLang('en', undefined, '')).toBeNull()
  })
})

describe('parseId', () => {
  it('respects a custom maximum', () => {
    expect(parseId('32767', 32767)).toBe(32767)
    expect(parseId('32768', 32767)).toBeNull()
  })
  it.each(['', '0', '-1', '1.5', '1e3', 'abc', '12abc', '2147483648', '99999999999999999999'])(
    'rejects %j',
    (bad) => expect(parseId(bad)).toBeNull()
  )
})

describe('relationLabel', () => {
  it('translates known relations to Greek, case-insensitively', () => {
    expect(relationLabel('synonym', 'gr')).toBe('συνώνυμο')
    expect(relationLabel('Antonym', 'gr')).toBe('αντώνυμο')
  })
  it('falls back to the raw value for unknown relations', () => {
    expect(relationLabel('homophone', 'gr')).toBe('homophone')
  })
  it('leaves the relation untouched in English', () => {
    expect(relationLabel('synonym', 'en')).toBe('synonym')
  })
})

describe('dict', () => {
  it('has the same keys in English and Greek', () => {
    expect(Object.keys(dict.gr).sort()).toEqual(Object.keys(dict.en).sort())
  })
  it('has no empty strings', () => {
    for (const lang of ['en', 'gr'] as const) {
      for (const [key, value] of Object.entries(dict[lang])) {
        expect(value, `${lang}.${key}`).not.toBe('')
      }
    }
  })
})
