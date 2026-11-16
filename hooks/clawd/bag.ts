// Picking at random, and the shuffled bag Clawd's forms and poses are drawn from.

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

export function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = out[i] as T
    out[i] = out[j] as T
    out[j] = a
  }

  return out
}

/** The next one out of a shuffled bag of `all`, and the bag without it: each
 * shows once before any shows again, and never `last` twice running. */
export function drawn<T extends string>(left: readonly T[], all: readonly T[], last: T): { next: T; bag: T[] } {
  let bag = left.filter(id => all.includes(id))
  if (bag.length === 0) {
    bag = shuffled(all)
    if (bag[0] === last && bag.length > 1) {
      bag.push(bag.shift() as T)
    }
  }
  const [next = last, ...rest] = bag

  return { next, bag: rest }
}
