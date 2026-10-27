import Link from 'next/link'
import { langQs, Lang } from '@/app/lib/i18n'

export type EtymRow = {
  id: number
  parent_id: number
  position: number | null
  component_word_id: number | null
  hanzi: string | null
  pinyin: string | null
  word_meaning: string | null
  radical_id: number | null
  radical_char: string | null
  radical_pinyin: string | null
  radical_meaning: string | null
}

export type EtymRoot = {
  hanzi: string
  pinyin: string | null
  meaning: string | null
}

const MAX_DEPTH = 8
// layout units (not real pixels: the whole tree is scaled to fit the width)
const NODE_W = 96
const NODE_H = 104
const H_GAP = 4
const V_GAP = 22
// how far a small tree may be scaled up beyond its layout size
const MAX_SCALE = 1

type LNode = {
  key: string
  href: string | null
  radical: boolean
  big: string
  sub: string
  meaning: string | null
  children: LNode[]
  width: number // width of the whole subtree
  cx: number
  y: number
}

const box =
  'absolute flex flex-col items-center justify-center overflow-hidden rounded-md border text-center leading-tight'

export default function EtymologyTree({
  rows,
  rootId,
  root,
  lang,
}: {
  rows: EtymRow[]
  rootId: number
  root: EtymRoot
  lang: Lang
}) {
  const qs = langQs(lang)

  // A word that appears in two branches produces duplicate rows, so dedupe by id
  const unique = [...new Map(rows.map((r) => [r.id, r])).values()]
  const childrenOf = new Map<number, EtymRow[]>()
  for (const r of unique) {
    const list = childrenOf.get(r.parent_id) ?? []
    list.push(r)
    childrenOf.set(r.parent_id, list)
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  // ---- build the tree ----
  function build(
    wordId: number,
    depth: number,
    path: number[],
    parentKey: string
  ): LNode[] {
    const items = childrenOf.get(wordId)
    if (!items || depth > MAX_DEPTH || path.includes(wordId)) return []
    const out: LNode[] = []
    for (const e of items) {
      const key = `${parentKey}/e${e.id}`
      if (e.component_word_id) {
        out.push({
          key,
          href: `/word/${e.component_word_id}${qs}`,
          radical: false,
          big: e.hanzi ?? '',
          sub: e.pinyin ?? '',
          meaning: e.word_meaning,
          children: build(e.component_word_id, depth + 1, [...path, wordId], key),
          width: 0, cx: 0, y: 0,
        })
      } else if (e.radical_id) {
        out.push({
          key,
          href: `/radical/${e.radical_id}${qs}`,
          radical: true,
          big: e.radical_char ?? '',
          sub: `${e.radical_pinyin ? e.radical_pinyin + ' ' : ''}R${e.radical_id}`,
          meaning: e.radical_meaning,
          children: [],
          width: 0, cx: 0, y: 0,
        })
      }
    }
    return out
  }
  const top: LNode = {
    key: 'root',
    href: null,
    radical: false,
    big: root.hanzi,
    sub: root.pinyin ?? '',
    meaning: root.meaning,
    children: build(rootId, 1, [], 'root'),
    width: 0, cx: 0, y: 0,
  }

  // ---- pass 1 (bottom-up): how much width does each subtree need? ----
  function measure(n: LNode): number {
    if (n.children.length === 0) return (n.width = NODE_W)
    const kids = n.children.reduce((s, c) => s + measure(c), 0)
    return (n.width = Math.max(NODE_W, kids + H_GAP * (n.children.length - 1)))
  }
  const totalW = measure(top)

  // ---- pass 2: place nodes; parent is centered over its children ----
  const all: LNode[] = []
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = []
  let maxDepth = 0

  function place(n: LNode, left: number, depth: number) {
    n.y = depth * (NODE_H + V_GAP)
    maxDepth = Math.max(maxDepth, depth)
    all.push(n)
    if (n.children.length === 0) {
      n.cx = left + n.width / 2
      return
    }
    const kidsW =
      n.children.reduce((s, c) => s + c.width, 0) +
      H_GAP * (n.children.length - 1)
    let x = left + (n.width - kidsW) / 2
    for (const c of n.children) {
      place(c, x, depth + 1)
      x += c.width + H_GAP
    }
    const first = n.children[0]
    const last = n.children[n.children.length - 1]
    n.cx = (first.cx + last.cx) / 2
    for (const c of n.children) {
      edges.push({
        x1: n.cx,
        y1: n.y + NODE_H,
        x2: c.cx,
        y2: c.y,
      })
    }
  }
  place(top, 0, 0)

  const totalH = (maxDepth + 1) * NODE_H + maxDepth * V_GAP

  // convert layout units to container-relative sizes so everything scales together
  const cq = (units: number) => `${(units / totalW) * 100}cqw`
  const pctX = (units: number) => `${(units / totalW) * 100}%`
  const pctY = (units: number) => `${(units / totalH) * 100}%`

  // keep multi-character words on one line by shrinking the font
  const hanziUnits = (text: string, isRoot: boolean) => {
    const max = isRoot ? 44 : 38
    const len = Math.max(1, [...text].length)
    return Math.min(max, Math.floor((NODE_W - 8) / len))
  }

  return (
    <div
      className="relative mx-auto"
      style={{
        width: '100%',
        maxWidth: totalW * MAX_SCALE,
        aspectRatio: `${totalW} / ${totalH}`,
        containerType: 'inline-size',
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${totalW} ${totalH}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {edges.map((e, i) => {
          const mid = (e.y1 + e.y2) / 2
          return (
            <path
              key={i}
              d={`M${e.x1} ${e.y1} V${mid} H${e.x2} V${e.y2}`}
              fill="none"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              className="stroke-gray-300 dark:stroke-gray-700"
            />
          )
        })}
      </svg>

      {all.map((n) => {
        const style = {
          left: pctX(n.cx - NODE_W / 2),
          width: pctX(NODE_W),
          top: pctY(n.y),
          height: pctY(NODE_H),
          padding: cq(4),
        }
        const inner = (
          <>
            <span
              className="whitespace-nowrap leading-none"
              style={{ fontSize: cq(hanziUnits(n.big, n.key === 'root')) }}
            >
              {n.big}
            </span>
            <span
              className="text-gray-400"
              style={{ fontSize: cq(12), marginTop: cq(3) }}
            >
              {n.sub}
            </span>
            {n.meaning && (
              <span
                className="line-clamp-3"
                style={{ fontSize: cq(12), marginTop: cq(2) }}
                title={n.meaning}
              >
                {n.meaning}
              </span>
            )}
          </>
        )

        if (!n.href) {
          return (
            <div
              key={n.key}
              style={style}
              className={`${box} border-2 border-gray-900 bg-white dark:border-gray-100 dark:bg-gray-950`}
            >
              {inner}
            </div>
          )
        }
        return (
          <Link
            key={n.key}
            href={n.href}
            style={style}
            className={`${box} bg-white hover:border-red-500 hover:text-red-500 dark:bg-gray-950 ${
              n.radical
                ? 'border-dashed border-red-300 dark:border-red-900'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
