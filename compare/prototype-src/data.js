// All mock content for the v3 prototype.

export const YOUR_FLOWER = { petals: 8, fill: '#fff' }
export const FERN_FLOWER = { petals: 9, fill: '#fff' }

// `sample` is the simulated transcript shown when the tester "records" an answer.
export const REFLECT = [
  {
    q: 'when did you last feel completely at ease with someone?',
    sample: 'last sunday, with my brother. we fixed his bike and barely spoke. it was perfect.',
  },
  {
    q: 'think of the last time you left somewhere early. what made you leave?',
    sample: 'a rooftop birthday. the music got louder and there was one staircase. i slipped out before the cake.',
  },
  {
    q: 'what do people usually get wrong about you at first?',
    sample: "that i'm cold. i'm just slow to warm up. ask me again in an hour.",
  },
]

export const TENDENCIES = [
  { text: 'you open up when your hands are busy', colour: 'lilac', r: -4 },
  { text: 'loud rooms with no easy exit drain you', colour: 'pink', r: 3 },
  { text: 'people mistake your quiet for distance', colour: 'butter', r: -2 },
]

export const QOTD = {
  q: 'what did you notice today that nobody else did?',
  sample: 'the man at the bus stop was humming the same song as me.',
}

// Anonymous answers in mutual matching. The first one the tester says yes to becomes Plum.
// `reflect` is the question answered; `pairs` is the tester's tendency it resonates with.
export const ANON = [
  {
    id: 'a',
    flower: { petals: 6, fill: '#f4a6b8' },
    reflect: 0,
    transcript: "with the lady at the bakery. she remembered my order. she didn't say a word, just smiled.",
    tendency: 'plum is easy with people who let silence be',
    pairs: 2,
  },
  {
    id: 'b',
    flower: { petals: 5, fill: '#f4d35e' },
    reflect: 1,
    transcript: "a birthday dinner. twelve people, one long table, nowhere to look. i said i had a train. i didn't.",
    tendency: 'plum leaves when a room gets too loud',
    pairs: 1,
  },
  {
    id: 'c',
    flower: { petals: 10, fill: '#d9b8f2' },
    reflect: 2,
    transcript: "they think i'm bored. i'm not. i'm listening so hard i forget to move my face.",
    tendency: "plum's quiet gets read as distance too",
    pairs: 2,
  },
  {
    id: 'd',
    flower: { petals: 7, fill: '#a8e3b5' },
    reflect: 0,
    transcript: "at my sister's. she was cooking, i was shelling peas. we didn't talk for an hour. best conversation in weeks.",
    tendency: 'plum thinks best with busy hands',
    pairs: 0,
  },
]

// The 12 prelude questions: Plum's answer, and the tester's simulated transcript.
export const QUESTIONS = [
  {
    q: 'what does a good quiet morning look like for you?',
    a: 'radio low, window open, nobody needing anything from me until ten. toast i actually sit down for.',
    photo: 'window',
    sample: 'window open, coffee going cold because i forgot it. nobody talking yet.',
  },
  {
    q: "what's a sound you love that most people don't notice?",
    a: "the click of the heating coming on. it means someone decided it's cold enough to be kind.",
    sample: 'rain on the skylight. and the fridge when it finally stops humming.',
  },
  {
    q: 'what is a place you keep going back to?',
    a: 'the second-hand bookshop on the corner. i rarely buy anything. the owner lets me read the first pages standing up.',
    photo: 'room',
    sample: 'the bench behind the library. it faces a wall. i like the wall.',
  },
  {
    q: "what do you do with your hands when you're thinking?",
    a: 'i peel the label off whatever i am holding. bottles, jars, once a library book. i felt terrible.',
    sample: 'i fold receipts into tiny squares. my pockets are full of them.',
  },
  {
    q: 'when did you last lose track of time?',
    a: "repotting a plant that didn't need it. i looked up and it was dark and i had soil on my elbows.",
    photo: 'plant',
    sample: 'sanding an old chair on the balcony. three hours, gone.',
  },
  {
    q: "what's something you're slowly getting better at?",
    a: "leaving a party without apologising. i'm at about sixty percent.",
    sample: "saying 'i need a minute' instead of disappearing.",
  },
  {
    q: 'who makes you feel easy to be around, and why?',
    a: "my sister. she talks to me from another room and doesn't mind if i answer late.",
    sample: 'my neighbour. we water the plants together and talk about nothing.',
  },
  {
    q: 'what do you wish people asked you about?',
    a: "the maps i draw of places i've only been to once. nobody knows i do that. well. you do now.",
    photo: 'room',
    sample: "what i'm reading. nobody asks, and i always have an answer.",
  },
  {
    q: 'what do you need after a long day with people?',
    a: 'forty minutes of nothing. then soup. in that order.',
    sample: 'shoes off, lights low, one song on repeat.',
  },
  {
    q: "what's a small ritual you'd never give up?",
    a: 'walking the long way home on fridays, past the canal. i count the boats with lights on.',
    photo: 'window',
    sample: 'sunday soup. same pot, different vegetables.',
  },
  {
    q: 'what would a good first hour together look like?',
    a: "walking somewhere, not sitting opposite each other. something to look at so we don't have to look at each other the whole time.",
    sample: 'a walk with something to look at. maybe a market. no table between us.',
  },
  {
    q: "what's something you'd like to show someone, not tell them?",
    a: 'the view from the footbridge at eleven in the morning. i could describe it, but i would rather stand there.',
    photo: 'window',
    sample: 'the light in my hallway at four in the afternoon.',
  },
]

// Afterglow moments, keyed by the question they follow.
export const AFTERGLOW = {
  4: { key: 'world', ask: 'share world photos?', detail: 'things, places, views. not faces yet.', mutual: 'world photos are open.' },
  8: { key: 'faces', ask: 'share faces?', detail: "you'd both see each other at the same moment.", mutual: '' },
  12: { key: 'meet', ask: 'ready to meet?', detail: 'somewhere easy, something to do side by side.', mutual: 'you both said yes.' },
}

// Side by Side suggestions. `fits` lists the tendencies (index in TENDENCIES) each one suits.
export const ACTIVITIES = [
  { title: 'a slow walk along the river', when: 'saturday, 11:00', why: 'open air, something to look at, easy to leave anytime.', fits: [1, 2] },
  { title: 'the sunday flower market', when: 'sunday, 10:00', why: 'plenty to look at. no need to fill the silences.', fits: [2, 1] },
  { title: 'the community garden open day', when: 'sunday, 14:00', why: 'hands busy. they always need help watering.', fits: [0] },
  { title: 'feeding the ducks at the park pond', when: 'saturday, 15:00', why: 'hands busy, benches nearby, wide open.', fits: [0, 1] },
]
