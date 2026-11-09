import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import EtymologyTree, { type EtymRow } from './EtymologyTree'
import type { Lang } from '@/app/helpers/i18n'

// Render next/link as a plain <a> so the test doesn't depend on Next internals
vi.mock('next/link', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ href, children, ...rest }: any) =>
      createElement('a', { href, ...rest }, children),
  }
})

const row = (
  o: Partial<EtymRow> & { id: number; parent_id: number }
): EtymRow => ({
  position: null,
  component_word_id: null,
  hanzi: null,
  pinyin: null,
  word_meaning: null,
  radical_id: null,
  radical_char: null,
  radical_pinyin: null,
  radical_meaning: null,
  ...o,
})

const render = (rows: EtymRow[], lang: Lang = 'en') =>
  renderToStaticMarkup(
    <EtymologyTree
      rows={rows}
      rootId={1}
      root={{ hanzi: '明', pinyin: 'míng', meaning: 'bright' }}
      lang={lang}
    />
  )

const links = (html: string) => (html.match(/<a /g) ?? []).length

describe('EtymologyTree', () => {
  it('renders only the root (and no links) when there are no rows', () => {
    const html = render([])
    expect(html).toContain('明')
    expect(html).toContain('míng')
    expect(html).toContain('bright')
    expect(links(html)).toBe(0)
  })

  it('links component words to /word/:id', () => {
    const html = render([
      row({ id: 1, parent_id: 1, component_word_id: 2, hanzi: '日', pinyin: 'rì' }),
    ])
    expect(html).toContain('href="/word/2"')
    expect(html).toContain('日')
  })

  it('links radicals to /radical/:id and shows pinyin + R number', () => {
    const html = render([
      row({
        id: 1,
        parent_id: 1,
        radical_id: 72,
        radical_char: '日',
        radical_pinyin: 'rì',
        radical_meaning: 'sun',
      }),
    ])
    expect(html).toContain('href="/radical/72"')
    expect(html).toContain('rì R72')
    expect(html).toContain('sun')
  })

  it('appends ?lang=gr to links in Greek', () => {
    const html = render(
      [
        row({ id: 1, parent_id: 1, component_word_id: 2, hanzi: '日' }),
        row({ id: 2, parent_id: 1, radical_id: 74, radical_char: '月' }),
      ],
      'gr'
    )
    expect(html).toContain('href="/word/2?lang=gr"')
    expect(html).toContain('href="/radical/74?lang=gr"')
  })

  it('orders siblings by position, not by row order', () => {
    const html = render([
      row({ id: 1, parent_id: 1, position: 2, component_word_id: 3, hanzi: '月' }),
      row({ id: 2, parent_id: 1, position: 1, component_word_id: 2, hanzi: '日' }),
    ])
    expect(html.indexOf('日')).toBeLessThan(html.indexOf('月'))
  })

  it('renders nested components (grandchildren)', () => {
    const html = render([
      row({ id: 1, parent_id: 1, component_word_id: 2, hanzi: '日' }),
      row({ id: 2, parent_id: 2, component_word_id: 3, hanzi: '口' }),
    ])
    expect(links(html)).toBe(2)
    expect(html).toContain('href="/word/3"')
  })

  it('ignores duplicate rows with the same id', () => {
    const r = row({ id: 1, parent_id: 1, component_word_id: 2, hanzi: '日' })
    expect(links(render([r, r]))).toBe(1)
  })

  it('skips rows that have neither a component word nor a radical', () => {
    const html = render([row({ id: 1, parent_id: 1 })])
    expect(links(html)).toBe(0)
  })

  it('terminates on circular references', () => {
    // word 1 contains word 2, and word 2 contains word 1
    const rows = [
      row({ id: 1, parent_id: 1, component_word_id: 2, hanzi: '日' }),
      row({ id: 2, parent_id: 2, component_word_id: 1, hanzi: '明' }),
    ]
    expect(() => render(rows)).not.toThrow()
    expect(links(render(rows))).toBe(2)
  })

  it('stops at the maximum depth of 8 levels', () => {
    // chain 1 -> 2 -> 3 -> ... -> 13
    const rows = Array.from({ length: 12 }, (_, i) =>
      row({
        id: i + 1,
        parent_id: i + 1,
        component_word_id: i + 2,
        hanzi: `字${i + 1}`,
      })
    )
    expect(links(render(rows))).toBe(8)
  })
})
