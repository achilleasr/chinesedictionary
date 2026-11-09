import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import HighlightedText from './HighlightedText'

const render = (text: string, target: string) =>
  renderToStaticMarkup(<HighlightedText text={text} target={target} />)

const MARK = '<span class="text-red-500 font-semibold">'

describe('HighlightedText', () => {
  it('returns the plain text when target is empty', () => {
    expect(render('你好', '')).toBe('你好')
  })

  it('highlights a single occurrence', () => {
    const html = render('我喜欢水', '水')
    expect(html).toContain(`${MARK}水</span>`)
    expect(html.split(MARK).length - 1).toBe(1)
  })

  it('highlights every occurrence', () => {
    const html = render('水很好，水很多', '水')
    expect(html.split(MARK).length - 1).toBe(2)
  })

  it('highlights a target at the very start or end', () => {
    expect(render('水好', '水').split(MARK).length - 1).toBe(1)
    expect(render('好水', '水').split(MARK).length - 1).toBe(1)
  })

  it('does not highlight anything when there is no match', () => {
    const html = render('你好', '水')
    expect(html).not.toContain('text-red-500')
    expect(html).toContain('你好')
  })

  it('supports multi-character targets', () => {
    const html = render('我爱学习汉语', '汉语')
    expect(html).toContain(`${MARK}汉语</span>`)
  })
})
