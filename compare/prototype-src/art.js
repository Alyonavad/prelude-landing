// Sticker artwork, ported from the landing page (product page/script.js and index.html).
// Same shapes, strokes and halos; the flower takes a spec so each person gets their own.

export const INK = '#05060f'
export const COLOURS = { lilac: '#d9b8f2', pink: '#f4a6b8', butter: '#f4d35e', mint: '#a8e3b5' }

let uid = 0

// Drawn around 0,0 so petals and face can be transformed without a transform-origin.
export function flowerSVG({ petals = 8, fill = '#fff' } = {}) {
  const rx = Math.max(15, Math.min(27, Math.round(50 * Math.sin(Math.PI / petals) * 1.3)))
  const p = Array.from(
    { length: petals },
    (_, i) => `<ellipse class="f-petal" style="--a: ${(i * 360) / petals}deg" cx="0" cy="-50" rx="${rx}" ry="40" />`,
  ).join('')
  return `
<svg viewBox="-114 -114 228 228">
  <g fill="#fff" stroke="#fff" stroke-width="22" stroke-linejoin="round">${p}<circle r="40" /></g>
  <g fill="${fill}" stroke="${INK}" stroke-width="3">${p}</g>
  <circle r="40" fill="#ffd447" stroke="${INK}" stroke-width="3" />
  <g class="f-features">
    <g fill="#f4a6b8"><ellipse cx="-20" cy="11" rx="7" ry="4.2" /><ellipse cx="20" cy="11" rx="7" ry="4.2" /></g>
    <g fill="none" stroke="${INK}" stroke-width="3.3" stroke-linecap="round">
      <g class="f-closed"><path d="M-22 -2 q6 6 12 0" /><path d="M10 -2 q6 6 12 0" /></g>
      <path class="f-smile" d="M-8 14 q8 7 16 0" />
      <path class="f-flat" d="M-6 17 h12" />
    </g>
    <g class="f-open" fill="${INK}">
      <circle cx="-16" cy="-1" r="4.6" /><circle cx="16" cy="-1" r="4.6" />
      <circle cx="-14.4" cy="-2.6" r="1.4" fill="#fff" /><circle cx="17.6" cy="-2.6" r="1.4" fill="#fff" />
    </g>
  </g>
</svg>`
}

const BUBBLE_PATH = 'M6 3 H38 a4 4 0 0 1 4 4 V22 a4 4 0 0 1 -4 4 H18 L9 33 V26 H6 a4 4 0 0 1 -4 -4 V7 a4 4 0 0 1 4 -4Z'

// The label is HTML on top of the SVG, as on the landing page.
export const bubbleSVG = (text) => `
<svg viewBox="-3 -3 50 42">
  <path d="${BUBBLE_PATH}" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round" />
  <path d="${BUBBLE_PATH}" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" />
</svg>${text ? `<span class="bubble-text${text.length > 4 ? ' long' : ''}">${text}</span>` : ''}`

export const MOON = `
<svg viewBox="0 0 44 44">
  <path d="M28 6 A16 16 0 1 0 38 30 A13 13 0 0 1 28 6Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round" />
  <path d="M28 6 A16 16 0 1 0 38 30 A13 13 0 0 1 28 6Z" fill="#f4d35e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" />
  <path d="M16 24 q2.5 2 5 0" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" />
</svg>`

export const PIXEL = `
<svg viewBox="-1.6 -1.6 15.2 15.2">
  <circle cx="6" cy="6" r="7.4" fill="#fff" />
  <circle cx="6" cy="6" r="6" fill="#e6e9f0" />
  <g fill="${INK}" shape-rendering="crispEdges"><rect x="4" y="4" width="1" height="1" /><rect x="7" y="4" width="1" height="1" /><rect x="3" y="7" width="1" height="1" /><rect x="4" y="8" width="4" height="1" /><rect x="8" y="7" width="1" height="1" /></g>
</svg>`

// The voice note from the landing page's "answer in your own time" scene.
const BARS = [14, 28, 20, 36, 24, 12, 32, 22, 38, 18, 28, 12, 20]
// `width` is the note's width in SVG units (160 = the landing page sticker); wider notes get more bars.
export const voiceSVG = (fill = COLOURS.lilac, width = 160) => {
  const count = Math.floor((width - 60) / 8) + 1
  const bars = Array.from({ length: count }, (_, i) => BARS[(i * 5 + (i > 12 ? 3 : 0)) % BARS.length])
  return `
<svg viewBox="-8 -8 ${width + 16} 76">
  <rect x="0" y="0" width="${width}" height="60" rx="12" fill="#fff" stroke="#fff" stroke-width="14" stroke-linejoin="round" />
  <rect x="0" y="0" width="${width}" height="60" rx="12" fill="${fill}" stroke="${INK}" stroke-width="2.5" />
  <rect x="4.5" y="4.5" width="${width - 9}" height="51" rx="8" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="5 4" />
  <circle cx="26" cy="30" r="12" fill="${INK}" />
  <path class="v-play" d="M22 23.5 L33 30 L22 36.5Z" fill="#fff" />
  <g class="v-pause" fill="#fff"><rect x="21" y="24" width="3.6" height="12" rx="1" /><rect x="27.4" y="24" width="3.6" height="12" rx="1" /></g>
  <g fill="${INK}">${(width === 160 ? BARS : bars)
    .map((h, i) => `<rect class="bar" style="--i: ${i}" x="${48 + i * 8}" y="${30 - h / 2}" width="4" height="${h}" rx="2" />`)
    .join('')}</g>
</svg>`
}

// "A piece of your world" photos, from the landing page's world scene.
const frame = (inner) => `
<svg viewBox="-6 -6 112 122">
  <rect x="0" y="0" width="100" height="110" rx="7" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round" />
  ${inner}
</svg>`

export function photoSVG(kind) {
  const id = `clip-${kind}-${uid++}`
  const clip = `<clipPath id="${id}"><rect x="8" y="8" width="84" height="84" rx="3" /></clipPath>`
  const edge = `<rect x="8" y="8" width="84" height="84" rx="3" fill="none" stroke="${INK}" stroke-width="2.6" />`
  if (kind === 'plant') {
    return frame(`
  <rect x="8" y="8" width="84" height="84" rx="3" fill="#f4d35e" stroke="${INK}" stroke-width="2.6" />
  <g stroke="${INK}" stroke-width="2.2" stroke-linejoin="round">
    <ellipse cx="50" cy="38" rx="8" ry="19" fill="#a8e3b5" />
    <ellipse cx="34" cy="46" rx="7" ry="17" fill="#a8e3b5" transform="rotate(-32 34 46)" />
    <ellipse cx="66" cy="46" rx="7" ry="17" fill="#a8e3b5" transform="rotate(32 66 46)" />
    <path d="M34 60 H66 L61 84 H39Z" fill="#f4a6b8" />
  </g>`)
  }
  if (kind === 'room') {
    return frame(`${clip}
  <g clip-path="url(#${id})" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round">
    <path d="M8 8 H44 V68 L8 84Z" fill="#f4a6b8" />
    <path d="M44 8 H92 V80 L44 68Z" fill="#d9b8f2" />
    <path d="M8 84 L44 68 L92 80 V92 H8Z" fill="#a8e3b5" />
    <path d="M66 76 V44" fill="none" />
    <path d="M57 44 H75 L71 30 H61Z" fill="#f4d35e" />
    <path d="M16 26 L32 21 V43 L16 48Z" fill="#fff" />
  </g>
  ${edge}`)
  }
  return frame(`${clip}
  <g clip-path="url(#${id})">
    <rect x="8" y="8" width="84" height="84" fill="#d9b8f2" />
    <circle cx="66" cy="34" r="12" fill="#f4d35e" stroke="${INK}" stroke-width="2.2" />
    <path d="M0 78 Q24 50 48 72 T100 62 V100 H0Z" fill="#a8e3b5" stroke="${INK}" stroke-width="2.2" />
  </g>
  ${edge}
  <path d="M50 8 V92 M8 50 H92" stroke="${INK}" stroke-width="2.6" />`)
}

// Illustrated face placeholders, drawn in the same photo frame.
const HAIR = {
  bob: 'M27 56 V40 a23 23 0 0 1 46 0 V56 h-9 V42 q-14 -2 -22 -10 q-2 7 -6 10 V56Z',
  short: 'M29 43 a21 21 0 0 1 42 0 q-9 -9 -21 -8 q-12 -1 -21 8Z',
}
export function faceSVG({ bg = COLOURS.butter, hair = COLOURS.pink, style = 'bob', top = '#fff' } = {}) {
  const id = `clip-face-${uid++}`
  return frame(`<clipPath id="${id}"><rect x="8" y="8" width="84" height="84" rx="3" /></clipPath>
  <g clip-path="url(#${id})" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="8" y="8" width="84" height="84" fill="${bg}" stroke="none" />
    <path d="M20 96 q0 -24 30 -24 q30 0 30 24Z" fill="${top}" />
    <rect x="44" y="60" width="12" height="14" fill="#fff" />
    <circle cx="50" cy="44" r="19" fill="#fff" />
    <path d="${HAIR[style]}" fill="${hair}" />
    <g fill="#f4a6b8" stroke="none"><ellipse cx="39" cy="51" rx="4" ry="2.4" /><ellipse cx="61" cy="51" rx="4" ry="2.4" /></g>
    <g fill="none" stroke-linecap="round"><path d="M38 44 q3.5 3.5 7 0" /><path d="M55 44 q3.5 3.5 7 0" /><path d="M45 53 q5 4.5 10 0" /></g>
  </g>
  <rect x="8" y="8" width="84" height="84" rx="3" fill="none" stroke="${INK}" stroke-width="2.6" />`)
}

// The side-by-side path.
const PATH_D = 'M-40 120 C 180 60, 380 175, 620 112 S 900 78, 1040 122'
export const PATH = `
<svg class="path" viewBox="0 0 1000 200">
  <path d="${PATH_D}" fill="none" stroke="#fff" stroke-width="66" />
  <path d="${PATH_D}" fill="none" stroke="${INK}" stroke-width="46" />
  <path d="${PATH_D}" fill="none" stroke="#f4d35e" stroke-width="40" />
  <path d="${PATH_D}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="16 14" />
</svg>`
