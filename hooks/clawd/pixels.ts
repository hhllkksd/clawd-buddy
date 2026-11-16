// Clawd's pixel art is drawn from these: rectangles a pixel big, paths, and
// the small shapes that float around it.

export const rect = (x: number, y: number, w = 1, h = 1, cls = '') =>
  `<rect${cls ? ` class="${cls}"` : ''} x="${x}" y="${y}" width="${w}" height="${h}"/>`

/** Pixels from rows of '.' and 'X', top-left at (x, y). */
export const pixels = (rows: string[], x: number, y: number) =>
  rows
    .flatMap((row, dy) => [...row].map((c, dx) => (c === 'X' ? rect(x + dx, y + dy) : '')))
    .join('')

export const path = (fill: string, d: string, extra = '') => `<path fill="${fill}" d="${d}"${extra}/>`

/** A thin grey edge, so white cloth shows on a light background. */
export const EDGE = ' stroke="#9AA0A6" stroke-width="0.2"'

export const HEART = ['.X.X.', 'XXXXX', '.XXX.', '..X..']
export const SPARK = ['.X.', 'XXX', '.X.']
export const NOTE = ['.XX', '.X.', '.X.', 'XX.', 'XX.']
export const BIG_Z = ['XXXXX', '...X.', '..X..', '.X...', 'XXXXX']
export const SMALL_Z = ['XXX', '..X', 'X..', 'XXX']

/** Something small that rises beside Clawd's head and fades; `order` 1, 2 or
 * 3 is its turn to set off. */
export const floater = (shape: string[], color: string, x: number, y: number, order = 1) =>
  `<g class="float f${order}" fill="${color}">${pixels(shape, x, y)}</g>`

export const spark = (color: string, x: number, y: number, cls = '') =>
  `<g class="spark${cls ? ` ${cls}` : ''}" fill="${color}">${pixels(SPARK, x, y)}</g>`
