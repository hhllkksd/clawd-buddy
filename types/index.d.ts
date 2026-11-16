/** What Clawd is doing right now, apart from walking or strolling. */
export type Mood = {
  /** Celebrating a finished turn, doing a little act while Claude works
   * (stopping its walk for it), or neither. */
  kind: 'idle' | 'happy' | 'act'
  /** Bumped on every change, so a stale timer never undoes a newer mood. */
  n: number
  /** When a happy or act mood ends, in ms since the epoch; 0 for idle. */
  until: number
  /** What Clawd says in its bubble for this mood, in English: a spinner
   * word during an act, a line when happy. */
  line: string
  /** The act it does this time, or did last time. */
  act: ActId
  /** Acts still to show before any repeats. */
  acts: ActId[]
}

/** The little things Clawd does now and then, working or strolling. */
export type ActId = 'wave' | 'stretch' | 'lookout' | 'dig' | 'sing' | 'yawn' | 'bounce' | 'clack'

/** Where Clawd is on its walk while Claude works, so that it stops where it
 * is for an act or to celebrate, and walks on from there. */
export type Walk = {
  /** When it last set off, or stopped, in ms since the epoch. */
  since: number
  /** How far into its walk there and back it was then, in ms. */
  phase: number
  /** How long it had been saying its words then, in ms. */
  said: number
}

/** The stroll Clawd is on between turns: its looping picture is drawn from
 * this alone, so it stays the same until this changes. */
export type Stroll = {
  /** When this stroll began, in ms since the epoch. */
  since: number
  /** What the stroll's legs, stops and words are made from. */
  seed: number
  /** Where it began, and ends each round, in Clawd's pixels. */
  x: number
}

/** The forms Clawd comes out in, one per turn. */
export type FormId = 'sailor' | 'straw' | 'crown' | 'santa' | 'wizard'

/** Clawd's body colour: orange is its own, the others are rare. */
export type Tint = 'orange' | 'pink' | 'mint' | 'sky'

/** How Clawd looks this turn, chosen when the turn starts. */
export type Look = {
  form: FormId
  /** The spinner words Clawd says in its bubble while it walks, one after
   * another; the first is its caption. */
  verbs: string[]
  tint: Tint
  /** Forms still to show before any repeats. */
  bag: FormId[]
}

declare module 'claude-code' {
  interface PluginState {
    'clawd-buddy': {
      isHidden: boolean
      isWorking: boolean
      mood: Shaped<Mood>
      walk: Walk
      look: Shaped<Look>
      stroll: Stroll
    }
  }
}
