# The `compare` layer

`../index.html` is the landing page. It loads `../styles.css` and `../script.js` (the base sticker page) and then `compare.css` and `compare.js` from this folder, which hold everything added since: the type changes, the turn's peeking flower, the walkers' path, the hero's typing dots, the waitlist form's error note and the demo video. The folder is called `compare` because this page started life as `landing-compare.html`, a side-by-side test of two phone frames; it has since replaced the old index, and the test toggle is gone.

## Waitlist form

There is no backend. A valid email swaps the form for a thank-you line (the handler in `../script.js`); an invalid one shows a note with a small sad flower under the input (`compare.js`). Nothing is sent or stored.

## Demo video

`../assets/demo/` holds the section "From a question to a walk": `demo.webm`, `demo.mp4` and `demo-poster.png`. They are recorded from the prototype project (`prelude/demo/`, see `prelude/demo/record.mjs`); replace all three together. The video plays only while it is on screen; with reduced motion it waits behind the poster with a play button (`compare.js`).

## Files

```
compare.css      type changes, the turn, the walkers, the waitlist form, the demo video
compare.js       FAQ heights, hero typing dots, waitlist error note, demo video play/pause
iphone-frame.png the iPhone mockup image (no longer used by the page)
```
