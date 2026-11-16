import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Look, Mood, Stroll, Walk } from '../types'
import { ACT_IDS } from './clawd/acts'
import { drawn, pick } from './clawd/bag'
import { BEACH, BEACH_SVG, BEACH_WIDTH } from './clawd/beach'
import { formOf, nextLook, tintOf } from './clawd/forms'
import { HAPPY_LINES } from './clawd/lines'
import { ASCII, caption, doing, planOf, sceneSvg, stageFor, strollSvg, svgWidth } from './clawd/scene'
import type { Scene } from './clawd/scene'
import { ACT_SECONDS, phaseFor, placeAt, resumed, stopped, xAt } from './clawd/walk'

// Clawd, the Claude Code crab, always above the chat box.
// While Claude works it side-steps across a small stage saying spinner words,
// and every 8 to 15 seconds stops where it is for a little act (waving,
// stretching, digging, humming...), then walks on from there. When the turn
// completes it hops on the spot.
// Between turns it strolls its beach: walks here and there, stops to act or
// just stand, says spinner words now and then. A stroll is one looping
// picture drawn from the `stroll` state alone, so it is drawn once and plays
// by itself, with nothing redrawn while it lasts.
// All Clawd says is English. Each turn it comes out in another form (a hat,
// sometimes a rare body colour). Proportions follow Clawd's pixel art: an
// 11x7 torso, 2x2 claws on each side, two 1x2 black eyes and four 1x2 legs.
// Left of Clawd the band is its beach: the sea and a sailboat, a sandcastle,
// a parasol, a palm and a small crab friend, on one strip of sand that runs
// on under Clawd's feet.

// ---------------------------------------------------------------- state

const isHidden = atom({ plugin: 'clawd-buddy', key: 'isHidden' } as const, false)
/** Where `isHidden` is kept across sessions, in the mod's own store: one
 * switch for every session. */
const HIDDEN_KEY = 'isHidden'

/** The switch as the store has it now, taken into this session's state: sent
 * away or called back in another session, Clawd follows here too. */
async function syncHidden($: EngineInterface): Promise<boolean> {
  const hidden = (await $.store.get(HIDDEN_KEY)) === true
  await update($, isHidden, () => hidden)

  return hidden
}
const isWorking = atom({ plugin: 'clawd-buddy', key: 'isWorking' } as const, false)
const IDLE: Mood = { kind: 'idle', n: 0, until: 0, line: '', act: 'wave', acts: [] }
const mood = atom({ plugin: 'clawd-buddy', key: 'mood' } as const, IDLE, {
  shape: 'mood-5',
})
const walk = atom({ plugin: 'clawd-buddy', key: 'walk' } as const, { since: 0, phase: 0, said: 0 } as Walk)
const FIRST_LOOK: Look = { form: 'sailor', verbs: ['Clauding'], tint: 'orange', bag: [] }
const look = atom({ plugin: 'clawd-buddy', key: 'look' } as const, FIRST_LOOK, {
  shape: 'look-2',
})
const stroll = atom({ plugin: 'clawd-buddy', key: 'stroll' } as const, { since: 0, seed: 1, x: 0 } as Stroll)

// ---------------------------------------------------------------- moods

/** How long Clawd celebrates a finished turn, in ms. */
const HAPPY_MS = 3600

/** The wait between acts while Claude works, in ms, after the last one ends. */
const gapMs = () => 8000 + Math.random() * 7000

const isLive = (m: Mood, now: number) => m.kind !== 'idle' && now < m.until

/** The mood over: back to idle, the act's bag kept for the next one. */
const rested = (m: Mood): Mood => ({ ...m, kind: 'idle', n: m.n + 1, until: 0 })

/** One out of `lines`, never the one just said. */
const freshLine = (lines: readonly string[], last: string) => {
  const others = lines.filter(line => line !== last)

  return pick(others.length > 0 ? others : lines)
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31)

/** A new stroll from `x`, starting at `now`. */
async function setOff($: EngineInterface, now: number, x: number) {
  await update($, stroll, () => ({ since: now, seed: newSeed(), x: Math.round(x * 100) / 100 }))
}

/** Where the stroll has Clawd at `now`, in its pixels. */
async function strollingAt($: EngineInterface, now: number): Promise<number> {
  const s = await read($, stroll)

  return placeAt(planOf(s), (now - s.since) / 1000)
}

/** Where the working walk has Clawd at `now`: where it stopped, if a mood
 * stopped it, else where its walk has got to. */
async function walkingAt($: EngineInterface, now: number): Promise<number> {
  const w = await read($, walk)
  const m = await read($, mood)

  return xAt(isLive(m, now) || m.kind === 'happy' ? w.phase : stopped(w, now).phase)
}

// A mood carries its own end time, so it ends even when the timer that would
// end it is lost (a reload drops the module's timers). Clawd stops walking
// for it where it is, or stays where an earlier mood stopped it, and walks on
// from there when it ends; a celebration ends in a stroll from there.
async function setMood($: EngineInterface, kind: 'happy' | 'act'): Promise<Mood> {
  const now = await $.clock.now()
  if (!isLive(await read($, mood), now)) {
    await update($, walk, w => stopped(w, now))
  }
  const verbs = (await read($, look)).verbs
  const next = await update($, mood, m => {
    if (kind === 'happy') {
      return { ...m, kind, n: m.n + 1, until: now + HAPPY_MS, line: freshLine(HAPPY_LINES, m.line) }
    }
    const { next: act, bag: acts } = drawn(m.acts, ACT_IDS, m.act)

    return { ...m, kind, n: m.n + 1, until: now + ACT_SECONDS * 1000, act, acts, line: freshLine(verbs, m.line) }
  })
  const n = next.n
  $.clock.after(next.until - now, () => {
    void (async () => {
      if ((await read($, mood)).n !== n) {
        return
      }
      const then = await $.clock.now()
      if (kind === 'happy' && !(await read($, isWorking))) {
        // The stroll is ready before the celebration gives way to it.
        await setOff($, then, xAt((await read($, walk)).phase))
      }
      await update($, walk, w => resumed(w, then))
      await update($, mood, m => (m.n === n ? rested(m) : m))
    })()
  })

  return next
}

/** While Claude works, every 8 to 15 seconds Clawd stops for a little act:
 * never while sent away or mid-mood. The loop starts once per load, at
 * session.start; a reload drops its timer and starts another. */
function actLater($: EngineInterface, wait: number) {
  $.clock.after(wait, () => {
    void (async () => {
      let busyMs = 0
      try {
        const now = await $.clock.now()
        if ((await read($, isWorking)) && !(await read($, isHidden)) && !isLive(await read($, mood), now)) {
          busyMs = (await setMood($, 'act')).until - now
        }
      } finally {
        actLater($, busyMs + gapMs())
      }
    })()
  })
}

// ---------------------------------------------------------------- hooks

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // A reload lands at a turn's end, so no turn is running now; a turn.complete
    // that fell during the reload must not leave Clawd thinking it still is.
    // It strolls on from where it last stood.
    const now = await $.clock.now()
    const wasWalking = (await read($, isWorking)) || (await read($, mood)).kind === 'happy'
    const x = wasWalking ? await walkingAt($, now) : await strollingAt($, now)
    await update($, isWorking, () => false)
    await update($, mood, rested)
    await setOff($, now, x)
    // Sent away with /crab, Clawd stays away in later sessions too: the
    // session's state starts over each time, the store does not.
    await syncHidden($)
    await $.command.register({
      name: 'crab',
      description: '关掉或打开输入框上方的小螃蟹 Clawd',
    })
    actLater($, gapMs())

    return next(e)
  })

  // /crab flips the switch every session shares, not this session's copy of
  // it, which another session may have changed since.
  on('command.run', { command: 'crab' }, async $ => {
    const hidden = !(await syncHidden($))
    await $.store.set(HIDDEN_KEY, hidden)
    await update($, isHidden, () => hidden)

    return {
      text: hidden
        ? 'Clawd 回去睡觉了，所有对话里都不会再出来；再输入 /crab 叫它回来。'
        : 'Clawd 回来啦，所有对话里它都会一直在。',
    }
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      // A look at the switch as each turn starts is enough for a session to
      // follow the others. The switch unread, Clawd keeps to what this
      // session last knew.
      await syncHidden($).catch(() => undefined)
      // A new form and word for each turn; they stay through the walk and the
      // celebration of this turn. Clawd sets off from where its stroll has it
      // (still celebrating the turn before, from where that leaves it), with
      // the first of its words.
      const now = await $.clock.now()
      const isStopped = isLive(await read($, mood), now)
      const phase = isStopped ? (await read($, walk)).phase : phaseFor(await strollingAt($, now))
      await update($, walk, () => ({ since: now, phase, said: 0 }))
      await update($, look, nextLook)
      await update($, isWorking, () => true)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()
      if (e.reason === 'answer') {
        await setMood($, 'happy')
        await update($, isWorking, () => false)
      } else {
        // No celebration: Clawd strolls on from where it stands.
        await setOff($, now, await walkingAt($, now))
        await update($, isWorking, () => false)
        await update($, mood, m => (m.kind === 'act' ? rested(m) : m))
      }
    }

    return next(e)
  })

  // Above the prompt, always: walking, acting or celebrating while Claude
  // works and as its turn completes, strolling its beach the rest of the time.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }

    const working = e.props.isWorking || (await read($, isWorking))
    const current = await read($, mood)
    // While Claude works, the clock is asked only while a mood stands, as its
    // end is all it is for; between turns the celebration lasts until its
    // timer ends it, so the stroll's picture never depends on the clock.
    const moved = working
      ? current.kind !== 'idle' && isLive(current, await $.clock.now())
        ? current.kind
        : undefined
      : current.kind === 'happy'
        ? 'happy'
        : undefined
    const scene: Scene = moved ?? (working ? 'walk' : 'stroll')

    const rest = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    const currentLook = await read($, look)
    const form = formOf(currentLook)
    const body = tintOf(currentLook)
    const words = caption(scene, currentLook, current)

    if (e.surface === 'terminal') {
      return (
        <Box flexDirection="column">
          <Box key="clawd" justifyContent="space-between" alignItems="center" gap={1}>
            <Text dimColor>{words}</Text>
            <Box flexDirection="column">
              {ASCII.map(line => (
                <Text color={body}>{line}</Text>
              ))}
            </Box>
          </Box>
          {rest}
        </Box>
      )
    }
    if (e.surface !== 'desktop' && e.surface !== 'vscode' && e.surface !== 'mobile') {
      return rest
    }

    // Right to left: Clawd's stage, then its beach, which gives way first
    // where the band is narrow; what room is left over stays at the far left,
    // where the sea fades out.
    const { Svg } = $.ui.resolve(e)
    const box = stageFor(form)
    const source =
      scene === 'stroll' ? strollSvg(await read($, stroll), currentLook) : sceneSvg(scene, current, currentLook, await read($, walk))
    const act = doing(scene, current)

    return (
      <Box flexDirection="column">
        <Box key="clawd" flexDirection="row-reverse" justifyContent="flex-start" alignItems="center">
          <Box key="stage" flexShrink={0}>
            <Svg
              source={source}
              alt={`Clawd the crab (${form.name})${act ? `, ${act}` : ''}: ${words}`}
              width={svgWidth(box)}
              height={box.height}
              isInteractive
            />
          </Box>
          <Box key="beach" flexShrink={1} overflow="hidden" justifyContent="flex-end">
            <Svg
              source={BEACH_SVG}
              alt="Clawd's beach: the sea, a sailboat, a sandcastle, a parasol and a palm"
              width={BEACH_WIDTH}
              height={BEACH.height}
            />
          </Box>
        </Box>
        {rest}
      </Box>
    )
  })
}
