// Clawd's speech bubble: one word typed out, the turn's words taking turns
// while it walks, or a word shown whole on its stroll.

import { SAY_SECONDS, VERBS } from './forms'
import { ALL_LINES, IDLE_WORDS } from './lines'

/** How far a letter advances in the bubble, in Clawd's pixels: each is drawn
 * at its own place, so the bubble's width never depends on the font. */
const advance = (c: string) => ((c.codePointAt(0) ?? 0) > 0x2e7f ? 6.4 : 3.8)

const escapeXml = (c: string) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c)

const BUBBLE = { right: -4, top: -2.5, bottom: 7.5, pad: 3, radius: 2.5, dots: 8.5 }

const widthOf = (text: string) => [...text].reduce((w, c) => w + advance(c), 0)

/** The longest any bubble is, tail and all: the widest spinner word and its
 * dots, or the widest line Clawd says once. */
export const BUBBLE_REACH =
  Math.max(...[...VERBS, ...IDLE_WORDS].map(word => widthOf(word) + BUBBLE.dots), ...ALL_LINES.map(widthOf)) +
  2 * BUBBLE.pad -
  BUBBLE.right

type BubbleOptions = {
  /** One of the words Clawd says while Claude works: it shows in its own turn
   * (the `index`th), then gives way to the next; `elapsed` seconds of the
   * round have gone by already. */
  turn?: { index: number; elapsed: number }
  /** Three dots hopping after the word, as a spinner word has. */
  hasDots?: boolean
  /** Shown whole, not typed out: the stroll shows and hides it itself. */
  isWhole?: boolean
}

/** A speech bubble at Clawd's left, its tail towards Clawd. Plain, the words
 * are typed out a letter at a time, once. */
export function bubble(words: string, accent: string, { turn, hasDots = false, isWhole = false }: BubbleOptions = {}): string {
  const isSaying = turn !== undefined
  const withDots = isSaying || hasDots
  const startsAt = (turn?.index ?? 0) * SAY_SECONDS - (turn?.elapsed ?? 0)
  const { right, top, bottom, pad, radius: r } = BUBBLE
  const chars = [...words]
  const centers: number[] = []
  let width = 0
  for (const c of chars) {
    centers.push(width + advance(c) / 2)
    width += advance(c)
  }
  const left = right - 2 * pad - width - (withDots ? BUBBLE.dots : 0)
  const x0 = left + pad
  const f = (v: number) => v.toFixed(2)
  const skin = `M${f(left + r)} ${top}H${right - r}Q${right} ${top} ${right} ${top + r}V1.2L${f(right + 2.8)} 3L${right} 4.8V${bottom - r}Q${right} ${bottom} ${right - r} ${bottom}H${f(left + r)}Q${f(left)} ${bottom} ${f(left)} ${bottom - r}V${top + r}Q${f(left)} ${top} ${f(left + r)} ${top}Z`
  const letters = chars
    .map(
      (c, i) =>
        `<text class="ch" x="${f(x0 + (centers[i] ?? 0))}" y="4.7" style="animation-delay:${f(startsAt + 0.3 + i * 0.07)}s">${escapeXml(c)}</text>`,
    )
    .join('')
  const dots = withDots
    ? [0, 1, 2]
        .map(
          i =>
            `<rect class="dot" x="${f(x0 + width + 1.4 + i * 2.5)}" y="3.5" width="1.3" height="1.3" rx=".3" fill="${accent}" style="animation-delay:${f(i * 0.15)}s"/>`,
        )
        .join('')
    : ''
  const kind = isSaying ? 'loop' : isWhole ? 'said' : 'once'

  return `<g class="bubble ${kind}"${isSaying ? ` style="animation-delay:${f(startsAt)}s"` : ''} shape-rendering="geometricPrecision"><path class="skin" d="${skin}"/>${letters}${dots}</g>`
}

/** The timing of `count` bubbles taking turns: each pops in, has its word
 * typed, holds, and goes, `SAY_SECONDS` in all, then the round starts over. */
export function sayCss(count: number): string {
  const round = count * SAY_SECONDS
  const pct = (seconds: number) => `${((seconds / round) * 100).toFixed(3)}%`
  const end = SAY_SECONDS
  const rest = count > 1 ? '100%{opacity:0}' : ''

  return `
  .loop{opacity:0;animation:slot ${round}s linear infinite}
  @keyframes slot{0%{opacity:0;transform:scale(.4)}${pct(0.2)}{opacity:1;transform:scale(1.06)}${pct(0.3)}{opacity:1;transform:scale(1)}${pct(end - 0.25)}{opacity:1;transform:scale(1)}${pct(end)}{opacity:0;transform:scale(1)}${rest}}
  .loop .ch{animation:say ${round}s steps(1) infinite}
  @keyframes say{0%,${pct(end * 0.9)}{opacity:1}${pct(end * 0.9 + 0.01)},100%{opacity:0}}
`
}
