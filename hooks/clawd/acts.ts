// The little things Clawd does when it stops on its stroll. Each is drawn as
// its own copy of Clawd, shown only while it stops there, so its motion
// loops for as long as it is shown; `css(p)` scopes the act to that copy.

import type { ActId } from '../../types'
import type { EyeKind } from './crab'
import { BIG_Z, NOTE, SMALL_Z, floater, rect, spark } from './pixels'

type Act = {
  /** In the picture's description. */
  caption: string
  eyes?: EyeKind
  hasBlush?: boolean
  /** The act's motion, its rules under the selector `p`. */
  css: (p: string) => string
  /** Drawn around Clawd in its local pixels, going where it goes. */
  extras: string
}

/** Shared by every act: things that float up and fade, sparks that flash. */
export const ACT_CSS = `
  .float,.spark,.grain{opacity:0}
  @keyframes rise{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(-3px)}}
  @keyframes flash{0%{opacity:0}50%{opacity:1}}
  @keyframes hi{0%{transform:translateY(-3px)}50%{transform:translateY(-1px)}}
  @keyframes reach{0%,100%{transform:scaleY(1)}30%,70%{transform:scaleY(1.12)}}
  @keyframes up{0%,100%{transform:translateY(0)}30%,70%{transform:translateY(-3px)}}
  @keyframes peek{0%{transform:translateX(-1px)}50%{transform:translateX(1px)}}
  @keyframes tilt{0%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
  @keyframes dig{0%{transform:translate(0,1px)}50%{transform:translate(-1px,2px)}}
  @keyframes hum{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
  @keyframes droop{0%,100%{transform:scaleY(1)}25%,75%{transform:scaleY(.88)}}
  @keyframes boing{0%,100%{transform:translateY(0) scaleY(1)}15%{transform:translateY(0) scaleY(.85)}
    45%,55%{transform:translateY(-3px) scaleY(1.05)}85%{transform:translateY(0) scaleY(.9)}}
  @keyframes clack{0%{transform:translateY(-2px)}50%{transform:translateY(0)}}
  @keyframes breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.95)}}
`

const floats = (p: string, seconds = 1.8) =>
  `${p} .float{animation:rise ${seconds}s ease-out infinite}${p} .f2{animation-delay:-${(seconds / 2).toFixed(2)}s}`
const sparks = (p: string) => `${p} .spark{animation:flash .5s steps(1) infinite}${p} .s2{animation-delay:-.25s}`

export const ACTS: Record<ActId, Act> = {
  // Waving its right claw high at whoever is there.
  wave: {
    caption: 'waving hello',
    eyes: 'big',
    css: p => `${p} .arm.r{animation:hi .3s steps(1) infinite}`,
    extras: '',
  },
  // A long stretch up, claws in the air.
  stretch: {
    caption: 'having a big stretch',
    eyes: 'closed',
    css: p =>
      `${p} .torso{transform-origin:50% 100%;animation:reach 3s ease-in-out infinite}${p} .arm{animation:up 3s ease-in-out infinite}`,
    extras: '',
  },
  // Looking left, then right, out over the sea.
  lookout: {
    caption: 'looking around',
    css: p =>
      `${p} .eyes{animation:peek 1.4s steps(1) infinite}${p} .torso{transform-origin:50% 100%;animation:tilt 1.4s steps(1) infinite}`,
    extras: '',
  },
  // Bent over, digging in the sand with its left claw, grains flying.
  dig: {
    caption: 'digging in the sand',
    css: p =>
      `${p} .torso{transform-origin:50% 100%;transform:rotate(-8deg)}${p} .arm.l{animation:dig .2s steps(1) infinite}` +
      `${p} .grain{fill:#E8C46A;animation:flash .4s steps(1) infinite}${p} .g2{animation-delay:-.2s}`,
    extras: `<g class="grain">${rect(-3, 5)}${rect(-5, 3)}</g><g class="grain g2">${rect(-4, 4)}${rect(-6, 6)}</g>`,
  },
  // Swaying gently with its eyes shut, notes drifting up.
  sing: {
    caption: 'humming a tune',
    eyes: 'closed',
    hasBlush: true,
    css: p => `${p} .torso{transform-origin:50% 100%;animation:hum .8s ease-in-out infinite alternate}${floats(p)}`,
    extras: floater(NOTE, '#6FA8E8', -6, -8) + floater(NOTE, '#EE8FB0', -12, -8, 2),
  },
  // A big yawn, sinking down, Zs drifting up.
  yawn: {
    caption: 'yawning',
    eyes: 'flat',
    css: p => `${p} .torso{transform-origin:50% 100%;animation:droop 3s ease-in-out infinite}${floats(p, 2.2)}`,
    extras: floater(SMALL_Z, '#8FA3C4', -4, -7) + floater(BIG_Z, '#8FA3C4', -11, -8, 2),
  },
  // Bouncing on the spot, just because.
  bounce: {
    caption: 'bouncing on the spot',
    eyes: 'big',
    css: p => `${p} .crab{transform-origin:50% 100%;animation:boing .6s ease-in-out infinite}`,
    extras: '',
  },
  // Clacking both claws, a spark at each.
  clack: {
    caption: 'clacking its claws',
    css: p => `${p} .arm{animation:clack .15s steps(1) infinite}${p} .arm.r{animation-delay:-.075s}${sparks(p)}`,
    extras: spark('#F2C14E', -4, 1) + spark('#F2C14E', 15, 1, 's2'),
  },
}

/** Standing still between walks, breathing slowly. */
export const RESTING: Act = {
  caption: 'standing still',
  css: p => `${p} .torso{transform-origin:50% 100%;animation:breathe 3.2s ease-in-out infinite}`,
  extras: '',
}

export const ACT_IDS = Object.keys(ACTS) as ActId[]

export const actFor = (id: ActId | 'rest'): Act => (id === 'rest' ? RESTING : (ACTS[id] ?? RESTING))
