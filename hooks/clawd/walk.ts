// Where Clawd is. While Claude works: its walk there and back, stopped for an
// act or a celebration and taken up again from there. Between turns: its
// stroll, one looping script of walks and stops, drawn once as one animated
// picture so that nothing is redrawn (and nothing flickers) while it plays.

import type { ActId, Walk } from '../../types'
import { SAY_COUNT, SAY_SECONDS } from './forms'

/** How far left of its resting place Clawd goes, in its pixels, working or
 * strolling, and how long the working walk there and back takes. */
export const ROAM = 30
export const ROAM_MS = 8000

/** CSS `ease-in-out`, cubic-bezier(.42, 0, .58, 1): how far along, of 1, at
 * `p` of the time. */
export function easeInOut(p: number): number {
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3
  let low = 0
  let high = 1
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (at(0.42, 0.58, mid) < p) {
      low = mid
    } else {
      high = mid
    }
  }

  return at(0, 1, (low + high) / 2)
}

export const wrapped = (ms: number, round: number) => (Number.isFinite(ms) ? ((ms % round) + round) % round : 0)

// ---------------------------------------------------------------- working

/** Where the working walk has Clawd `phase` ms into it, in its pixels:
 * 0 at the right end where it rests, -ROAM at the far left. */
export function xAt(phase: number): number {
  const half = ROAM_MS / 2
  const p = wrapped(phase, ROAM_MS)

  return -ROAM * (p < half ? easeInOut(p / half) : 1 - easeInOut((p - half) / half))
}

/** A phase of the working walk that has Clawd at `x`, on its way out. */
export function phaseFor(x: number): number {
  const goal = Math.min(1, Math.max(0, -x / ROAM))
  let low = 0
  let high = 1
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2
    if (easeInOut(mid) < goal) {
      low = mid
    } else {
      high = mid
    }
  }

  return ((low + high) / 2) * (ROAM_MS / 2)
}

/** The walk stopped at `now`: Clawd stays where it had got to. */
export const stopped = (w: Walk, now: number): Walk => {
  const gone = Math.max(0, now - w.since)

  return { since: now, phase: wrapped(w.phase + gone, ROAM_MS), said: w.said + gone }
}

/** The walk taken up again at `now`, from where Clawd stands, with the word
 * after the one it was saying. */
export const resumed = (w: Walk, now: number): Walk => {
  const slot = SAY_SECONDS * 1000

  return { since: now, phase: w.phase, said: wrapped(Math.ceil(w.said / slot) * slot, SAY_COUNT * slot) }
}

// ---------------------------------------------------------------- strolling

/** One leg of the stroll: walk from `from` to `to`, then stop there. */
export type Leg = {
  from: number
  to: number
  /** Seconds walking, then seconds stopped. */
  walk: number
  stop: number
  /** What Clawd does while stopped. */
  act: ActId | 'rest'
  /** The spinner word said while walking, and while stopped; none, quiet. */
  sayWalking?: string
  sayStopped?: string
}

/** A whole stroll: its legs in order, `total` seconds, back where it began. */
export type Plan = { legs: Leg[]; total: number }

/** A small seeded random source, so one seed always gives the same stroll. */
function seeded(seed: number): () => number {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const LEGS = 6
/** How fast Clawd ambles, in its pixels a second. */
const STROLL_SPEED = 5
/** How long an act lasts, in seconds, strolling or working. */
export const ACT_SECONDS = 3

/** The stroll for one seed, starting (and ending) at `start`. Clawd ambles
 * here and there; at most stops it does an act and says a spinner word,
 * otherwise it stands and breathes; on about half its walks it talks too. */
export function plan(seed: number, start: number, verbs: readonly string[], acts: readonly ActId[]): Plan {
  const r = seeded(seed)
  const words = verbs.length > 0 ? verbs : ['Clauding']
  let w = Math.floor(r() * words.length)
  const word = () => words[w++ % words.length] ?? 'Clauding'
  const order = [...acts]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[order[i], order[j]] = [order[j] as ActId, order[i] as ActId]
  }

  const legs: Leg[] = []
  let x = start
  for (let i = 0; i < LEGS; i++) {
    let to = start
    if (i < LEGS - 1) {
      for (let tries = 0; tries < 8; tries++) {
        to = -Math.round(r() * ROAM)
        if (Math.abs(to - x) >= 8) {
          break
        }
      }
    }
    const walk = Math.max(1.5, Math.abs(to - x) / STROLL_SPEED)
    const isActing = r() < 0.65
    const act = isActing ? (order[i % order.length] ?? 'wave') : 'rest'
    const stop = isActing ? ACT_SECONDS : 2 + r() * 2
    const sayWalking = r() < 0.5 ? word() : undefined
    const sayStopped = isActing ? word() : undefined
    legs.push({ from: x, to, walk, stop, act, sayWalking, sayStopped })
    x = to
  }

  return { legs, total: legs.reduce((s, leg) => s + leg.walk + leg.stop, 0) }
}

/** Where the stroll has Clawd `seconds` after it began, in its pixels. */
export function placeAt(p: Plan, seconds: number): number {
  let t = Number.isFinite(seconds) && p.total > 0 ? ((seconds % p.total) + p.total) % p.total : 0
  for (const leg of p.legs) {
    if (t < leg.walk) {
      return leg.from + (leg.to - leg.from) * easeInOut(t / leg.walk)
    }
    t -= leg.walk
    if (t < leg.stop) {
      return leg.to
    }
    t -= leg.stop
  }

  return p.legs[0]?.from ?? 0
}
