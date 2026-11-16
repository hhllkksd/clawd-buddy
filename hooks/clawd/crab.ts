// Clawd itself: its eyes, and its body in the form and colour of the turn.

import { TINTS } from './forms'
import type { Form } from './forms'
import { pixels, rect } from './pixels'

export type EyeKind = 'plain' | 'big' | 'closed' | 'squint' | 'flat' | 'wink'

function eyes(kind: EyeKind): string {
  if (kind === 'closed') {
    // ^ ^ : closed, smiling eyes
    return `<g fill="#000">${pixels(['.X.', 'X.X'], 3, 2)}${pixels(['.X.', 'X.X'], 9, 2)}</g>`
  }
  if (kind === 'squint') {
    // > < : squeezed shut, laughing
    return `<g fill="#000">${pixels(['X.', '.X', 'X.'], 4, 1)}${pixels(['.X', 'X.', '.X'], 9, 1)}</g>`
  }
  if (kind === 'flat') {
    // - - : asleep
    return `<g fill="#000">${rect(3, 3, 3, 1)}${rect(9, 3, 3, 1)}</g>`
  }
  if (kind === 'wink') {
    // ^ ' : one eye shut
    return `<g fill="#000">${pixels(['.X.', 'X.X'], 3, 2)}${rect(10, 2, 1, 2)}</g>`
  }
  if (kind === 'big') {
    return `<g class="eyes"><g fill="#000">${rect(4, 2, 2, 2)}${rect(9, 2, 2, 2)}</g><g fill="#fff">${rect(4, 2, 0.7, 0.7)}${rect(9, 2, 0.7, 0.7)}</g></g>`
  }

  return `<g class="eyes" fill="#000">${rect(4, 2, 1, 2)}${rect(10, 2, 1, 2)}</g>`
}

/** Clawd in local pixels: x 0..15, y 0..9 (feet at 9); hats reach y -6 and a
 * held thing reaches right of 15. */
export function crab(form: Form, body: string, face: { eyes?: EyeKind; hasBlush?: boolean } = {}): string {
  const blush = body === TINTS.pink ? '#D9608A' : '#F59A9A'

  return `
  <g class="crab">
    <g fill="${body}">${rect(3, 7, 1, 2, 'leg a')}${rect(5, 7, 1, 2, 'leg b')}${rect(9, 7, 1, 2, 'leg a')}${rect(11, 7, 1, 2, 'leg b')}</g>
    <g class="torso">
      <g fill="${body}">${rect(2, 0, 11, 7)}${rect(0, 3, 2, 2, 'arm l')}${rect(13, 3, 2, 2, 'arm r')}</g>
      ${eyes(face.eyes ?? form.eyes ?? 'plain')}
      ${face.hasBlush || form.hasBlush ? `<g class="blush" fill="${blush}">${rect(2, 4, 2, 1)}${rect(11, 4, 2, 1)}</g>` : ''}
      ${form.hat}
      ${form.held ?? ''}
    </g>
  </g>`
}
