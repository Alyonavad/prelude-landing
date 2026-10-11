// The landing page's second script (index.html loads it after script.js): frame toggle, prototype
// clips, typing, waitlist form states and the photo fan-out.

const html = document.documentElement;
const frameToggle = document.querySelector('.frame-toggle');

function renderFrameToggle() {
  frameToggle.textContent = `frame: ${html.dataset.frame}`;
}

frameToggle.addEventListener('click', () => {
  html.dataset.frame = html.dataset.frame === 'drawn' ? 'iphone' : 'drawn';

  const url = new URL(location.href);
  if (html.dataset.frame === 'drawn') url.searchParams.set('frame', 'drawn');
  else url.searchParams.delete('frame');
  history.replaceState(null, '', url);
  renderFrameToggle();
});

renderFrameToggle();

// The prototype always renders at 390x844; scale it to whatever size the screen is drawn at.
const fit = new ResizeObserver((entries) => {
  entries.forEach(({ target }) => {
    const frame = target.querySelector('iframe');
    const scale = target.clientWidth / 390;
    frame.style.setProperty('--s', scale);
    // The opening is a touch taller than 390:844, so stretch the clip to cover it (plus 2px of
    // overlap); otherwise the clip's bottom edge shows as a faint line above the bezel.
    frame.style.height = `${Math.ceil(target.clientHeight / scale) + 2}px`;
  });
});

document.querySelectorAll('.device-screen').forEach((screen) => fit.observe(screen));

// Footer FAQ: reserve each item's open height, so opening an answer never moves anything else.
const faqItems = [...document.querySelectorAll('.faq-item')];

function reserveFaq() {
  faqItems.forEach((item) => {
    const details = item.querySelector('details');
    const wasOpen = details.open;
    item.style.removeProperty('--open-height');
    details.open = true;
    const height = details.offsetHeight;
    details.open = wasOpen;
    item.style.setProperty('--open-height', `${height + 1}px`); // offsetHeight rounds down; 1px covers the fraction
  });
}

document.fonts.ready.then(reserveFaq);
addEventListener('resize', reserveFaq);

// Hero speech bubble: three "typing" dots (script.js fills the bubble first, so add them after).
document.querySelectorAll('[data-typing]').forEach((el) => {
  el.insertAdjacentHTML('beforeend', '<span class="typing-dots"><i>.</i><i>.</i><i>.</i></span>');
});

// Typed answer: loops through three answers to the phone's question. Each is typed at a human
// pace, held, deleted backspace-style, then the next one starts. Runs only while on screen.
const typedSticker = document.querySelector('.typed');
const typedSlot = typedSticker.querySelector('.typed-text');
const ANSWERS = ['slow coffee. no plans.', 'a long walk with no destination.', 'pancakes, then a nap.'];
const SENTENCE_PAUSE = 600; // a breath after a full stop mid-answer
const HOLD = 2500; // full answer stays up
const GAP = 600; // empty, caret blinking, before the next answer

typedSlot.innerHTML = '<span class="typed-ghost"></span><span class="typed-live"><span class="typed-chars"></span><span class="caret"></span></span>';
// the invisible ghost is the longest answer, so the sticker never changes size
typedSlot.querySelector('.typed-ghost').textContent = ANSWERS.reduce((a, b) => (b.length > a.length ? b : a));
const typedChars = typedSlot.querySelector('.typed-chars');

let typingTimer = 0;
let answerIndex = 0;
let charCount = 0;
let phase = 'typing'; // typing | deleting

function typingStep() {
  const answer = ANSWERS[answerIndex];
  let wait;

  if (phase === 'typing') {
    charCount += 1;
    typedChars.textContent = answer.slice(0, charCount);
    if (charCount >= answer.length) {
      phase = 'deleting';
      wait = HOLD;
    } else {
      const endOfSentence = answer[charCount - 1] === '.' && answer[charCount] === ' ';
      wait = (endOfSentence ? SENTENCE_PAUSE : 0) + 70 + Math.random() * 50; // 70-120ms per letter
    }
  } else {
    charCount -= 1;
    typedChars.textContent = answer.slice(0, charCount);
    if (charCount <= 0) {
      phase = 'typing';
      answerIndex = (answerIndex + 1) % ANSWERS.length;
      wait = GAP;
    } else {
      wait = 35 + Math.random() * 20; // backspace: a bit faster than typing
    }
  }

  typingTimer = setTimeout(typingStep, wait);
}

// Reduced motion is the only case that skips the typing: just the first answer, static.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
  typedChars.textContent = ANSWERS[0];
} else {
  let running = false;
  new IntersectionObserver(
    ([entry]) => {
      // off screen: pause where it is; back on screen: carry on
      if (!entry.isIntersecting) {
        clearTimeout(typingTimer);
        running = false;
      } else if (entry.intersectionRatio >= 0.6 && !running) {
        running = true;
        typingTimer = setTimeout(typingStep, 400);
      }
    },
    { threshold: [0, 0.6] }
  ).observe(typedSticker);
}

// ---------- Waitlist form: sending, done and error states ----------
// There is no backend yet. joinWaitlist() is the one place to plug a real endpoint in.

const SEND_MIN_MS = 2500; // the sending state always lasts at least this long
const SEND_COPY = {
  sending: 'sending quietly…',
  done: "you're on the list. we'll write when it's your turn.",
  invalid: "hmm, that email doesn't look right.",
  failed: "couldn't send. try again?",
};

// Simulated request: resolves after ~1.5s. Open the page with ?send=fail to see the failure state.
// To go live, replace the body with something like:
//   const response = await fetch('/api/waitlist', { method: 'POST', body: JSON.stringify({ email }) });
//   if (!response.ok) throw new Error('request failed');
async function joinWaitlist(email) {
  await wait(1500);
  if (new URLSearchParams(location.search).get('send') === 'fail') throw new Error('simulated failure');
  return { email };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const skipMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const INK_C = '#05060f';
const ENVELOPE = `
<svg viewBox="-4 -4 48 38">
  <rect x="0" y="0" width="40" height="30" rx="4" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round" />
  <rect x="0" y="0" width="40" height="30" rx="4" fill="#fff" stroke="${INK_C}" stroke-width="2.2" />
  <path d="M1.5 3 L20 17 L38.5 3" fill="none" stroke="${INK_C}" stroke-width="2.2" stroke-linejoin="round" />
</svg>`;

// the little things the bubble flicks through while sending
const SEND_ITEMS = [
  // a mini voice note
  `<svg viewBox="0 0 40 40">
    <rect x="3" y="11" width="34" height="18" rx="6" fill="#d9b8f2" stroke="${INK_C}" stroke-width="2.2" />
    <circle cx="11" cy="20" r="3.6" fill="${INK_C}" />
    <g fill="${INK_C}"><rect x="17" y="17" width="2.4" height="6" rx="1.2" /><rect x="21.4" y="14.5" width="2.4" height="11" rx="1.2" /><rect x="25.8" y="16" width="2.4" height="8" rx="1.2" /><rect x="30.2" y="18" width="2.4" height="4" rx="1.2" /></g>
  </svg>`,
  // a mini plant photo
  `<svg viewBox="0 0 40 40">
    <rect x="6" y="6" width="28" height="28" rx="4" fill="#f4d35e" stroke="${INK_C}" stroke-width="2.2" />
    <g stroke="${INK_C}" stroke-width="1.8" stroke-linejoin="round">
      <ellipse cx="20" cy="16" rx="3" ry="6.5" fill="#a8e3b5" />
      <ellipse cx="14.5" cy="18.5" rx="2.6" ry="5.6" fill="#a8e3b5" transform="rotate(-32 14.5 18.5)" />
      <ellipse cx="25.5" cy="18.5" rx="2.6" ry="5.6" fill="#a8e3b5" transform="rotate(32 25.5 18.5)" />
      <path d="M14.5 23 H25.5 L24 30 H16Z" fill="#f4a6b8" />
    </g>
  </svg>`,
  // a coffee cup
  `<svg viewBox="0 0 40 40">
    <g fill="none" stroke="${INK_C}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 6 q-2.5 3 0 6 M22 6 q-2.5 3 0 6" />
      <path d="M28 19 h3 a4 4 0 0 1 0 8 h-3.6" />
      <path d="M8 17 H29 V24 a8 8 0 0 1 -8 8 H16 a8 8 0 0 1 -8 -8Z" fill="#a8e3b5" />
      <path d="M6 36 H31" />
    </g>
  </svg>`,
  // a "yes"
  '<span>yes</span>',
];

document.querySelectorAll('.waitlist-slot').forEach((slot) => {
  const form = slot.querySelector('.waitlist');
  const input = form.querySelector('input[type="email"]');
  const note = slot.querySelector('.send-note');
  const panel = slot.querySelector('.send-panel');

  note.querySelector('.flower').innerHTML = FLOWER; // FLOWER and bubble() are the sticker templates in script.js

  const showNote = (kind) => {
    slot.dataset.state = 'error';
    note.querySelector('.send-copy').textContent = SEND_COPY[kind];
    note.hidden = false;
    panel.hidden = true;
  };

  const clearNote = () => {
    if (slot.dataset.state !== 'error') return;
    slot.dataset.state = 'idle';
    note.hidden = true;
  };

  // one item in the bubble at a time; a fresh element each time restarts the pop
  const setItem = (scene, html, className = '') => {
    scene.querySelector('.send-item')?.remove();
    scene.querySelector('.send-bubble').insertAdjacentHTML('beforeend', `<div class="send-item ${className}">${html}</div>`);
  };

  async function send() {
    panel.innerHTML = `
      <div class="send-scene" aria-hidden="true">
        <div class="send-bubble">${bubble('')}</div>
        <div class="flower send-flower">${FLOWER}</div>
        <div class="send-held">${ENVELOPE}</div>
      </div>
      <div class="send-text">
        <p class="send-copy">${SEND_COPY.sending}</p>
        <svg class="send-progress" viewBox="0 0 220 12" aria-hidden="true">
          <clipPath id="send-clip"><rect x="2" y="2" width="216" height="8" rx="4" /></clipPath>
          <rect x="2" y="2" width="216" height="8" rx="4" fill="#fff" />
          <rect class="fill" x="2" y="2" width="216" height="8" fill="#f4d35e" clip-path="url(#send-clip)" />
          <rect x="2" y="2" width="216" height="8" rx="4" fill="none" stroke="${INK_C}" stroke-width="2" />
        </svg>
      </div>`;
    const scene = panel.querySelector('.send-scene');
    panel.style.setProperty('--send-ms', `${SEND_MIN_MS}ms`);
    slot.dataset.state = 'sending';
    note.hidden = true;
    panel.hidden = false;

    let step = 0;
    setItem(scene, SEND_ITEMS[0]);
    const cycle = setInterval(() => setItem(scene, SEND_ITEMS[++step % SEND_ITEMS.length]), 600);

    try {
      // reduced motion: no waiting on the animation, just the request itself
      await Promise.all([joinWaitlist(input.value.trim()), skipMotion ? null : wait(SEND_MIN_MS)]);
      clearInterval(cycle);
      slot.dataset.state = 'done';
      panel.querySelector('.send-copy').textContent = SEND_COPY.done;
      setItem(scene, ENVELOPE, 'fly'); // the envelope appears in the bubble, then flies out
    } catch (error) {
      clearInterval(cycle);
      showNote('failed'); // back to the form, still filled in
    }
  }

  input.addEventListener('input', clearNote);

  // Capture phase on the slot: this runs before, and replaces, the landing page's own submit
  // handler in script.js (which swaps the form for a plain thank-you line).
  slot.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (slot.dataset.state === 'sending') return;

      if (!input.value.trim() || !input.checkValidity()) {
        showNote('invalid');
        input.focus();
        return;
      }
      send();
    },
    true
  );
});

// ---------- "Show your world": the three photos fan out of the small photo in the phone ----------
// Start: stacked, tiny and unrotated, exactly over the photo in Alex's message. In view: each one
// springs to its place (move + scale + rotate together, slight overshoot), back photo first.
// Out of view: back to the stack, so it plays again next time. Reduced motion: final layout only.

const fanStage = document.querySelector('#world .stage');
const fanPhotos = [...fanStage.querySelectorAll('.fan')];
const FAN_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // overshoots by a few percent, then settles
const FAN_MS = 720;
const FAN_STAGGER = 70;
let fanAnimations = [];

// Where the small photo sits on the page, as a centre point and width in stage coordinates.
function fanOrigin() {
  const body = fanStage.querySelector('.device-body');
  const screen = fanStage.querySelector('.device-screen');
  const frame = screen.querySelector('iframe');
  const stageBox = fanStage.getBoundingClientRect();
  const bodyBox = body.getBoundingClientRect();
  const scale = screen.clientWidth / 390;

  // the small photo inside the prototype, in the prototype's own 390px-wide layout
  // (measured from the top of the conversation, whatever it has scrolled to)
  let x = 195;
  let y = 400;
  let width = 120;
  let exact = false;
  try {
    const doc = frame.contentDocument;
    const photo = doc.querySelector('.stack .photo');
    const scroller = doc.querySelector('.screen');
    if (photo && scroller && photo.offsetWidth) {
      scroller.scrollTop = 0; // show the top of the conversation, where that photo is
      // add up layout offsets rather than reading the painted box, so the answer is the same
      // whether or not the card is in the middle of its own pop-in
      let left = 0;
      let top = 0;
      for (let el = photo; el && el !== scroller; el = el.offsetParent) {
        left += el.offsetLeft + (el === photo ? 0 : el.clientLeft);
        top += el.offsetTop + (el === photo ? 0 : el.clientTop);
      }
      width = photo.offsetWidth;
      x = left + width / 2;
      y = top + photo.offsetHeight / 2;
      exact = true;
    }
  } catch (error) {
    // prototype not readable (still loading): fall back to the middle of the screen
  }

  // that point inside the phone's own box, then turned by the phone's slight tilt about its centre
  const matrix = new DOMMatrixReadOnly(getComputedStyle(body).transform);
  const fromCentre = new DOMPoint(
    screen.offsetLeft + screen.clientLeft + x * scale - body.offsetWidth / 2,
    screen.offsetTop + screen.clientTop + y * scale - body.offsetHeight / 2
  ).matrixTransform(new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d, 0, 0]));

  return {
    x: bodyBox.left + bodyBox.width / 2 + fromCentre.x - stageBox.left,
    y: bodyBox.top + bodyBox.height / 2 + fromCentre.y - stageBox.top,
    width: width * scale,
    exact, // false while the prototype hasn't drawn that photo yet
  };
}

// The stacked start transform for one photo: over the small photo, same size, no rotation.
function fanStart(photo, origin) {
  const dx = origin.x - (photo.offsetLeft + photo.offsetWidth / 2);
  const dy = origin.y - (photo.offsetTop + photo.offsetHeight / 2);
  return `translate(${dx}px, ${dy}px) rotate(0deg) scale(${origin.width / photo.offsetWidth})`;
}

function fanStack() {
  fanAnimations.forEach((animation) => animation.cancel());
  fanAnimations = [];
  const origin = fanOrigin();
  fanPhotos.forEach((photo) => {
    photo.classList.add('stacked');
    photo.style.transform = fanStart(photo, origin);
  });
  return origin.exact;
}

function fanOut() {
  const origin = fanOrigin();
  fanAnimations = fanPhotos.map((photo, index) => {
    const start = fanStart(photo, origin);
    const end = `translate(0px, 0px) rotate(${getComputedStyle(photo).getPropertyValue('--r') || '0deg'}) scale(1)`;
    photo.classList.remove('stacked'); // normal stacking order from the first frame of the motion
    photo.style.transform = ''; // the stylesheet's resting place takes over when the spring ends
    return photo.animate([{ transform: start }, { transform: end }], {
      duration: FAN_MS,
      delay: index * FAN_STAGGER, // DOM order is back to front, so the back photo goes first
      easing: FAN_SPRING,
      fill: 'backwards',
    });
  });
}

if (!skipMotion && 'IntersectionObserver' in window && fanPhotos.length) {
  let fanned = false;
  // the prototype draws a moment after the page: keep re-stacking until its photo can be measured
  if (!fanStack()) {
    let tries = 0;
    const retry = setInterval(() => {
      if (fanned || fanStack() || ++tries > 40) clearInterval(retry);
    }, 250);
  }
  addEventListener('resize', () => !fanned && fanStack());

  new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        fanned = false;
        fanStack();
      } else if (entry.intersectionRatio >= 0.55 && !fanned) {
        fanned = true;
        fanOut();
      }
    },
    { threshold: [0, 0.55] }
  ).observe(fanStage);
}
