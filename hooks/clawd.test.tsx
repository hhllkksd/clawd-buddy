import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { ACT_IDS } from './clawd/acts'
import { VERBS } from './clawd/forms'
import { HAPPY_LINES, IDLE_WORDS } from './clawd/lines'
import { ROAM, phaseFor, placeAt, plan, xAt } from './clawd/walk'

const PROPS = {
  hasSurvey: false,
  isCollapsed: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 19 },
}

const band = (surface: 'desktop' | 'terminal', isWorking: boolean) =>
  ({ plugin: 'clawd-buddy', component: 'AbovePrompt', surface, props: { ...PROPS, isWorking } }) as never

type Ui = { find: (q: never) => Promise<{ props: Record<string, unknown> } | undefined> }
const svgOf = (ui: unknown) => (ui as Ui).find({ type: 'Svg' } as never)

/** How far left of its resting place Clawd is drawn, in its pixels: where a
 * still drawing puts it, or how far into its walk a walking one starts. */
const placeIn = (source: unknown) => {
  const still = /<g class="rig" transform="translate\((-?[\d.]+) 0\)">/.exec(String(source))?.[1]
  const walking = /\.rig\{animation-delay:-([\d.]+)s\}/.exec(String(source))?.[1]

  return { still: still === undefined ? undefined : Number(still), walking: walking === undefined ? undefined : Number(walking) }
}

/** A stroll's picture taken apart: its seed and where it starts. */
const strollIn = (source: unknown) => {
  const seed = /id="clawd-stroll-(\d+)"/.exec(String(source))?.[1]
  const start = /@keyframes stroll\{0\.000%\{transform:translateX\((-?[\d.]+)px\)/.exec(String(source))?.[1]

  return seed === undefined ? undefined : { seed: Number(seed), start: Number(start) }
}

/** The words of each bubble in a drawing. */
const bubbleWords = (source: unknown) =>
  String(source)
    .split('class="bubble ')
    .slice(1)
    .map(part => [...part.split('</g>')[0]!.matchAll(/<text class="ch"[^>]*>([^<]*)<\/text>/g)].map(m => m[1]).join(''))

/** The picture's description, taken apart: the form, the act if any, the words. */
const altOf = (alt: unknown) => {
  const m = /^Clawd the crab \(([^)]*)\)(?:, ([^:]*))?: (.*)$/.exec(String(alt))

  return { form: m?.[1], act: m?.[2], words: m?.[3] }
}

const ACTS = [
  'waving hello',
  'having a big stretch',
  'looking around',
  'digging in the sand',
  'humming a tune',
  'yawning',
  'bouncing on the spot',
  'clacking its claws',
]

const isStrolling = (svg: { props: Record<string, unknown> } | undefined) =>
  altOf(svg?.props.alt).words === 'Strolling~' && strollIn(svg?.props.source) !== undefined

/** Only printable ASCII: no Chinese anywhere Clawd speaks or is described. */
const ENGLISH = /^[ -~…]*$/

type Engine = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

/** `/crab` as the person types it at the prompt, with nothing after it. */
const crab = ($: Engine) =>
  $.command.run({
    command: 'crab',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })

/** The engine's side of a session starting, with `/crab` registered. */
const sessionHooks = (on: On) => {
  on('command.register', () => ({ value: { command: 'crab' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
}

/** A session starting, or starting again as a reload has it. */
const restart = ($: Engine) => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

const startSession = async ($: Engine, on: On) => {
  sessionHooks(on)
  await restart($)
}

// ---------------------------------------------------------------- strolling

const near = (a: number | undefined, b: number, within = 1e-6) => Math.abs((a ?? NaN) - b) < within

test('Clawd has words of its own between turns, none of them a spinner word', () => {
  expect(IDLE_WORDS.length).toBeGreaterThanOrEqual(20)
  expect(IDLE_WORDS.filter(word => VERBS.includes(word))).toEqual([])
  expect(new Set(IDLE_WORDS).size).toBe(IDLE_WORDS.length)
  for (const word of IDLE_WORDS) {
    expect(word).toMatch(/^[A-Z][a-z]+(-[a-z]+)?ing$/)
  }
})

test('a stroll wanders the beach and comes back to where it began, stopping to act or rest', () => {
  for (let seed = 1; seed < 200; seed++) {
    const start = -((seed * 7) % (ROAM + 1))
    const p = plan(seed, start, IDLE_WORDS, ACT_IDS)
    expect(p.legs).toHaveLength(6)
    expect(p.legs[0]?.from).toBe(start)
    expect(p.legs.at(-1)?.to).toBe(start)
    for (const leg of p.legs) {
      expect(leg.to).toBeGreaterThanOrEqual(-ROAM)
      expect(leg.to).toBeLessThanOrEqual(0)
      if (leg.act !== 'rest') {
        expect(IDLE_WORDS).toContain(leg.sayStopped)
      }
    }
    expect(near(placeAt(p, 0), start)).toBe(true)
    expect(near(placeAt(p, p.total), start)).toBe(true)
    // The same seed always gives the same stroll.
    expect(plan(seed, start, IDLE_WORDS, ACT_IDS)).toEqual(p)
  }
})

test('between turns Clawd strolls: one picture with walks, acts and spinner words, all in English', async $ => {
  const ui = await $.ui.mount(band('desktop', false))

  const svg = await svgOf(ui)
  expect(isStrolling(svg)).toBe(true)
  const source = String(svg?.props.source)
  expect(source.length).toBeLessThan(131072 / 2)
  expect(source).toContain('class="walker"')
  expect(source).toContain('class="st0"')
  expect(bubbleWords(source).length).toBeGreaterThan(0)
  for (const word of bubbleWords(source)) {
    expect(IDLE_WORDS).toContain(word)
  }
  expect(String(svg?.props.alt)).toMatch(ENGLISH)
  expect(await ui.find({ type: 'Button' } as never)).toBeUndefined()
  expect(await ui.find({ type: 'Text' })).toBeUndefined()
  await ui.unmount()
})

test('the stroll plays by itself: its picture is not redrawn while Clawd strolls', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  await startSession($, on)
  const ui = await $.ui.mount(band('desktop', false))
  const first = String((await svgOf(ui))?.props.source)
  expect(strollIn(first)).toBeDefined()

  for (let i = 0; i < 120; i++) {
    await clock.advance(1000)
    expect(String((await svgOf(ui))?.props.source)).toBe(first)
  }
  await ui.unmount()
})

// ---------------------------------------------------------------- working

test('while Claude works, Clawd walks saying spinner words, and every 8 to 15 seconds stops for an act', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  await startSession($, on)
  await $.turn.start({ text: '', turnId: 't1' })
  const ui = await $.ui.mount(band('desktop', true))

  const svg = await svgOf(ui)
  expect(String(svg?.props.alt)).toMatch(/^Clawd the crab \([a-zA-Z ]+\): [A-Z][A-Za-z-]+…$/)
  const said = bubbleWords(svg?.props.source)
  expect(said.length).toBe(12)
  expect(new Set(said).size).toBe(12)

  const starts: number[] = []
  let last: string | undefined
  for (let t = 100; t <= 90_000; t += 100) {
    await clock.advance(100)
    const now = await svgOf(ui)
    const act = altOf(now?.props.alt).act
    if (act !== undefined && act !== last) {
      starts.push(t)
      expect(ACTS).toContain(act)
      expect(placeIn(now?.props.source).still).toBeDefined()
      expect(said).toContain(bubbleWords(now?.props.source)[0])
    }
    last = act
  }
  expect(starts.length).toBeGreaterThanOrEqual(4)
  for (let i = 1; i < starts.length; i++) {
    const gap = (starts[i] ?? 0) - (starts[i - 1] ?? 0) - 3000
    expect(gap).toBeGreaterThanOrEqual(7900)
    expect(gap).toBeLessThanOrEqual(15_100)
  }
  await ui.unmount()
})

test('a turn starting sets Clawd walking from where its stroll had it', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  await startSession($, on)
  const ui = await $.ui.mount(band('desktop', false))
  const s = strollIn((await svgOf(ui))?.props.source)
  expect(s).toBeDefined()

  await clock.advance(7300)
  const there = placeAt(plan(s?.seed ?? 0, s?.start ?? 0, IDLE_WORDS, ACT_IDS), 7.3)
  await $.turn.start({ text: '', turnId: 't1' })
  const working = await $.ui.mount(band('desktop', true))
  const walking = placeIn((await svgOf(working))?.props.source).walking
  expect(walking).toBeDefined()
  expect(Math.abs(xAt((walking ?? 0) * 1000) - there)).toBeLessThan(0.1)
  expect(Math.abs(xAt(phaseFor(there)) - there)).toBeLessThan(0.01)
  await working.unmount()
  await ui.unmount()
})

const formIn = (alt: unknown) => altOf(alt).form

test('each turn Clawd comes out in another form, all five before any repeats', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))

  const seen: (string | undefined)[] = []
  for (let i = 0; i < 10; i++) {
    await $.turn.start({ text: '', turnId: `t${i}` })
    const ui = await $.ui.mount(band('desktop', true))
    seen.push(formIn((await svgOf(ui))?.props.alt))
    await ui.unmount()
  }

  const all = ['Santa hat', 'crown', 'sailor', 'straw hat', 'wizard']
  expect([...seen.slice(0, 5)].sort()).toEqual([...all].sort())
  expect([...seen.slice(5)].sort()).toEqual([...all].sort())
  for (let i = 1; i < seen.length; i++) {
    expect(seen[i]).not.toBe(seen[i - 1])
  }
})

test('when the turn completes, Clawd celebrates in English where it is, then strolls on from there', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  await startSession($, on)
  await $.turn.start({ text: '', turnId: 't1' })
  const ui = await $.ui.mount(band('desktop', true))

  await clock.advance(4000)
  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'done', durationMs: 4000, isAborted: false })
  const after = await $.ui.mount(band('desktop', false))
  const svg = await svgOf(after)
  expect(HAPPY_LINES).toContain(altOf(svg?.props.alt).words)
  expect(HAPPY_LINES).toContain(bubbleWords(svg?.props.source)[0])
  const x = placeIn(svg?.props.source).still ?? 0

  await clock.advance(3700)
  const next = await svgOf(after)
  expect(isStrolling(next)).toBe(true)
  expect(near(strollIn(next?.props.source)?.start, x, 0.05)).toBe(true)
  await ui.unmount()
  await after.unmount()
})

test('a turn interrupted, or ended by an error, ends with no celebration', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))

  for (const reason of ['aborted', 'api-error'] as const) {
    await $.turn.start({ text: '', turnId: reason })
    await $.turn.complete({ turnId: reason, reason, answer: '', durationMs: 4000, isAborted: reason === 'aborted' } as never)
    const after = await $.ui.mount(band('desktop', false))
    expect(isStrolling(await svgOf(after))).toBe(true)
    await after.unmount()
  }
})

test('reloaded mid-turn, Clawd strolls on', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  await startSession($, on)
  await $.turn.start({ text: '', turnId: 't1' })

  await restart($)
  const ui = await $.ui.mount(band('desktop', false))
  expect(isStrolling(await svgOf(ui))).toBe(true)
  await ui.unmount()
})

// ---------------------------------------------------------------- the rest

test('the terminal shows Clawd in block characters, with English words beside it', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  const idle = await $.ui.mount(band('terminal', false))
  const words = async (ui: typeof idle) =>
    (await ui.findAll({ type: 'Text' } as never)).map(t => (t as unknown as { text: string }).text)

  expect(await words(idle)).toContain('▝▜█████▛▘')
  expect(await words(idle)).toContain('Strolling~')
  await idle.unmount()

  await $.turn.start({ text: '', turnId: 't1' })
  const working = await $.ui.mount(band('terminal', true))
  expect((await words(working)).some(w => /^[A-Z][A-Za-z-]+…$/.test(w))).toBe(true)
  await working.unmount()
})

test('left of Clawd the band is its beach, on the same sand, all described in English', async $ => {
  const ui = await $.ui.mount(band('desktop', true))

  const drawings = await ui.findAll({ type: 'Svg' } as never)
  expect(drawings).toHaveLength(2)
  const [clawd, beach] = drawings.map(d => (d as unknown as { props: Record<string, unknown> }).props)
  expect(String(clawd?.alt)).toMatch(ENGLISH)
  expect(String(beach?.alt)).toMatch(ENGLISH)
  expect(beach?.isInteractive).toBeUndefined()
  expect(String(clawd?.source)).toContain('height="2" fill="#E8C46A" opacity="0.6"')
  expect(String(beach?.source)).toContain('height="2" fill="#E8C46A" opacity="0.6"')
  await ui.unmount()
})

/** A store this test can change behind the session's back, as another session would. */
const sharedStore = (on: On, entries: Record<string, unknown>) => {
  const store = { ...entries }
  on('store.set', (_, e) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('store.get', (_, e) => ({ value: store[e.key] }))

  return store
}

test('/crab hides Clawd, and that is kept for later sessions', async ($, on) => {
  const store = sharedStore(on, {})
  await startSession($, on)

  await crab($)
  expect(store.isHidden).toBe(true)
  const hidden = await $.ui.mount(band('desktop', false))
  expect(await svgOf(hidden)).toBeUndefined()
  await hidden.unmount()

  const { text } = (await crab($)) as { text: string }
  expect(store.isHidden).toBe(false)
  expect(text).toContain('回来啦')
  const shown = await $.ui.mount(band('desktop', false))
  expect(await svgOf(shown)).toBeDefined()
  await shown.unmount()
})

test('a session started after /crab hid Clawd starts with it hidden', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on, { isHidden: true })
  await startSession($, on)

  const ui = await $.ui.mount(band('desktop', false))
  await clock.advance(30_000)
  expect(await svgOf(ui)).toBeUndefined()
  await ui.unmount()
})

test('hidden or shown from another session, Clawd follows when the next turn starts', async ($, on) => {
  const store = sharedStore(on, { isHidden: false })
  mock.clock(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  await startSession($, on)

  store.isHidden = true
  await $.turn.start({ text: '', turnId: 't1' })
  const hidden = await $.ui.mount(band('desktop', true))
  expect(await svgOf(hidden)).toBeUndefined()
  await hidden.unmount()

  store.isHidden = false
  await $.turn.start({ text: '', turnId: 't2' })
  const shown = await $.ui.mount(band('desktop', true))
  expect(await svgOf(shown)).toBeDefined()
  await shown.unmount()
})
