// Prelude landing page: sticker templates, scroll-tied scene progress, fake waitlist submit. No backend.

const INK = '#05060f';

// ---------- sticker templates (same artwork as the SVGs in /assets) ----------

const PETALS = [0, 45, 90, 135, 180, 225, 270, 315]
  .map((a) => `<ellipse class="f-petal" style="--a: ${a}deg" cx="0" cy="-50" rx="25" ry="40" />`)
  .join('');

// Drawn around 0,0 so petals and face can be transformed without a transform-origin.
const FLOWER = `
<svg viewBox="-114 -114 228 228">
  <g fill="#fff" stroke="#fff" stroke-width="22" stroke-linejoin="round">${PETALS}<circle r="40" /></g>
  <g fill="#fff" stroke="${INK}" stroke-width="3">${PETALS}</g>
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
</svg>`;

const BUBBLE_PATH = 'M6 3 H38 a4 4 0 0 1 4 4 V22 a4 4 0 0 1 -4 4 H18 L9 33 V26 H6 a4 4 0 0 1 -4 -4 V7 a4 4 0 0 1 4 -4Z';

// The label is HTML on top of the SVG: SVG text mis-scales inside scroll-transformed stickers.
const bubble = (text) => `
<svg viewBox="-3 -3 50 42">
  <path d="${BUBBLE_PATH}" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round" />
  <path d="${BUBBLE_PATH}" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" />
</svg>${text ? `<span class="bubble-text${text.length > 4 ? ' long' : ''}">${text}</span>` : ''}`;

const MOON = `
<svg viewBox="0 0 44 44">
  <path d="M28 6 A16 16 0 1 0 38 30 A13 13 0 0 1 28 6Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round" />
  <path d="M28 6 A16 16 0 1 0 38 30 A13 13 0 0 1 28 6Z" fill="#f4d35e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" />
  <path d="M16 24 q2.5 2 5 0" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" />
</svg>`;

const PIXEL = `
<svg viewBox="-1.6 -1.6 15.2 15.2">
  <circle cx="6" cy="6" r="7.4" fill="#fff" />
  <circle cx="6" cy="6" r="6" fill="#e6e9f0" />
  <g fill="${INK}" shape-rendering="crispEdges"><rect x="4" y="4" width="1" height="1" /><rect x="7" y="4" width="1" height="1" /><rect x="3" y="7" width="1" height="1" /><rect x="4" y="8" width="4" height="1" /><rect x="8" y="7" width="1" height="1" /></g>
</svg>`;

document.querySelectorAll('[data-flower]').forEach((el) => (el.innerHTML = FLOWER));
document.querySelectorAll('[data-bubble]').forEach((el) => (el.innerHTML = bubble(el.dataset.bubble)));
document.querySelectorAll('[data-moon]').forEach((el) => (el.innerHTML = MOON));
document.querySelectorAll('[data-pixel]').forEach((el) => (el.innerHTML = PIXEL));

// ---------- scroll-tied animation ----------
// Each scene gets --p: 0 as its top edge enters the bottom of the viewport, 0.5 when it fills
// the viewport, 1 as it leaves the top. All motion is CSS calc() on --p, so it runs both ways.

const root = document.documentElement;
const scenes = [...document.querySelectorAll('.scene')];
const retreat = document.getElementById('retreat');
const turn = document.getElementById('turn');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const ramp = (p, from, to) => clamp01((p - from) / (to - from));

function progress(el) {
  const rect = el.getBoundingClientRect();
  return clamp01((innerHeight - rect.top) / (innerHeight + rect.height));
}

let queued = false;

function update() {
  queued = false;
  scenes.forEach((scene) => scene.style.setProperty('--p', progress(scene).toFixed(4)));
  // The page drains to grey as the bud closes, and blue returns with the question.
  const grey = ramp(progress(retreat), 0.2, 0.45) - ramp(progress(turn), 0.2, 0.45);
  root.style.setProperty('--grey', clamp01(grey).toFixed(4));
}

function requestUpdate() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(update);
  }
}

if (!reducedMotion.matches) {
  root.classList.add('scrolly');
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  update();
}

// ---------- waitlist form: validate, then swap the form for the thank-you line ----------

const THANKS = "thank you. we'll write once, when it's ready.";

document.querySelectorAll('.waitlist').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const input = form.querySelector('input[type="email"]');
    const error = form.querySelector('.form-error');

    if (!input.value.trim() || !input.checkValidity()) {
      error.hidden = false;
      input.focus();
      return;
    }

    const thanks = document.createElement('p');
    thanks.className = 'line thanks';
    thanks.setAttribute('role', 'status');
    thanks.textContent = THANKS;
    form.replaceWith(thanks);
  });
});
