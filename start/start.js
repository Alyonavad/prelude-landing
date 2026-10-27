// "Start with yourself": three questions, a short "reading your answers" pause, a portrait from
// the answers, and a way to keep it.
// Loaded after script.js (FLOWER, the sticker template) and compare.js. The whole section is
// built here; index.html holds only its line, caption and an empty .start-steps.

(() => {
  const section = document.getElementById('start');
  if (!section) return;

  const box = section.querySelector('.start-box');
  const steps = section.querySelector('.start-steps');
  const live = section.querySelector('[data-start-live]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each answer carries a portrait type (A, B or C). It lives in the chip's data-type, never on screen.
  const QUESTIONS = [
    {
      q: 'When did you last feel completely at ease with someone?',
      chips: [
        ['A', 'Cooking together, barely talking'],
        ['B', 'Late at night, just the two of us'],
        ['C', 'With an old friend, picking up like no time passed'],
      ],
    },
    {
      q: 'Think of the last time you left somewhere early. What made you leave?',
      chips: [
        ['A', 'Everyone was performing'],
        ['B', 'It got too loud to hear anyone'],
        ['C', "I didn't know anyone and couldn't find a way in"],
      ],
    },
    {
      q: 'What do people usually get wrong about you at first?',
      chips: [
        ['A', "That I'm awkward. I'm just better doing something together"],
        ['B', "That I'm antisocial. I just like people one at a time"],
        ['C', "That I'm cold. I just take my time"],
      ],
    },
  ];

  const PORTRAITS = {
    A: ['you open up when your hands are busy', 'you think better side by side', 'small talk wears you out fast'],
    B: ['you need one person, not a crowd', 'loud rooms with no easy exit drain you', 'you need quiet to recharge'],
    C: ['people mistake your quiet for distance', 'you listen more than you talk', 'you warm up slowly, then stay'],
  };
  // the result card's fill: a new pick from the tag colours each time a result is shown
  const CARD_COLOURS = ['lilac', 'pink', 'butter', 'mint'];

  // "<T1>. <T2>, and <t3>." — the three tendencies as one paragraph
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const paragraph = ([t1, t2, t3]) => `${cap(t1)}. ${cap(t2)}, and ${t3}.`;

  // The flower in glasses: an overlay on the shared flower, drawn in the same coordinates (the face
  // is the 80-unit circle at 0,0). Light lenses, thin black frames, a glint on each lens, a smug
  // closed-eye look for the result, and a sparkle that catches the light once while it thinks.
  const SPECS = `
    <svg class="start-specs" viewBox="-114 -114 228 228" aria-hidden="true">
      <g class="specs-smug" fill="none" stroke="#05060f" stroke-width="3.3" stroke-linecap="round">
        <path d="M-22 1 q6 -6 12 0" /><path d="M10 1 q6 -6 12 0" />
      </g>
      <g fill="#dcefff" fill-opacity="0.55" stroke="#05060f" stroke-width="2.6">
        <circle cx="-16" cy="-1" r="13" /><circle cx="16" cy="-1" r="13" />
      </g>
      <g fill="none" stroke="#05060f" stroke-width="2.6" stroke-linecap="round">
        <path d="M-3.5 -3 q3.5 -3.5 7 0" /><path d="M-29 -3 l-9 -3" /><path d="M29 -3 l9 -3" />
      </g>
      <g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
        <path d="M-24 -6 q2 -4 6 -5" /><path d="M8 -6 q2 -4 6 -5" />
      </g>
      <path class="specs-sparkle" d="M26 -24 L28 -18 L34 -16 L28 -14 L26 -8 L24 -14 L18 -16 L24 -18Z" fill="#fff" stroke="#05060f" stroke-width="1.2" stroke-linejoin="round" />
    </svg>`;

  // ONE flower for the pause and the result. It floats over the steps (absolutely placed in the
  // box) and sits over an empty slot in whichever step is showing, so it can fly from the
  // thinking slot to the result slot instead of one flower fading out and another fading in.
  //   .start-flier  position, size, the flight (FLIP: a transform from where it was)
  //   .start-bob    the landing pop and the sway
  //   .start-tilt   the thinking tilt, straightening in flight, the proud head tilt
  const flier = document.createElement('div');
  flier.className = 'start-flier';
  flier.setAttribute('aria-hidden', 'true');
  flier.innerHTML = `
    <div class="start-bob"><div class="start-tilt"><div class="flower">${FLOWER}</div>${SPECS}</div></div>
    <span class="start-saved">saved.</span>`;

  const CHOSEN_MS = 250; // the chip stays black this long before the next question comes in
  const THINK_MS = 2000; // the "reading your answers" pause before the portrait
  const STEP_MS = 480; // the cross-fade between steps
  const FLY_MS = 900; // the "you" sticker
  const FLIGHT_MS = 700; // the flower, from "reading your answers" up to the result

  // the answers so far: { type, answer } per question, kept when going back
  let answers = [null, null, null];
  let current = 0; // 0, 1, 2 = questions; 3 = reading your answers; 4 = portrait
  let busy = false;

  const escape = (text) => text.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

  /* ---------- build the steps ---------- */

  QUESTIONS.forEach((item, n) => {
    const step = document.createElement('div');
    step.className = 'start-step start-ask';
    step.innerHTML = `
      <div class="start-top">
        <div class="start-progress">
          <button class="start-link start-back" type="button"${n === 0 ? ' hidden' : ''}>‹ Back</button>
          <span class="start-bars" aria-hidden="true">${[0, 1, 2].map((i) => `<i${i <= n ? ' class="on"' : ''}></i>`).join('')}</span>
          <span class="start-count" aria-hidden="true">${n + 1} of 3</span>
        </div>
      </div>
      <h3 class="start-question" tabindex="-1"><span class="sr-only">Question ${n + 1} of 3: </span>${escape(item.q)}</h3>
      <div class="start-chips" role="group" aria-label="Answers to question ${n + 1}">
        ${item.chips.map(([type, text]) => `<button class="start-chip" type="button" data-type="${type}" aria-pressed="false">${escape(text)}</button>`).join('')}
      </div>`;
    steps.append(step);
  });

  // the pause: the flower in glasses, thinking, and one line
  const thinking = document.createElement('div');
  thinking.className = 'start-step start-thinking';
  thinking.innerHTML = `
    <div class="start-flower-slot"></div>
    <p class="start-reading" tabindex="-1">Reading your answers…</p>`;
  steps.append(thinking);

  // Every paragraph the result can be (3 majorities + 6 mixes), stacked invisibly under the real
  // card, so the card's spot is always as tall as the longest one and nothing below ever moves.
  const ALL_RESULTS = [
    ...Object.values(PORTRAITS),
    ...['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'].map((order) => [...order].map((type, i) => PORTRAITS[type][i])),
  ].map(paragraph);

  const portrait = document.createElement('div');
  portrait.className = 'start-step start-portrait';
  portrait.innerHTML = `
    <h3 class="start-title" tabindex="-1">HERE'S WHAT WE NOTICED.</h3>
    <div class="start-proud start-flower-slot"></div>
    <div class="start-result">
      ${ALL_RESULTS.map((text) => `<p class="tag start-card start-ghost" aria-hidden="true">${text}</p>`).join('')}
      <p class="tag start-card start-real"></p>
    </div>
    <div class="start-keep">
      <div class="start-keep-form">
        <p class="start-line">Want to keep this?</p>
        <p class="start-caption">We'll save your answers for when Prelude opens. You won't start from zero.</p>
        <div class="waitlist-slot start-slot">
          <form class="waitlist" novalidate>
            <label class="sr-only" for="email-start">Email</label>
            <input id="email-start" type="email" name="email" placeholder="Your email" autocomplete="email" required />
            <button class="pill pill-black" type="submit">Save my place</button>
          </form>
          <div class="waitlist-note" role="alert" hidden>
            <p>Hmm, that email doesn't look right.</p>
          </div>
        </div>
        <button class="start-link start-over" type="button">Start over</button>
      </div>
      <div class="start-keep-done">
        <p class="start-line">See you when it's your turn.</p>
        <p class="start-caption">Your answers are waiting for you in the app. No newsletters, just one email when Prelude opens.</p>
        <button class="start-link start-over" type="button">Start over</button>
      </div>
    </div>`;
  steps.append(portrait);

  const stepEls = [...steps.children];
  stepEls[0].classList.add('is-current');
  box.append(flier);

  // put the flower over a slot (layout offsets, so the steps' own slide-in doesn't skew it)
  function place(slot) {
    flier.style.left = `${slot.offsetLeft}px`;
    flier.style.top = `${slot.offsetTop}px`;
    flier.style.width = `${slot.offsetWidth}px`;
  }
  const slotOf = (n) => stepEls[n].querySelector('.start-flower-slot');
  addEventListener('resize', () => current >= 3 && place(slotOf(current)));

  /* ---------- moving between steps ---------- */

  function show(next, plain = false) {
    const from = stepEls[current];
    const to = stepEls[next];
    from.classList.remove('is-current');
    if (!reduced && !plain) {
      from.classList.add(next > current ? 'is-leaving' : 'is-leaving-back');
      to.classList.add(next > current ? 'is-coming' : 'is-coming-back');
      void to.offsetWidth; // start the incoming step from its offset, then let it settle
      to.classList.remove('is-coming', 'is-coming-back');
      setTimeout(() => from.classList.remove('is-leaving', 'is-leaving-back'), STEP_MS);
    }
    to.classList.add('is-current');
    current = next;

    if (next < 3) {
      flier.className = 'start-flier'; // no flower on the questions
      // the earlier choice, if any, shows as selected
      to.querySelectorAll('.start-chip').forEach((chip) => {
        const chosen = answers[next] && answers[next].answer === chip.textContent;
        chip.setAttribute('aria-pressed', String(!!chosen));
      });
      live.textContent = `Question ${next + 1} of 3. ${QUESTIONS[next].q}`;
      to.querySelector('.start-question').focus({ preventScroll: true });
    } else if (next === 3) {
      // a short pause before the portrait (kept with reduced motion too, just without the motion)
      busy = true;
      place(slotOf(3));
      flier.className = 'start-flier is-thinking';
      live.textContent = 'Reading your answers…';
      to.querySelector('.start-reading').focus({ preventScroll: true });
      setTimeout(takeOff, THINK_MS);
    } else {
      fillPortrait();
      to.querySelector('.start-title').focus({ preventScroll: true });
    }
  }

  // The pause ends in three beats, then the result:
  //   1. straighten: the thinking tilt stops and the flower comes upright (thinking face still)
  //   2. aha: the face crossfades to the proud smile, with a small hop and the glint on the glasses
  //   3. the flight: the caption fades as it takes off, and it flies up to its result spot, already
  //      smiling, landing with a small settle and then the sway
  // The title, the card and the email block follow the landing (their delays are in start.css).
  const STRAIGHTEN_MS = 250;
  const AHA_MS = 350;

  const tiltOf = () => flier.querySelector('.start-tilt');
  const angleOf = (el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return (Math.atan2(m.b, m.a) * 180) / Math.PI;
  };
  let tiltAnim = null;

  function takeOff() {
    if (reduced) {
      // the expression simply changes, then the flower fades to its result spot
      flier.className = 'start-flier is-aha';
      setTimeout(flyUp, AHA_MS);
      return;
    }
    const tilt = tiltOf();
    const angle = angleOf(tilt);
    flier.className = 'start-flier is-straight'; // the tilt stops where it is...
    tiltAnim = tilt.animate([{ transform: `rotate(${angle}deg)` }, { transform: 'rotate(0deg)' }], { duration: STRAIGHTEN_MS, easing: 'ease-out', fill: 'forwards' }); // ...and comes upright
    tiltAnim.finished.then(aha); // each beat starts when the one before has finished
  }

  function aha() {
    flier.className = 'start-flier is-aha'; // the face crossfades to proud; the glasses glint (start.css)
    flier
      .querySelector('.start-bob')
      .animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.45 }, { transform: 'scale(1)' }], { duration: AHA_MS, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' })
      .finished.then(flyUp);
  }

  function flyUp() {
    const from = { x: flier.offsetLeft, y: flier.offsetTop, w: flier.offsetWidth };
    show(4, true); // the caption fades as it takes off
    place(slotOf(4));
    const to = { x: flier.offsetLeft, y: flier.offsetTop, w: flier.offsetWidth };
    const land = () => {
      if (tiltAnim) tiltAnim.cancel(); // the proud head tilt in start.css takes over, at the same angle
      tiltAnim = null;
      flier.className = `start-flier is-proud${portrait.classList.contains('is-saved') ? ' is-saved' : ''}`;
      busy = false;
    };
    if (reduced) {
      flier.style.opacity = '0';
      setTimeout(() => {
        land();
        flier.style.opacity = '';
      }, 300);
      return;
    }
    flier.className = 'start-flier is-flying';
    if (tiltAnim) tiltAnim.cancel();
    tiltAnim = tiltOf().animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-6deg)' }], { duration: FLIGHT_MS, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' });
    flier
      .animate([{ transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.w / to.w})` }, { transform: 'none' }], {
        duration: FLIGHT_MS,
        easing: 'cubic-bezier(0.45, 0, 0.25, 1.18)', // ease in and out, overshooting a touch at the end
      })
      .finished.then(land);
  }

  // a small white "you" sticker with the answer floats up from the chip and fades away
  function fly(chip) {
    if (reduced) return;
    const boxRect = box.getBoundingClientRect();
    const rect = chip.getBoundingClientRect();
    const sticker = document.createElement('div');
    sticker.className = 'start-fly';
    sticker.setAttribute('aria-hidden', 'true');
    sticker.innerHTML = `<span>you</span>${escape(chip.textContent)}`;
    box.append(sticker);
    sticker.style.left = `${rect.left - boxRect.left + rect.width / 2 - sticker.offsetWidth / 2}px`;
    sticker.style.top = `${rect.top - boxRect.top + rect.height / 2 - sticker.offsetHeight / 2}px`;
    sticker
      .animate(
        [
          { transform: 'translateY(0) rotate(-2deg) scale(0.92)', opacity: 0 },
          { transform: 'translateY(-24px) rotate(-4deg) scale(1)', opacity: 1, offset: 0.2 },
          { transform: 'translateY(-150px) rotate(-8deg) scale(0.96)', opacity: 0 },
        ],
        { duration: FLY_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      )
      .finished.then(() => sticker.remove());
  }

  steps.addEventListener('click', (event) => {
    const chip = event.target.closest('.start-chip');
    const back = event.target.closest('.start-back');
    const over = event.target.closest('.start-over');

    if (chip && !busy) {
      busy = true;
      const n = current;
      answers[n] = { type: chip.dataset.type, answer: chip.textContent };
      chip.parentNode.querySelectorAll('.start-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      setTimeout(() => {
        fly(chip);
        busy = false;
        show(n + 1);
      }, CHOSEN_MS);
    } else if (back && !busy && current > 0 && current < 3) {
      show(current - 1);
    } else if (over && !busy) {
      startOver();
    }
  });

  /* ---------- the portrait ---------- */

  // the majority type; if all three differ, a mix: the 1st tendency of the Q1 type, the 2nd of
  // the Q2 type and the 3rd of the Q3 type
  function portraitOf(list) {
    const counts = {};
    list.forEach(({ type }) => (counts[type] = (counts[type] || 0) + 1));
    const major = Object.keys(counts).find((type) => counts[type] >= 2);
    if (major) return { portraitType: major, tendencies: PORTRAITS[major] };
    return { portraitType: 'mixed', tendencies: list.map(({ type }, i) => PORTRAITS[type][i]) };
  }

  function fillPortrait() {
    const { tendencies } = portraitOf(answers);
    const card = portrait.querySelector('.start-real');
    card.textContent = paragraph(tendencies);
    CARD_COLOURS.forEach((colour) => card.classList.remove(colour));
    card.classList.add(CARD_COLOURS[Math.floor(Math.random() * CARD_COLOURS.length)]);
    live.textContent = `Here's what we noticed. ${paragraph(tendencies)}`;
  }

  /* ---------- keeping it: the email step ---------- */

  // SIMULATED. This is where the backend call goes: send the email and the answers, resolve when
  // they are stored, reject on failure. For now it waits a moment and resolves.
  function saveAnswers(payload) {
    return new Promise((resolve) => setTimeout(() => resolve(payload), 600));
  }

  const keep = portrait.querySelector('.start-keep');
  const form = portrait.querySelector('form');
  const input = form.querySelector('input');
  const submit = form.querySelector('button');
  const note = portrait.querySelector('.waitlist-note');

  // the same behaviour as the waitlist form: the note shows under the input
  // on a bad email, and goes again as soon as the person types
  input.addEventListener('input', () => (note.hidden = true));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input.value.trim() || !input.checkValidity()) {
      note.hidden = false;
      input.focus();
      return;
    }
    note.hidden = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const { portraitType, tendencies } = portraitOf(answers);
    saveAnswers({
      email: input.value.trim(),
      answers: answers.map(({ type, answer }, i) => ({ question: QUESTIONS[i].q, answer, type })),
      portraitType,
      tendencies,
    }).then(() => {
      form.removeAttribute('aria-busy');
      keep.classList.add('is-done');
      portrait.classList.add('is-saved');
      flier.classList.add('is-saved');
      live.textContent = "Saved. See you when it's your turn.";
      keep.querySelector('.start-keep-done .start-over').focus({ preventScroll: true });
    });
  });

  function startOver() {
    answers = [null, null, null];
    keep.classList.remove('is-done');
    portrait.classList.remove('is-saved');
    flier.classList.remove('is-saved');
    form.reset();
    submit.disabled = false;
    note.hidden = true;
    show(0);
  }
})();
