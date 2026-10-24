// The landing page's second script (index.html loads it after script.js): the FAQ heights,
// the hero's typing dots, the waitlist form's error note and the demo video.

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

// ---------- the demo video: plays only while on screen ----------
// Paused off screen to save battery. Reduced motion: no autoplay; the poster waits with a play
// button, and the video plays only when asked (still pausing when scrolled away).

const demoVideo = document.querySelector('.demo-video video');
const demoPlay = document.querySelector('.demo-play');

if (demoVideo) {
  let wanted = !skipMotion; // reduced motion: only after the play button

  if (skipMotion) {
    demoVideo.removeAttribute('autoplay');
    demoVideo.load(); // back to the poster, in case autoplay had already started it
    demoPlay.hidden = false;
    demoPlay.addEventListener('click', () => {
      wanted = true;
      demoPlay.hidden = true;
      demoVideo.play().catch(() => {});
    });
    demoVideo.addEventListener('click', () => {
      wanted = false;
      demoVideo.pause();
      demoPlay.hidden = false;
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && wanted) demoVideo.play().catch(() => {});
        else demoVideo.pause();
      },
      { threshold: 0.25 }
    ).observe(demoVideo);
  }
}
