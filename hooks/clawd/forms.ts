// The forms Clawd comes out in (a hat, sometimes a rare body colour), the
// words it says, and the look chosen for each turn.

import type { FormId, Look, Tint } from '../../types'
import { drawn, pick, shuffled } from './bag'
import { EDGE, SPARK, path, pixels, rect } from './pixels'

export type Form = {
  /** Shown in the picture's description. */
  name: string
  /** Drawn over the torso, in Clawd's local pixels; may reach up to y -6. */
  hat: string
  /** Eyes while walking; plain 1x2 eyes when left out. */
  eyes?: 'big' | 'closed'
  hasBlush?: boolean
  /** Something in the right claw, drawn right of x 15. */
  held?: string
  /** How many pixels `held` reaches past the right claw; the stage widens by it. */
  reach?: number
}

const FORMS: Record<FormId, Form> = {
  // A white sailor cap with a blue band, its bill to the right.
  sailor: {
    name: 'sailor',
    hat:
      path('#F7F7F7', 'M4 -3h7v1h-7zM3 -2h9v1h-9zM12 -1h3v1h-3z', EDGE) +
      path('#3B6FD8', 'M3 -1h9v1h-9z'),
  },
  // A straw hat with a wide brim and a red band.
  straw: {
    name: 'straw hat',
    hat: path('#E8C46A', 'M1 -1h13v1h-13zM4 -3h7v2h-7z') + path('#C0563B', 'M4 -2h7v1h-7z'),
  },
  // A small gold crown with a red gem.
  crown: {
    name: 'crown',
    eyes: 'big',
    hat:
      path('#F2C14E', 'M4 -1h7v1h-7zM4 -3h1v2h-1zM7 -3h1v2h-1zM10 -3h1v2h-1z') +
      path('#E24B4A', 'M7 -1h1v1h-1z'),
  },
  // A red Santa hat, its white bobble hanging to the right.
  santa: {
    name: 'Santa hat',
    hasBlush: true,
    hat:
      path('#E24B4A', 'M4 -2h7v1h-7zM5 -3h6v1h-6zM8 -4h4v1h-4z') +
      path('#F7F7F7', 'M3 -1h9v1h-9zM12 -4h1v2h-1z', EDGE),
  },
  // A starry purple wizard hat with a curled tip, happy closed eyes, and a
  // wand that sparkles in the right claw.
  wizard: {
    name: 'wizard',
    eyes: 'closed',
    hat:
      path('#6B5BD6', 'M1 -1h13v1h-13zM3 -3h9v1h-9zM3 -4h8v1h-8zM4 -5h5v1h-5zM3 -6h3v1h-3zM2 -5h1v1h-1z') +
      path('#3D348B', 'M2 -2h11v1h-11z') +
      path('#FFF3B0', 'M6 -5h1v1h-1zM8 -4h1v1h-1zM5 -3h1v1h-1zM10 -3h1v1h-1zM4 -1h1v1h-1zM9 -1h1v1h-1z'),
    held: `<g class="arm r"><g fill="#8B5A2B">${rect(15, 4, 3, 1)}</g><g class="twinkle" fill="#F2C14E">${pixels(SPARK, 18, 3)}</g></g>`,
    reach: 6,
  },
}

const FORM_IDS = Object.keys(FORMS) as FormId[]

/** Body colours: orange is Clawd's own, the others turn up now and then. */
export const TINTS: Record<Tint, string> = {
  orange: '#D77757',
  pink: '#EE8FB0',
  mint: '#5FC7A0',
  sky: '#6FA8E8',
}
const RARE_TINTS: Tint[] = ['pink', 'mint', 'sky']
const RARE_CHANCE = 1 / 8

/** Spinner words in the manner of Claude Code's, a few of them a crab's own. */
export const VERBS = [
  'Clauding',
  'Noodling',
  'Pondering',
  'Percolating',
  'Simmering',
  'Moseying',
  'Puttering',
  'Marinating',
  'Mulling',
  'Brewing',
  'Conjuring',
  'Tinkering',
  'Vibing',
  'Whisking',
  'Doodling',
  'Bubbling',
  'Scheming',
  'Daydreaming',
  'Shimmying',
  'Ruminating',
  'Cogitating',
  'Finagling',
  'Wrangling',
  'Stewing',
  'Hatching',
  'Scuttling',
  'Sidestepping',
  'Pinching',
  'Snipping',
  'Burrowing',
  'Tidepooling',
  'Sandcastling',
  'Shell-polishing',
  'Bubble-blowing',
  'Claw-clacking',
  'Wave-watching',
]

/** How many different words Clawd says in a turn before starting over, and
 * how long each stays in the bubble. */
export const SAY_COUNT = 12
export const SAY_SECONDS = 4.5

/** The words Clawd says this turn, the first of them its caption. */
export const wordsOf = (look: Look): string[] => (look.verbs.length > 0 ? look.verbs : ['Clauding'])

export const formOf = (look: Look): Form => FORMS[look.form] ?? FORMS.sailor
export const tintOf = (look: Look): string => TINTS[look.tint] ?? TINTS.orange

/** The look for the next turn, its form the next out of the bag. */
export function nextLook(prev: Look): Look {
  const { next: form, bag } = drawn(prev.bag, FORM_IDS, prev.form)

  return {
    form,
    verbs: shuffled(VERBS).slice(0, SAY_COUNT),
    tint: Math.random() < RARE_CHANCE ? pick(RARE_TINTS) : 'orange',
    bag,
  }
}
