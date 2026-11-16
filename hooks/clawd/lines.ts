// What Clawd says, always in English. While Claude works it says the spinner
// words (VERBS, in ./forms); between turns, strolling its beach, it says
// words of its own in the same spirit; a finished turn has lines of its own.

/** What Clawd says when a turn is done. */
export const HAPPY_LINES = ['All done!', 'Ta-da!', 'Nailed it!', 'Done and dusted!', 'Mission complete!', 'Another one done!']

/** What Clawd says strolling its beach between turns: lazy beach-day words,
 * none of them a spinner word. */
export const IDLE_WORDS = [
  'Sunbathing',
  'Basking',
  'Lounging',
  'Napping',
  'Dozing',
  'Snoozing',
  'Paddling',
  'Splashing',
  'Wiggling',
  'Twirling',
  'Skipping',
  'Humming',
  'Moonwalking',
  'Beachcombing',
  'Cloud-gazing',
  'Gull-spotting',
  'Shell-hunting',
  'Pebble-counting',
  'Puddle-jumping',
  'Bubble-popping',
  'Kelp-munching',
  'Toe-wiggling',
  'Sand-doodling',
  'Tide-chasing',
  'Foam-flicking',
  'Sun-soaking',
  'Snack-dreaming',
  'Seaweed-dancing',
]

/** Beside Clawd in the terminal while it strolls between turns. */
export const REST_LINE = 'Strolling~'

/** Every line Clawd may say once without dots: the stage is wide enough for the longest. */
export const ALL_LINES = [...HAPPY_LINES]
