// The landing page's second script (index.html loads it after script.js): prototype clips,
// typing, the waitlist form's error note and the photo fan-out.

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

// ---------- Waitlist form ----------
// A valid email is left to the submit handler in script.js, which swaps the form for the
// thank-you line. An invalid one shows the note with the sad flower under the input instead.

const skipMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('.waitlist-slot').forEach((slot) => {
  const input = slot.querySelector('input[type="email"]');
  const note = slot.querySelector('.waitlist-note');

  note.querySelector('.flower').innerHTML = FLOWER; // the sticker template in script.js

  input.addEventListener('input', () => (note.hidden = true));

  // Capture phase, so this runs before script.js's handler on the form itself.
  slot.addEventListener(
    'submit',
    (event) => {
      if (input.value.trim() && input.checkValidity()) {
        note.hidden = true;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      note.hidden = false;
      input.focus();
    },
    true
  );
});

// Keyboard focus only: the form's dashed outline shows while Tab is in use, not after a click.
addEventListener('keydown', (event) => {
  if (event.key === 'Tab') document.documentElement.dataset.keyboard = '';
});
addEventListener('pointerdown', () => delete document.documentElement.dataset.keyboard);

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
