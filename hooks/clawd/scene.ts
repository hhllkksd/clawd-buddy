// One drawing of Clawd on its stage. While Claude works: walking with its
// words, stopped for a little act, or celebrating the finished turn. Between
// turns: on its stroll, one looping picture of walks and stops.

import type { Look, Mood, Stroll, Walk } from '../../types'
import { ACT_CSS, ACT_IDS, ACTS, actFor } from './acts'
import { GROUND, SAND } from './beach'
import { BUBBLE_REACH, bubble, sayCss } from './bubble'
import { crab } from './crab'
import { SAY_SECONDS, formOf, tintOf, wordsOf } from './forms'
import type { Form } from './forms'
import { HAPPY_LINES, IDLE_WORDS, REST_LINE } from './lines'
import { spark } from './pixels'
import { ROAM, ROAM_MS, plan, wrapped, xAt } from './walk'
import type { Plan } from './walk'

/** What a drawing of Clawd shows: walking while Claude works, stopped there
 * for an act, celebrating a finished turn, or strolling between turns. */
export type Scene = 'walk' | 'act' | 'happy' | 'stroll'

const BASE_CSS = `
  .crab,.torso,.arm,.leg,.eyes,.float,.spark,.grain,.bubble,.dot{transform-box:fill-box}
  .eyes{transform-origin:50% 50%;animation:blink 4.5s infinite}
  @keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
  .twinkle{animation:twinkle .9s steps(1) infinite}
  @keyframes twinkle{0%{opacity:1}50%{opacity:.3}}
  .bubble{transform-origin:100% 60%}
  .once{animation:pop .3s ease-out}
  @keyframes pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}
  .skin{fill:#FFFDF7;stroke:#CFC8B8;stroke-width:.5}
  .ch{font:600 6.2px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;fill:#3A3530;text-anchor:middle;opacity:0}
  .once .ch{animation:typed .01s steps(1) forwards}
  .said .ch{opacity:1}
  @keyframes typed{to{opacity:1}}
  .dot{animation:bop 1s ease-in-out infinite}
  @keyframes bop{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-1.6px)}}
`

/** Legs stepping, body bobbing, claws pinching, under the selector `p`. */
const stepping = (p: string) => `
  ${p} .leg{animation:step .32s steps(1) infinite}
  ${p} .leg.b{animation-delay:-.16s}
  @keyframes step{0%{transform:translateY(0)}50%{transform:translateY(-1px)}}
  ${p} .torso{animation:bob .32s steps(1) infinite}
  @keyframes bob{0%{transform:translateY(0)}50%{transform:translateY(-.5px)}}
  ${p} .arm{animation:pinch .64s steps(1) infinite}
  ${p} .arm.r{animation-delay:-.32s}
  @keyframes pinch{0%{transform:translateY(0)}50%{transform:translateY(-1px)}}
`

const WALK_CSS = `
  .rig{animation:roam ${ROAM_MS / 1000}s ease-in-out infinite}
  @keyframes roam{0%,100%{transform:translateX(0)}50%{transform:translateX(-${ROAM}px)}}
  ${stepping('')}
`

const HAPPY_CSS = `
  .crab{transform-origin:50% 100%;animation:hop .7s ease-in-out 5}
  @keyframes hop{0%,100%{transform:translateY(0) scaleY(1)}15%{transform:translateY(0) scaleY(.85)}
    45%,55%{transform:translateY(-2px) scaleY(1.05)}85%{transform:translateY(0) scaleY(.9)}}
  .arm{animation:wave .18s ease-in-out infinite alternate}
  @keyframes wave{from{transform:translateY(-2px)}to{transform:translateY(-3px)}}
  .spark{fill:#F2C14E;opacity:0;animation:flash .6s steps(1) infinite}
  .spark.s2{animation-delay:-.3s}
  @keyframes flash{0%{opacity:0}50%{opacity:1}}
`

/** The band's stage: Clawd rests near its right end with its bubble at its
 * left, and side-steps left across it; room above for the tallest hat, hops
 * and floating notes. As tall as it always was. */
const STAGE_RIGHT = 20
const STAGE_LEFT = -Math.ceil(BUBBLE_REACH + ROAM + 2)
const STAGE = { x: STAGE_LEFT, y: -9, w: STAGE_RIGHT - STAGE_LEFT, h: 18, height: 31 }
type Stage = typeof STAGE

/** The stage for one form: wider on the right by what the form holds out. */
export const stageFor = (form: Form): Stage => ({ ...STAGE, w: STAGE.w + (form.reach ?? 0) })

export const svgWidth = (box: Stage) => Math.round((box.w * box.height) / box.h)

const svgHead = (id: string, box: Stage) =>
  `<svg xmlns="http://www.w3.org/2000/svg" id="${id}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${svgWidth(box)}" height="${box.height}" shape-rendering="crispEdges">`
const sandOf = (box: Stage) =>
  `<rect x="${box.x}" y="${GROUND}" width="${box.w}" height="${SAND.depth}" fill="${SAND.color}" opacity="${SAND.opacity}"/>`

/** What Clawd says once in its bubble: a spinner word mid-act, a line when happy. */
const spoken = (scene: Scene, current: Mood) => current.line || (scene === 'act' ? 'Clauding' : (HAPPY_LINES[0] ?? 'All done!'))

/** One drawing of Clawd while Claude works, or as the turn completes.
 * Walking, the walk's animation starts `steps.phase` into itself and the
 * words `steps.said` into theirs; acting or happy, Clawd stands where the
 * walk had it at `steps.phase`, its bubble there too. */
export function sceneSvg(scene: Exclude<Scene, 'stroll'>, current: Mood, currentLook: Look, steps: Walk): string {
  const form = formOf(currentLook)
  const body = tintOf(currentLook)
  const box = stageFor(form)
  const said = wordsOf(currentLook)
  const seconds = (ms: number) => (ms / 1000).toFixed(2)
  const head = svgHead(`clawd-${scene}-${current.n}`, box)

  if (scene === 'walk') {
    const elapsed = wrapped(steps.said, said.length * SAY_SECONDS * 1000) / 1000

    return `${head}
<style>${BASE_CSS}${WALK_CSS}.rig{animation-delay:-${seconds(wrapped(steps.phase, ROAM_MS))}s}${sayCss(said.length)}</style>
${sandOf(box)}
<g class="rig">
${said.map((word, index) => bubble(word, body, { turn: { index, elapsed } })).join('\n')}
${crab(form, body)}
</g>
</svg>`
  }

  const isAct = scene === 'act'
  const act = ACTS[current.act] ?? ACTS.wave
  const css = isAct ? ACT_CSS + act.css('.actor') : HAPPY_CSS
  const face = isAct ? { eyes: act.eyes, hasBlush: act.hasBlush } : { eyes: 'closed' as const }
  const extras = isAct ? act.extras : spark('#F2C14E', -9, -8) + spark('#F2C14E', 16, -7, 's2')

  return `${head}
<style>${BASE_CSS}${css}</style>
${sandOf(box)}
<g class="rig" transform="translate(${xAt(steps.phase).toFixed(2)} 0)">
${bubble(spoken(scene, current), body, { hasDots: isAct })}
<g class="actor">${crab(form, body, face)}${extras}</g>
</g>
</svg>`
}

// ---------------------------------------------------------------- strolling

/** The stroll a `Stroll` stands for: the same one each time it is asked. */
export const planOf = (s: Stroll): Plan => plan(s.seed, s.x, IDLE_WORDS, ACT_IDS)

const f3 = (v: number) => v.toFixed(3)

/** CSS that shows the element of class `cls` only inside `windows` (seconds
 * into a round of `total`), hidden the rest of the round. */
function shown(cls: string, windows: [number, number][], total: number): string {
  const pct = (s: number) => f3((s / total) * 100)
  const frames = [`0%{opacity:${windows.some(([a]) => a <= 0) ? 1 : 0}}`]
  for (const [a, b] of windows) {
    if (a > 0) {
      frames.push(`${pct(a)}%{opacity:1}`)
    }
    frames.push(`${pct(b)}%{opacity:0}`)
  }
  frames.push('100%{opacity:0}')

  return `.${cls}{opacity:0;animation:${cls} ${f3(total)}s step-end infinite}@keyframes ${cls}{${frames.join('')}}`
}

/** Clawd on its stroll between turns: one picture that loops by itself,
 * walking between stops, saying its words, doing its acts. Drawn from `s`
 * and `look` alone, so the same state always gives the same picture, and
 * nothing is redrawn while it plays. */
export function strollSvg(s: Stroll, look: Look): string {
  const p = planOf(s)
  const form = formOf(look)
  const body = tintOf(look)
  const box = stageFor(form)
  const pct = (t: number) => f3((t / p.total) * 100)

  const moves: string[] = []
  const walking: [number, number][] = []
  const parts: string[] = []
  const css: string[] = []
  let t = 0
  p.legs.forEach((leg, i) => {
    const arrives = t + leg.walk
    const leaves = arrives + leg.stop
    moves.push(`${pct(t)}%{transform:translateX(${leg.from}px);animation-timing-function:ease-in-out}`)
    moves.push(`${pct(arrives)}%{transform:translateX(${leg.to}px);animation-timing-function:linear}`)
    walking.push([t, arrives])

    if (leg.sayWalking) {
      parts.push(`<g class="sw${i}">${bubble(leg.sayWalking, body, { hasDots: true, isWhole: true })}</g>`)
      css.push(shown(`sw${i}`, [[t, arrives]], p.total))
    }
    if (leg.sayStopped) {
      parts.push(`<g class="ss${i}">${bubble(leg.sayStopped, body, { hasDots: true, isWhole: true })}</g>`)
      css.push(shown(`ss${i}`, [[arrives, leaves]], p.total))
    }
    const act = actFor(leg.act)
    parts.push(`<g class="st${i}">${crab(form, body, { eyes: act.eyes, hasBlush: act.hasBlush })}${act.extras}</g>`)
    css.push(shown(`st${i}`, [[arrives, leaves]], p.total), act.css(`.st${i}`))
    t = leaves
  })
  moves.push(`100%{transform:translateX(${p.legs[0]?.from ?? 0}px)}`)
  parts.push(`<g class="walker">${crab(form, body)}</g>`)
  css.push(shown('walker', walking, p.total))

  return `${svgHead(`clawd-stroll-${s.seed}`, box)}
<style>${BASE_CSS}${ACT_CSS}${stepping('.walker')}
  .rig{animation:stroll ${f3(p.total)}s linear infinite}
  @keyframes stroll{${moves.join('')}}
  ${css.join('\n  ')}</style>
${sandOf(box)}
<g class="rig">
${parts.join('\n')}
</g>
</svg>`
}

// ---------------------------------------------------------------- words

// Clawd as the terminal draws it, in block characters.
export const ASCII = [' ▐▛███▜▌', '▝▜█████▛▘', '  ▘▘ ▝▝']

/** The words beside Clawd, always English: a spinner word while working, as
 * Claude Code's, what it says, or that it is strolling. */
export function caption(scene: Scene, currentLook: Look, current: Mood): string {
  switch (scene) {
    case 'walk':
      return `${wordsOf(currentLook)[0]}…`
    case 'act':
      return `${spoken(scene, current)}…`
    case 'happy':
      return spoken(scene, current)
    case 'stroll':
      return REST_LINE
  }
}

/** What Clawd is up to, for the picture's description. */
export const doing = (scene: Scene, current: Mood) => (scene === 'act' ? (ACTS[current.act] ?? ACTS.wave).caption : undefined)
