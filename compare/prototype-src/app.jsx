import { useEffect, useMemo, useState } from 'react'
import { COLOURS, flowerSVG, bubbleSVG, MOON, voiceSVG, photoSVG, faceSVG, PATH } from './art.js'
import { YOUR_FLOWER, FERN_FLOWER, REFLECT, TENDENCIES, QOTD, ANON, QUESTIONS, AFTERGLOW, ACTIVITIES } from './data.js'

const STORAGE_KEY = 'prelude-prototype-v3'
const TOTAL = QUESTIONS.length
const MATCH_DELAY = 6000
const REPLY_DELAY = 2600
const MUTUAL_DELAY = 2400

const FRESH_CONVO = { q: 1, phase: 'read', glow: {}, mine: null }
const FRESH_AFTER = { step: 'self', self: null, again: null }

const INITIAL = {
  screen: 'welcome',
  mode: 'voice', // last choice on the answer screen
  reflect: 0,
  answers: [null, null, null],
  mirror: TENDENCIES.map(() => ({ status: null, text: '' })),
  picks: {},
  matchArrived: false,
  qotdDone: false,
  plumCard: null, // the anonymous answer that turned out to be plum
  status: 'none', // plum's prelude: none | active | plan | met | ended
  convo: FRESH_CONVO,
  area: '',
  plan: { step: 'where', activity: 0 },
  after: FRESH_AFTER,
  // the other person's simulated answers, set in the tester panel
  tester: { open: false, match: 'yes', world: 'yes', faces: 'yes', meet: 'yes', again: 'yes' },
}

const withPlum = (s) => ({ plumCard: s.plumCard || 'a' })
const convoAt = (q, phase, glow = {}) => (s) => ({
  ...withPlum(s),
  screen: 'conversation',
  status: 'active',
  convo: { ...FRESH_CONVO, q, phase, glow },
})

// Tester shortcuts. Each returns a patch applied on top of the current state.
const JUMPS = [
  ['Onboarding', [
    ['welcome', 'Welcome', () => ({ screen: 'welcome' })],
    ['reflect', 'Reflection 1 of 3', () => ({ screen: 'reflect', reflect: 0 })],
    ['reflect3', 'Reflection 3 of 3', () => ({ screen: 'reflect', reflect: 2 })],
    ['mirror', 'Your flower', () => ({ screen: 'mirror' })],
  ]],
  ['Matching', [
    ['matching', 'Mutual matching', () => ({ screen: 'matching', picks: {}, matchArrived: false })],
    ['waiting', 'Waiting', (s) => ({ screen: 'waiting', matchArrived: false, picks: Object.keys(s.picks).length ? s.picks : { a: 'yes' } })],
    ['qotd', 'Question of the day', () => ({ screen: 'qotd' })],
    ['banner', '"Someone is here" banner', (s) => ({ ...withPlum(s), screen: 'waiting', matchArrived: true })],
    ['match', 'Match arrives', (s) => ({ ...withPlum(s), screen: 'match', matchArrived: true })],
  ]],
  ['Home', [
    ['home', 'Home', (s) => ({ ...withPlum(s), screen: 'home', status: s.status === 'none' || s.status === 'ended' ? 'active' : s.status })],
  ]],
  ['The prelude', [
    ['q1', 'Question 1', convoAt(1, 'read')],
    ['answer', 'Answer screen', (s) => ({ ...convoAt(s.convo.q, 'answer', s.convo.glow)(s) })],
    ['reveal', 'Both answers revealed', convoAt(5, 'ready', { world: 'yes' })],
    // comparison copy: both answers revealed, each with a world photo
    ['world', 'Both answers with world photos', (s) => ({
      ...convoAt(5, 'ready', { world: 'yes' })(s),
      convo: { ...FRESH_CONVO, q: 5, phase: 'ready', glow: { world: 'yes' }, mine: { kind: 'voice', text: QUESTIONS[4].sample, photo: 'window' } },
    })],
    ['glow4', 'Afterglow: world photos', convoAt(4, 'glow')],
    ['glow8', 'Afterglow: faces', convoAt(8, 'glow', { world: 'yes' })],
    ['faces', 'Faces reveal', convoAt(8, 'facesReveal', { world: 'yes', faces: 'yes' })],
    ['glow12', 'Afterglow: ready to meet', convoAt(12, 'glow', { world: 'yes', faces: 'yes' })],
    ['ending', 'Ending', (s) => ({ ...withPlum(s), screen: 'ending' })],
  ]],
  ['Meeting', [
    ['where', 'Side by Side: where', (s) => ({ ...withPlum(s), screen: 'plan', status: 'plan', plan: { ...s.plan, step: 'where' } })],
    ['suggest', 'Side by Side: suggestion', (s) => ({ ...withPlum(s), screen: 'plan', status: 'plan', area: s.area || 'riverside', plan: { ...s.plan, step: 'suggest' } })],
    ['powerdown', 'Power down', (s) => ({ ...withPlum(s), screen: 'powerdown', status: 'met' })],
    ['after', 'After the meeting', (s) => ({ ...withPlum(s), screen: 'after', status: 'met', after: FRESH_AFTER })],
  ]],
]
const ALL_JUMPS = JUMPS.flatMap(([, items]) => items)

// Comparison copy only (not in the original prototype). URL parameters for embedding a screen as a clip:
//   ?screen=<jump id>  open straight on that screen (ids are the first item of each JUMPS entry,
//                      e.g. mirror = "your flower", world = a prelude with world photos);
//                      saved progress is neither read nor written
//   &loop=<ms>         remount the screen every <ms>, so its entry animation replays like a video
//   &photos=real       world photos come from photos/<kind>.jpg next to the built file
const PARAMS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
const EMBED = ALL_JUMPS.find((j) => j[0] === PARAMS.get('screen'))
const LOOP_MS = EMBED ? Number(PARAMS.get('loop')) || 0 : 0
const REAL_PHOTOS = PARAMS.get('photos') === 'real'
// &name=<name> shows the other person under a different name on the prelude screens
const THEM = (PARAMS.get('name') || 'plum').toLowerCase()
// &bg=mint gives the embedded screen a mint background instead of its own
const SCREEN_BG = ['mint'].includes(PARAMS.get('bg')) ? PARAMS.get('bg') : ''
const THEM_LABEL = THEM.charAt(0).toUpperCase() + THEM.slice(1) // card label: capital first letter
const WIDE_VOICE = 280 // voice note width in SVG units when it fills a card
const PHOTO_FILES = { plant: 'plants' } // photo kind -> file name in photos/, where they differ

function load() {
  if (EMBED) return { ...INITIAL, ...EMBED[2](INITIAL) }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && saved.screen) return { ...INITIAL, ...saved, tester: { ...INITIAL.tester, ...saved.tester } }
  } catch {
    // storage unavailable or corrupt: start fresh
  }
  return INITIAL
}

const plumOf = (s) => ANON.find((c) => c.id === s.plumCard) || ANON[0]

// A tendency as the tester left it: confirmed, rewritten, or (if skipped) the original guess.
const tendencyText = (s, i) => (s.mirror[i].status === 'edit' && s.mirror[i].text.trim()) || TENDENCIES[i].text

export default function App() {
  const [s, setS] = useState(load)
  const set = (patch) => setS((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }))
  const scale = useFrameScale()

  // embedded clip: start the screen over every LOOP_MS
  const [epoch, setEpoch] = useState(0)
  useEffect(() => {
    if (EMBED) document.documentElement.classList.add('embed')
    if (EMBED && SCREEN_BG) document.documentElement.classList.add(`bg-${SCREEN_BG}`)
    if (!LOOP_MS) return
    const t = setInterval(() => {
      setS(load())
      setEpoch((e) => e + 1)
    }, LOOP_MS)
    return () => clearInterval(t)
  }, [])

  // halfway through each loop, glide down to whatever is below the fold
  useEffect(() => {
    if (!LOOP_MS) return
    const t = setTimeout(() => {
      const el = document.querySelector('.screen')
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, LOOP_MS * 0.45)
    return () => clearTimeout(t)
  }, [epoch])

  useEffect(() => {
    if (EMBED) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      // ignore: prototype still works in memory
    }
  }, [s])

  // Simulated mutual match: needs a yes from the tester and a yes from the other side.
  const waiting = s.screen === 'waiting' || s.screen === 'qotd'
  const firstYes = ANON.find((c) => s.picks[c.id] === 'yes')
  const willMatch = waiting && !s.matchArrived && firstYes && s.tester.match === 'yes'
  useEffect(() => {
    if (!willMatch) return
    const t = setTimeout(() => set({ matchArrived: true, plumCard: firstYes.id }), MATCH_DELAY)
    return () => clearTimeout(t)
  }, [willMatch])

  const restart = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setS({ ...INITIAL, tester: { ...INITIAL.tester, open: s.tester.open } })
  }
  const setTester = (patch) => set((p) => ({ tester: { ...p.tester, ...patch } }))

  const Screen = SCREENS[s.screen] || Welcome
  const tone = { conversation: 'lilac', plan: 'lilac', after: 'lilac', powerdown: 'night', ending: 'grey' }[s.screen] || ''
  const key = [s.screen, s.reflect, s.convo.q, s.convo.phase, s.plan.step, s.after.step, epoch].join('|')
  const forced = typeof location !== 'undefined' && location.hash === '#tester'

  return (
    <div className="page">
      <div className="slot" style={{ width: 390 * scale, height: 844 * scale }}>
        <div className={`phone ${tone}`} style={{ transform: `scale(${scale})` }}>
          {waiting && s.matchArrived && (
            <button className="banner pop" onClick={() => set({ screen: 'match' })}>
              <span>someone is here.</span>
              <span>→</span>
            </button>
          )}
          <div className={`screen s-${s.screen}`} key={key}>
            <Screen s={s} set={set} />
          </div>
        </div>
      </div>

      <aside className={`tester${forced ? ' forced' : ''}`}>
        <button className="tester-toggle" onClick={() => setTester({ open: !s.tester.open })}>
          tester {s.tester.open ? '×' : '▾'}
        </button>
        {s.tester.open && (
          <div className="tester-body">
            <button onClick={restart}>Restart</button>
            <select
              aria-label="Jump to screen"
              value=""
              onChange={(e) => {
                const j = ALL_JUMPS.find((x) => x[0] === e.target.value)
                if (j) set((p) => j[2](p))
              }}
            >
              <option value="" disabled>
                Jump to screen…
              </option>
              {JUMPS.map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {s.screen === 'conversation' && <button onClick={() => set(skipQuestion)}>Skip this question</button>}
            <b>Plum's answers</b>
            {[
              ['match', 'Matching', ['yes', 'no']],
              ['world', 'Afterglow: world photos', ['yes', 'not yet']],
              ['faces', 'Afterglow: faces', ['yes', 'not yet']],
              ['meet', 'Afterglow: ready to meet', ['yes', 'not yet']],
              ['again', 'Meet again', ['yes', 'not yet']],
            ].map(([k, label, options]) => (
              <label key={k}>
                {label}
                <select value={s.tester[k]} onChange={(e) => setTester({ [k]: e.target.value })}>
                  {options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}

// Shrinks the 390×844 frame to fit short desktop windows.
function useFrameScale() {
  const calc = () => (window.innerWidth < 500 ? 1 : Math.min(1, (window.innerHeight - 52) / 850))
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const onResize = () => setScale(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}

// Starts at `from` and settles to `to` just after mount, so CSS can animate the change.
function useSettle(from, to, delay = 250) {
  const [v, setV] = useState(from)
  useEffect(() => {
    const t = setTimeout(() => setV(to), delay)
    return () => clearTimeout(t)
  }, [to])
  return v
}

/* ---------- stickers ---------- */

function Sticker({ html, className = '', style, ...rest }) {
  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} {...rest} />
}

function Flower({ spec = YOUR_FLOWER, fold = 0, eyes = 0, look = 0, size, className = '', style }) {
  const html = useMemo(() => flowerSVG(spec), [spec])
  return (
    <Sticker
      html={html}
      className={`flower ${className}`}
      style={{ width: size, '--fold': fold, '--eyes': eyes, '--look': look, ...style }}
      aria-hidden="true"
    />
  )
}

function Bubble({ text = '', flip, className = '', style }) {
  return <Sticker html={bubbleSVG(text)} className={`bubble ${flip ? 'flip ' : ''}${className}`} style={style} aria-hidden="true" />
}

function Photo({ kind, className = '', style }) {
  const html = useMemo(() => photoSVG(kind), [kind])
  const [missing, setMissing] = useState(false)
  // comparison copy: a real photo in the same sticker frame; falls back to the illustration if the file is absent
  if (REAL_PHOTOS && !missing) {
    return (
      <div className={`photo fixed real ${className}`} style={style} aria-hidden="true">
        <img src={`photos/${PHOTO_FILES[kind] || kind}.jpg`} alt="" onError={() => setMissing(true)} />
      </div>
    )
  }
  return <Sticker html={html} className={`photo fixed ${className}`} style={style} aria-hidden="true" />
}

function Face({ who, className = '', style }) {
  const html = useMemo(
    () => faceSVG(who === 'plum' ? { bg: COLOURS.butter, hair: COLOURS.pink, style: 'bob', top: COLOURS.mint } : { bg: COLOURS.mint, hair: '#05060f', style: 'short', top: COLOURS.butter }),
    [who],
  )
  return <Sticker html={html} className={className} style={style} aria-hidden="true" />
}

// The landing page voice note. Tap to "listen": the bars move.
function Voice({ fill, playing, onToggle, style, label = 'listen', wide }) {
  const [own, setOwn] = useState(false)
  // comparison copy: `wide` stretches the note across its card, with more bars
  const html = useMemo(() => voiceSVG(fill, wide ? WIDE_VOICE : undefined), [fill, wide])
  const on = playing ?? own
  return (
    <button
      className={`voice${wide ? ' wide' : ''}${on ? ' playing' : ''}`}
      style={style}
      aria-label={on ? 'pause' : label}
      onClick={() => (onToggle ? onToggle() : setOwn((v) => !v))}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function Progress({ value }) {
  return (
    <div className="progress">
      <i style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}

const fmt = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

/* ---------- the answer screen, used everywhere ---------- */

function Answer({ s, set, label, question, sample, sendLabel = 'send', onSend }) {
  const mode = s.mode
  const [rec, setRec] = useState('idle') // idle | recording | done
  const [secs, setSecs] = useState(0)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState(false)
  const [text, setText] = useState('')
  const [picking, setPicking] = useState(false)
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    if (rec !== 'recording') return
    const t = setInterval(() => setSecs((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [rec])

  const canSend = mode === 'voice' ? rec === 'done' : text.trim().length > 0
  const send = () => onSend({ kind: mode, text: mode === 'voice' ? sample : text.trim(), photo })

  return (
    <>
      {label && <p className="small rise">{label}</p>}
      <h1 className="question rise" style={{ margin: '8px 0 18px', '--d': '60ms' }}>{question}</h1>

      <div className="row rise" style={{ '--d': '120ms', marginBottom: 18 }}>
        {['voice', 'writing'].map((m) => (
          <button key={m} className={`pill pill-small ${mode === m ? 'pill-black' : 'pill-white'}`} aria-pressed={mode === m} onClick={() => set({ mode: m })}>
            {m}
          </button>
        ))}
      </div>

      {mode === 'voice' ? (
        <div className="recorder">
          {rec === 'idle' && (
            <>
              <button className="rec pop" aria-label="record" onClick={() => { setSecs(0); setRec('recording') }}><i /></button>
              <p className="small">tap to record. take your time.</p>
            </>
          )}
          {rec === 'recording' && (
            <>
              <Voice fill="#fff" playing onToggle={() => {}} style={{ '--w': '230px', '--r': '-3deg', pointerEvents: 'none' }} />
              <p className="timer">{fmt(secs)}</p>
              <button className="rec on" aria-label="stop" onClick={() => setRec('done')}><i /></button>
            </>
          )}
          {rec === 'done' && (
            <>
              <div className="pop">
                <Voice fill={COLOURS.pink} playing={listening} onToggle={() => setListening((l) => !l)} style={{ '--w': '220px', '--r': '-2deg' }} />
              </div>
              <div className="row wrap" style={{ justifyContent: 'center', marginTop: 6 }}>
                <button className="pill pill-small pill-white" onClick={() => setTranscript((t) => !t)}>
                  {transcript ? 'hide transcript' : 'see transcript'}
                </button>
                <button className="pill pill-small pill-white" onClick={() => { setRec('idle'); setListening(false); setTranscript(false) }}>
                  record again
                </button>
              </div>
              <button className="link" onClick={() => setListening((l) => !l)}>{listening ? 'stop listening' : `listen · ${fmt(secs)}`}</button>
              {transcript && <div className="note pop body" style={{ '--r': '1deg', alignSelf: 'stretch' }}>{sample}</div>}
            </>
          )}
        </div>
      ) : (
        <textarea
          className="field rise"
          rows={5}
          placeholder="write as much or as little as you like."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      <div className="world">
        {!picking && !photo && (
          <button className="pill pill-small pill-white" onClick={() => setPicking(true)}>+ add a piece of your world</button>
        )}
        {(picking || photo) && (
          <>
            <div className="row between">
              <p className="small">a piece of your world. things, places, views. not faces yet.</p>
              <button className="link" onClick={() => { setPhoto(null); setPicking(false) }}>{photo ? 'remove' : 'close'}</button>
            </div>
            <div className="picker">
              {['window', 'plant', 'room'].map((kind, i) => (
                <button
                  key={kind}
                  className={`photo pop${photo === kind ? ' on' : ''}`}
                  style={{ '--r': `${[-5, 4, -3][i]}deg`, '--d': `${i * 70}ms` }}
                  aria-label={`photo: ${kind}`}
                  aria-pressed={photo === kind}
                  onClick={() => setPhoto(photo === kind ? null : kind)}
                  dangerouslySetInnerHTML={{ __html: photoSVG(kind) }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="actions">
        <button className="pill pill-black pill-block" disabled={!canSend} onClick={send}>{sendLabel}</button>
      </div>
    </>
  )
}

// An answer the tester gave, shown as a white note.
function Mine({ answer, fallback, r = 1 }) {
  const a = answer || { kind: 'voice', text: fallback }
  return (
    <div className="tag card white pop" style={{ '--r': `${r}deg` }}>
      <div className="who">
        <Flower size={44} />
        <span className="small">You</span>
      </div>
      {a.kind === 'voice' && <Voice fill="#e6e9f0" wide style={{ marginTop: 8, marginBottom: 8 }} />}
      <p className="body" style={{ marginTop: 6 }}>{a.text}</p>
      {a.photo && <Photo kind={a.photo} style={{ '--w': '96px', '--r': '-4deg', marginTop: 8 }} />}
    </div>
  )
}

/* ---------- 1. welcome ---------- */

function Welcome({ set }) {
  const tag = (x, y, r, d) => ({ '--x': x, '--y': y, '--r': r, '--d': d, '--tag': '13px' })
  return (
    <>
      <span className="wordmark rise">PRELUDE</span>
      <h1 className="display xl rise" style={{ marginTop: 16, '--d': '80ms' }}>NO SMALL<br />TALK.<br />NO SHOW.</h1>
      <div className="stage hero-stage" aria-hidden="true">
        <Flower className="st bloom" style={{ '--x': '21%', '--y': '4%', '--w': '58%' }} />
        <span className="st tag lilac pop" style={tag('3%', '6%', '-5deg', '700ms')}>no profiles</span>
        <span className="st tag pink pop" style={tag('58%', '0%', '6deg', '820ms')}>in your own time</span>
        <span className="st tag butter pop" style={tag('52%', '68%', '4deg', '940ms')}>only a mutual yes</span>
        <span className="st tag mint pop" style={tag('6%', '84%', '-5deg', '1060ms')}>side by side</span>
        <Bubble className="st pop" style={{ '--x': '4%', '--y': '48%', '--w': '17%', '--d': '1200ms' }} />
        <Sticker html={MOON} className="st pop" style={{ '--x': '85%', '--y': '86%', '--w': '13%', '--d': '1300ms' }} />
      </div>
      <p className="body rise" style={{ '--d': '200ms' }}>say it how it is. your answers only reach people who think like you.</p>
      <div className="actions">
        <button className="pill pill-black pill-block" onClick={() => set({ screen: 'reflect', reflect: 0 })}>start quietly</button>
      </div>
    </>
  )
}

/* ---------- 2. reflective questions ---------- */

const foldAfter = (answered) => Math.max(0, 1 - answered * 0.3)

function Reflect({ s, set }) {
  const i = s.reflect
  const last = i === REFLECT.length - 1
  // the bud opens a little with each answer already given
  const fold = useSettle(foldAfter(Math.max(0, i - 1)), foldAfter(i))
  return (
    <>
      <div className="row between" style={{ marginBottom: 14 }}>
        <Flower fold={fold} size={84} />
        <span className="small">reflection {i + 1} of {REFLECT.length}</span>
      </div>
      <Answer
        s={s}
        set={set}
        label="just for you · no one is waiting"
        question={REFLECT[i].q}
        sample={REFLECT[i].sample}
        sendLabel={last ? 'send' : 'send & next question'}
        onSend={(a) =>
          set((p) => ({
            answers: p.answers.map((x, n) => (n === i ? a : x)),
            ...(last ? { screen: 'mirror' } : { reflect: i + 1 }),
          }))
        }
      />
    </>
  )
}

/* ---------- 4. your flower ---------- */

function Mirror({ s, set }) {
  const update = (i, patch) => set((p) => ({ mirror: p.mirror.map((m, n) => (n === i ? { ...m, ...patch } : m)) }))
  const fold = useSettle(foldAfter(2), 0)
  const done = s.mirror.every((m) => m.status)

  return (
    <>
      <h1 className="display m rise">HERE'S YOUR FLOWER.</h1>
      <Flower className="mirror-flower" fold={fold} />
      <div className="stack">
        {TENDENCIES.map((t, i) => {
          const m = s.mirror[i]
          return (
            <div className="tend pop" key={i} style={{ '--d': `${500 + i * 140}ms` }}>
              <span className={`tag ${t.colour}`} style={{ '--r': `${t.r}deg`, '--tag': '14px' }}>{t.text}</span>
              <div className="row">
                <button className={`pill pill-small ${m.status === 'yes' ? 'pill-black' : 'pill-white'}`} aria-pressed={m.status === 'yes'} onClick={() => update(i, { status: 'yes' })}>yes</button>
                <button className={`pill pill-small ${m.status === 'edit' ? 'pill-black' : 'pill-white'}`} aria-pressed={m.status === 'edit'} onClick={() => update(i, { status: 'edit' })}>not quite</button>
              </div>
              {m.status === 'edit' && (
                <input className="field" type="text" placeholder="what's closer to the truth?" value={m.text} onChange={(e) => update(i, { text: e.target.value })} />
              )}
            </div>
          )
        })}
      </div>
      <p className="small center" style={{ marginTop: 18 }}>these are guesses. you can change them anytime.</p>
      <div className="actions">
        <button className="pill pill-black pill-block" disabled={!done} onClick={() => set({ screen: 'matching', picks: {}, matchArrived: false })}>find your people</button>
      </div>
    </>
  )
}

/* ---------- 5. mutual matching ---------- */

function Matching({ s, set }) {
  const pick = (id, v) => set((p) => ({ picks: { ...p.picks, [id]: v } }))
  const allDone = ANON.every((c) => s.picks[c.id])

  return (
    <>
      <h1 className="display m rise">SOMEONE MIGHT FEEL FAMILIAR.</h1>
      <p className="body rise" style={{ margin: '10px 0 20px', '--d': '80ms' }}>no names, no photos. just how they answer.</p>

      <div className="stack">
        {ANON.map((c, i) => (
          <div className="note rise" key={c.id} style={{ '--d': `${140 + i * 80}ms`, '--r': `${[-1, 0.8, -0.6, 1][i]}deg` }}>
            {s.picks[c.id] ? (
              <div className="row between">
                <div className="who">
                  <Flower spec={c.flower} size={40} fold={0.5} />
                  <span className="small">noted. only you know.</span>
                </div>
                <button className="link" onClick={() => pick(c.id, undefined)}>undo</button>
              </div>
            ) : (
              <>
                <div className="who">
                  <Flower spec={c.flower} size={52} />
                  <span className="small">{REFLECT[c.reflect].q}</span>
                </div>
                <Voice fill={c.flower.fill} style={{ '--w': '190px', margin: '8px 0' }} />
                <p className="body">{c.transcript}</p>
                <div className="row stretch" style={{ marginTop: 14 }}>
                  <button className="pill pill-small pill-black" onClick={() => pick(c.id, 'yes')}>i'd like to hear more</button>
                  <button className="pill pill-small pill-white" onClick={() => pick(c.id, 'no')}>not this one</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="actions">
        <button className="pill pill-black pill-block" disabled={!allDone} onClick={() => set({ screen: 'waiting' })}>done</button>
      </div>
    </>
  )
}

/* ---------- 6. waiting ---------- */

function Waiting({ s, set }) {
  const saidYes = ANON.some((c) => s.picks[c.id] === 'yes')
  return (
    <>
      <div className="middle">
        <div className="row" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
          <Flower size={150} className="pop" />
          <Sticker html={MOON} className="pop" style={{ width: 54, '--d': '300ms' }} aria-hidden="true" />
        </div>
        <h1 className="display rise">NO RUSH.</h1>
        <p className="body rise" style={{ marginTop: 12, '--d': '100ms' }}>
          {saidYes ? "we'll let you know when it's mutual." : 'nothing mutual yet. new answers arrive tomorrow.'}
        </p>
        <p className="small rise" style={{ marginTop: 8, '--d': '160ms' }}>a no is never shown to anyone. theirs or yours.</p>
        {!saidYes && (
          <button className="pill pill-small pill-white rise" style={{ marginTop: 16 }} onClick={() => set({ screen: 'matching', picks: {} })}>hear more answers</button>
        )}
      </div>

      <div className="note rise" style={{ '--d': '260ms', '--r': '-1deg' }}>
        <p className="small">while you wait · optional</p>
        {s.qotdDone ? (
          <p className="body" style={{ marginTop: 6 }}>kept. just for you.</p>
        ) : (
          <>
            <p className="body" style={{ margin: '6px 0 12px' }}>{QOTD.q}</p>
            <button className="pill pill-small pill-black" onClick={() => set({ screen: 'qotd' })}>answer it</button>
          </>
        )}
      </div>
    </>
  )
}

function Qotd({ s, set }) {
  return (
    <>
      <div className="row between" style={{ marginBottom: 14 }}>
        <button className="link" onClick={() => set({ screen: 'waiting' })}>← back</button>
        <span className="small">question of the day</span>
      </div>
      <Answer
        s={s}
        set={set}
        label="just for you · no one is waiting"
        question={QOTD.q}
        sample={QOTD.sample}
        sendLabel="keep it"
        onSend={() => set({ screen: 'waiting', qotdDone: true })}
      />
    </>
  )
}

/* ---------- 7. match arrives ---------- */

// Two flowers and, when they've spoken, their bubbles. They turn to each other when `turned`.
function Pair({ theirs, left, right, turned, eyes = 0 }) {
  return (
    <div className="stage pair" aria-hidden="true">
      <Flower className={`st flower-left${turned ? ' turned' : ''}`} eyes={eyes} style={{ '--x': '5%', '--y': '31%', '--w': '42%' }} />
      <Flower spec={theirs} className={`st flower-right${turned ? ' turned' : ''}`} eyes={eyes} style={{ '--x': '53%', '--y': '31%', '--w': '42%' }} />
      {left && <Bubble text={left} className="st pop" style={{ '--x': '21%', '--y': '0%', '--w': '21%', '--r': '-6deg' }} />}
      {right && <Bubble text={right} flip className="st pop" style={{ '--x': '58%', '--y': '0%', '--w': '21%', '--r': '6deg', '--d': '250ms' }} />}
    </div>
  )
}

function Match({ s, set }) {
  const plum = plumOf(s)
  const turned = useSettle(false, true, 900)
  const begin = () =>
    set((p) => ({
      screen: 'home',
      ...(p.status === 'active' ? {} : { status: 'active', convo: FRESH_CONVO, plan: { step: 'where', activity: 0 }, after: FRESH_AFTER }),
    }))

  return (
    <>
      <h1 className="display rise">SOMEONE IS HERE.<br />MEET PLUM.</h1>
      <Pair theirs={plum.flower} left="hi." right="hi." turned={turned} />

      <p className="small" style={{ marginTop: 6 }}>why you resonated</p>
      <div className="stack tight" style={{ margin: '10px 0 26px', alignItems: 'flex-start' }}>
        <span className="tag pink pop" style={{ '--r': '-2deg', '--tag': '13.5px', '--d': '300ms' }}>{tendencyText(s, plum.pairs)}</span>
        <span className="tag lilac pop" style={{ '--r': '2deg', '--tag': '13.5px', '--d': '450ms', alignSelf: 'flex-end' }}>{plum.tendency}</span>
      </div>

      <p className="small">your first exchange</p>
      <h2 className="question" style={{ margin: '6px 0 16px', fontSize: 24 }}>{REFLECT[plum.reflect].q}</h2>
      <div className="stack">
        <Theirs plum={plum} text={plum.transcript} r={-1} />
        <Mine answer={s.answers[plum.reflect]} fallback={REFLECT[plum.reflect].sample} />
      </div>

      <div className="actions">
        <button className="pill pill-black pill-block" onClick={begin}>begin your prelude</button>
      </div>
    </>
  )
}

// Plum's answer card: the lilac tag, used as a card.
function Theirs({ plum, text, photo, face, locked, r = -1 }) {
  return (
    <div className="tag card lilac pop" style={{ '--r': `${r}deg` }}>
      <div className="who">
        <Flower spec={plum.flower} size={44} fold={locked ? 0.6 : 0} />
        {face && <Face who="plum" className="avatar" />}
        <span className="small">{THEM_LABEL}</span>
      </div>
      {locked ? (
        <p className="body" style={{ marginTop: 8 }}>{locked}</p>
      ) : (
        <>
          <Voice fill="#fff" wide style={{ marginTop: 8, marginBottom: 8 }} />
          <p className="body">{text}</p>
          {photo && <Photo kind={photo} style={{ '--w': '120px', '--r': '4deg', margin: '10px 0 0 auto' }} />}
        </>
      )}
    </div>
  )
}

/* ---------- 8. home ---------- */

function Home({ s, set }) {
  const [fern, setFern] = useState(false)
  const plum = plumOf(s)
  const { q, phase } = s.convo
  const card = {
    active: { text: `question ${q} of ${TOTAL} · ${phase === 'sent' ? "plum's turn" : 'your turn'}`, to: { screen: 'conversation' } },
    plan: { text: 'side by side · making a plan', to: { screen: 'plan' } },
    met: { text: 'you met side by side', to: s.after.step === 'done' ? null : { screen: 'after' } },
  }[s.status]

  return (
    <>
      <div className="row between rise">
        <span className="wordmark">PRELUDE</span>
        <Flower size={56} />
      </div>
      <h1 className="display m rise" style={{ margin: '18px 0 20px', '--d': '60ms' }}>YOUR PRELUDES</h1>

      <div className="stack">
        {card && (
          <button className="tag card lilac prelude-card pop" style={{ '--r': '-1.5deg', '--d': '120ms' }} onClick={() => card.to && set(card.to)}>
            <Flower spec={plum.flower} size={70} />
            <span className="grow">
              <span className="name">Plum</span>
              <span className="small" style={{ display: 'block', marginTop: 4 }}>{card.text}</span>
              {s.status === 'active' && <Progress value={q / TOTAL} />}
            </span>
          </button>
        )}

        <button className="tag card mint prelude-card pop" style={{ '--r': '1deg', '--d': '220ms' }} onClick={() => setFern(true)}>
          <Flower spec={FERN_FLOWER} size={70} />
          <span className="grow">
            <span className="name">Fern</span>
            <span className="small" style={{ display: 'block', marginTop: 4 }}>
              {fern ? 'fern is resting in this prototype.' : `question 9 of ${TOTAL} · photos unlocked`}
            </span>
            <Progress value={9 / TOTAL} />
          </span>
        </button>

        <div className="slot-empty rise" style={{ '--d': '320ms' }}>
          <p className="body">one more space. we'll only fill it when you're ready.</p>
        </div>
      </div>
    </>
  )
}

/* ---------- 9. the prelude ---------- */

const milestoneOf = (c) => {
  const m = AFTERGLOW[c.q]
  return m && c.glow[m.key] !== 'yes' ? m : null
}

// Move on from the current question, stopping at an Afterglow moment if one is due.
function advance(p) {
  const c = p.convo
  if (milestoneOf(c)) return { convo: { ...c, phase: 'glow' } }
  if (c.q >= TOTAL) return { screen: 'plan', status: 'plan', plan: { step: 'where', activity: 0 } }
  return { convo: { ...c, q: c.q + 1, phase: 'read', mine: null } }
}
const nextQuestion = (p) =>
  p.convo.q >= TOTAL
    ? { screen: 'plan', status: 'plan', plan: { step: 'where', activity: 0 } }
    : { convo: { ...p.convo, q: p.convo.q + 1, phase: 'read', mine: null } }
const skipQuestion = (p) => (p.convo.phase.startsWith('glow') || p.convo.phase === 'facesReveal' ? nextQuestion(p) : advance(p))

function Conversation({ s, set }) {
  const { q, phase, glow, mine } = s.convo
  const item = QUESTIONS[q - 1]
  const plum = plumOf(s)
  const m = AFTERGLOW[q]
  const plumYes = m && s.tester[m.key] === 'yes'
  const plumFirst = q % 2 === 1 // taking turns: plum answers first on odd questions
  const setC = (patch) => set((p) => ({ convo: { ...p.convo, ...patch } }))

  useEffect(() => {
    if (phase === 'sent') {
      const t = setTimeout(() => setC({ phase: 'ready' }), plumFirst ? 1100 : REPLY_DELAY)
      return () => clearTimeout(t)
    }
    if (phase === 'glowWait' && plumYes) {
      const t = setTimeout(
        () =>
          set((p) => ({
            convo: { ...p.convo, phase: m.key === 'faces' ? 'facesReveal' : 'glowMutual', glow: { ...p.convo.glow, [m.key]: 'yes' } },
          })),
        MUTUAL_DELAY,
      )
      return () => clearTimeout(t)
    }
  }, [phase, plumYes])

  const bar = (
    <div className="tag lilac topbar">
      <button onClick={() => set({ screen: 'home' })}>← Home</button>
      <span className="who">
        <Flower spec={plum.flower} size={34} />
        {glow.faces === 'yes' && <Face who="plum" className="avatar" style={{ width: 30 }} />}
        {THEM_LABEL}
      </span>
      <span style={{ textTransform: 'uppercase' }}>{q} of {TOTAL}</span>
    </div>
  )

  if (phase === 'answer') {
    return (
      <>
        {bar}
        <Answer
          s={s}
          set={set}
          label="your turn"
          question={item.q}
          sample={item.sample}
          onSend={(a) => setC({ phase: 'sent', mine: a })}
        />
      </>
    )
  }

  if (phase === 'facesReveal') {
    return (
      <>
        {bar}
        <div className="middle center">
          <p className="small">afterglow · faces</p>
          <h1 className="display rise" style={{ marginTop: 6 }}>IT'S MUTUAL.</h1>
          <div className="faces">
            <div className="pop" style={{ '--r': '-5deg', '--d': '500ms' }}>
              <Face who="plum" />
              <p className="small face-name">plum</p>
            </div>
            <div className="pop" style={{ '--r': '5deg', '--d': '500ms' }}>
              <Face who="you" />
              <p className="small face-name">you</p>
            </div>
          </div>
          <p className="body">you're both seeing this at the same moment.</p>
        </div>
        <div className="actions">
          <button className="pill pill-black pill-block" onClick={() => set(nextQuestion)}>continue</button>
        </div>
      </>
    )
  }

  if (phase.startsWith('glow') && m) {
    const isMeet = m.key === 'meet'
    const mutual = phase === 'glowMutual'
    return (
      <>
        {bar}
        <Pair theirs={plum.flower} left={phase === 'glowWait' || mutual ? 'yes' : ''} right={mutual ? 'yes' : ''} turned={mutual} eyes={mutual ? 1 : 0} />
        <p className="small" style={{ marginTop: 10 }}>afterglow · only opens if you both say yes</p>
        {phase === 'glow' && (
          <>
            <h1 className="display m rise" style={{ margin: '8px 0 12px' }}>{m.ask}</h1>
            <p className="body">{m.detail}</p>
            <p className="small" style={{ marginTop: 10 }}>plum is asked the same. a no is never shown.</p>
            <div className="actions">
              <div className="row stretch" style={{ width: '100%' }}>
                <button className="pill pill-white" onClick={() => setC({ phase: 'glowNo' })}>not yet</button>
                <button className="pill pill-black" onClick={() => setC({ phase: 'glowWait' })}>yes</button>
              </div>
            </div>
          </>
        )}
        {phase === 'glowWait' && (
          <>
            <h1 className="display m rise" style={{ margin: '8px 0 12px' }}>WE'LL TELL YOU IF IT'S MUTUAL.</h1>
            <p className="body">no rush. nothing changes until then.</p>
            {!plumYes && (
              <div className="actions">
                {isMeet ? (
                  <button className="pill pill-white pill-block" onClick={() => set({ screen: 'home' })}>back home</button>
                ) : (
                  <button className="pill pill-black pill-block" onClick={() => set(nextQuestion)}>keep going</button>
                )}
              </div>
            )}
          </>
        )}
        {mutual && (
          <>
            <h1 className="display rise" style={{ margin: '8px 0 12px' }}>IT'S MUTUAL.</h1>
            <p className="body">{m.mutual}</p>
            <div className="actions">
              <button className="pill pill-black pill-block" onClick={() => set(nextQuestion)}>{isMeet ? 'see the plan' : 'continue'}</button>
            </div>
          </>
        )}
        {phase === 'glowNo' && (
          <>
            <h1 className="display m rise" style={{ margin: '8px 0 12px' }}>THAT'S OKAY.</h1>
            <p className="body">plum will never know. {isMeet ? "say the word when you're ready." : "we'll ask again later."}</p>
            <div className="actions">
              {isMeet ? (
                <div className="row stretch" style={{ width: '100%' }}>
                  <button className="pill pill-white" onClick={() => set({ screen: 'home' })}>back home</button>
                  <button className="pill pill-black" onClick={() => setC({ phase: 'glow' })}>ask me again</button>
                </div>
              ) : (
                <button className="pill pill-black pill-block" onClick={() => set(nextQuestion)}>continue</button>
              )}
            </div>
          </>
        )}
      </>
    )
  }

  const revealed = phase === 'ready'
  const nextIsGlow = !!milestoneOf(s.convo)
  return (
    <>
      {bar}
      <Progress value={q / TOTAL} />
      <h1 className="question rise" style={{ margin: '18px 0 20px' }}>{item.q}</h1>

      <div className="stack">
        {revealed ? (
          <Theirs plum={plum} text={item.a} photo={glow.world === 'yes' ? item.photo : null} face={glow.faces === 'yes'} />
        ) : (
          <Theirs
            plum={plum}
            locked={
              plumFirst || phase === 'sent'
                ? plumFirst
                  ? `${THEM} has answered. you'll hear it once you have too.`
                  : `${THEM} is answering…`
                : `${THEM} is still thinking. you can go first.`
            }
          />
        )}
        {mine && <Mine answer={mine} />}
      </div>

      {phase === 'sent' && <p className="small center" style={{ marginTop: 18 }}>{THEM} hears it only once you've both answered.</p>}

      <div className="actions">
        {phase === 'read' && (
          <button className="pill pill-black pill-block" onClick={() => setC({ phase: 'answer' })}>your turn</button>
        )}
        {revealed && (
          <button className="pill pill-black pill-block" onClick={() => set(advance)}>
            {q < TOTAL && !nextIsGlow ? 'next question' : 'continue'}
          </button>
        )}
      </div>
    </>
  )
}

/* ---------- 10. side by side ---------- */

function Plan({ s, set }) {
  const plum = plumOf(s)
  const ranked = [...ACTIVITIES].sort((a, b) => b.fits.includes(plum.pairs) - a.fits.includes(plum.pairs))
  const activity = ranked[s.plan.activity % ranked.length]
  const setP = (patch) => set((p) => ({ plan: { ...p.plan, ...patch } }))

  if (s.plan.step === 'where') {
    return (
      <>
        <p className="small rise">side by side · you both said yes</p>
        <h1 className="display rise" style={{ margin: '8px 0 12px', '--d': '60ms' }}>WHERE WOULD SUIT YOU?</h1>
        <p className="body rise" style={{ '--d': '120ms' }}>a neighbourhood or a town is enough. plum is asked the same.</p>
        <input
          className="field rise"
          style={{ marginTop: 18, '--d': '180ms' }}
          type="text"
          placeholder="neighbourhood or town"
          value={s.area}
          onChange={(e) => set({ area: e.target.value })}
        />
        <div className="actions">
          <button className="pill pill-black pill-block" disabled={!s.area.trim()} onClick={() => setP({ step: 'suggest' })}>continue</button>
        </div>
      </>
    )
  }

  return (
    <>
      <p className="small rise">side by side · near {s.area.trim() || 'you both'}</p>
      <h1 className="display m rise" style={{ margin: '8px 0 0', '--d': '60ms' }}>{activity.title}</h1>
      <div className="walk" aria-hidden="true">
        <Sticker html={PATH} />
        <div className="walkers">
          <Flower className="walker" look={0.6} />
          <Flower spec={plum.flower} className="walker walker-b" look={-0.6} />
        </div>
        <Sticker html={MOON} className="st pop" style={{ '--x': '80%', '--y': '4%', '--w': '13%', '--d': '400ms' }} />
        <span className="st tag mint pop" style={{ '--x': '8%', '--y': '6%', '--r': '-4deg', '--tag': '13px', '--d': '300ms' }}>side by side</span>
      </div>
      <div className="note" style={{ '--r': '-1deg', marginTop: 14 }} key={activity.title}>
        <p className="body" style={{ textTransform: 'uppercase' }}>{activity.when}</p>
        <p className="body" style={{ marginTop: 4 }}>{activity.why}</p>
      </div>
      <p className="small" style={{ margin: '20px 0 8px' }}>chosen around</p>
      <div className="stack tight" style={{ alignItems: 'flex-start' }}>
        <span className="tag pink" style={{ '--r': '-2deg', '--tag': '12.5px' }}>{tendencyText(s, plum.pairs)}</span>
        <span className="tag butter" style={{ '--r': '1.5deg', '--tag': '12.5px', alignSelf: 'flex-end' }}>{plum.tendency}</span>
      </div>
      <div className="actions">
        <button className="pill pill-black pill-block" onClick={() => set({ screen: 'powerdown', status: 'met' })}>sounds good</button>
        <button className="pill pill-white pill-block" onClick={() => setP({ activity: s.plan.activity + 1 })}>suggest something else</button>
      </div>
    </>
  )
}

/* ---------- 11. power down ---------- */

function Powerdown({ set }) {
  const fold = useSettle(0, 1, 500)
  return (
    <>
      <div className="middle center">
        <div className="stage" style={{ width: 230, margin: '0 auto 26px' }}>
          <Flower className="slow" fold={fold} />
          <Sticker html={MOON} className="st pop" style={{ '--x': '78%', '--y': '-12%', '--w': '34%', '--d': '2600ms' }} aria-hidden="true" />
        </div>
        <h1 className="display m fade" style={{ '--d': '3200ms' }}>THAT'S IT FROM US.<br />ENJOY IT.</h1>
        <p className="body fade" style={{ marginTop: 14, '--d': '4800ms' }}>no reminders, no tips. we'll be quiet until afterwards.</p>
      </div>
      <div className="actions">
        <button className="link fade" style={{ '--d': '6200ms' }} onClick={() => set({ screen: 'after', after: FRESH_AFTER })}>the next day →</button>
      </div>
    </>
  )
}

/* ---------- 12. after the meeting ---------- */

function After({ s, set }) {
  const a = s.after
  const plum = plumOf(s)
  const setA = (patch) => set((p) => ({ after: { ...p.after, ...patch } }))
  const same = a.again === s.tester.again

  if (a.step === 'self') {
    return (
      <>
        <p className="small rise">after the meeting · just for you</p>
        <div className="middle">
          <Flower size={130} className="pop" />
          <h1 className="display rise" style={{ margin: '18px 0 10px' }}>DID YOU FEEL LIKE YOURSELF?</h1>
          <p className="body">plum never sees this one.</p>
        </div>
        <div className="actions">
          <div className="row stretch" style={{ width: '100%' }}>
            <button className="pill pill-white" onClick={() => setA({ self: 'not really', step: 'again' })}>not really</button>
            <button className="pill pill-black" onClick={() => setA({ self: 'yes', step: 'again' })}>yes</button>
          </div>
        </div>
      </>
    )
  }

  if (a.step === 'again') {
    return (
      <>
        <p className="small rise">after the meeting</p>
        <div className="middle">
          <Pair theirs={plum.flower} />
          <h1 className="display rise" style={{ margin: '4px 0 10px' }}>MEET AGAIN?</h1>
          <p className="body">you'll only see plum's answer if it matches yours.</p>
        </div>
        <div className="actions">
          <div className="row stretch" style={{ width: '100%' }}>
            <button className="pill pill-white" onClick={() => setA({ again: 'not yet', step: 'result' })}>not yet</button>
            <button className="pill pill-black" onClick={() => setA({ again: 'yes', step: 'result' })}>yes</button>
          </div>
        </div>
      </>
    )
  }

  const bothYes = same && a.again === 'yes'
  return (
    <>
      <p className="small rise">after the meeting</p>
      <div className="middle">
        {same ? (
          <>
            <Pair theirs={plum.flower} left={bothYes ? 'yes' : ''} right={bothYes ? 'yes' : ''} turned={bothYes} eyes={bothYes ? 1 : 0} />
            <h1 className="display m rise" style={{ margin: '4px 0 10px' }}>{bothYes ? 'PLUM WOULD LIKE THAT TOO.' : 'PLUM FEELS THE SAME.'}</h1>
            <p className="body">{bothYes ? 'the rest is yours. we step back.' : 'no rush, for either of you.'}</p>
          </>
        ) : (
          <>
            <Flower size={130} className="pop" />
            <h1 className="display m rise" style={{ margin: '18px 0 10px' }}>NOTED.</h1>
            <p className="body">you'll only hear about it if it matches.</p>
          </>
        )}
      </div>
      <div className="actions">
        <button className="pill pill-black pill-block" onClick={() => set((p) => ({ screen: 'home', after: { ...p.after, step: 'done' } }))}>back home</button>
      </div>
    </>
  )
}

/* ---------- 13. ending ---------- */

function Ending({ set }) {
  return (
    <>
      <div className="middle center">
        <Flower size={170} fold={1} style={{ margin: '0 auto 22px', filter: 'grayscale(1)' }} />
        <h1 className="display m rise">THIS PRELUDE HAS ENDED.</h1>
        <p className="body rise" style={{ marginTop: 12, '--d': '120ms' }}>it's about timing, not you.</p>
      </div>
      <div className="actions">
        <button className="pill pill-white pill-block" onClick={() => set({ screen: 'home', status: 'ended' })}>back home</button>
      </div>
    </>
  )
}

const SCREENS = {
  welcome: Welcome,
  reflect: Reflect,
  mirror: Mirror,
  matching: Matching,
  waiting: Waiting,
  qotd: Qotd,
  match: Match,
  home: Home,
  conversation: Conversation,
  plan: Plan,
  powerdown: Powerdown,
  after: After,
  ending: Ending,
}
