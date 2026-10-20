# The `compare` layer

`../index.html` is the landing page. It loads `../styles.css` and `../script.js` (the base sticker page) and then `compare.css` and `compare.js` from this folder, which hold everything added since: the phone frames with the embedded prototype, real photos, the type changes, the typing animation and the waitlist form's error note. The folder is called `compare` because this page started life as `landing-compare.html`, a side-by-side test of two phone frames; it has since replaced the old index, and the test toggle is gone.

## Waitlist form

There is no backend. A valid email swaps the form for a thank-you line (the handler in `../script.js`); an invalid one shows a note with a small sad flower under the input (`compare.js`). Nothing is sent or stored.

## Photos

Three files in `photos/`: `window.jpg`, `plants.jpg`, `room.jpg` (any shape; they are cropped to a square). The landing page stickers and the prototype screens both read these files. Until a file exists, the sticker shows a labelled grey slot and the prototype falls back to its illustration.

## Files

```
compare.css      the sticker phone, real-photo stickers, type and animation styles
compare.js       scaling the 390x844 prototype to the phone, typing, waitlist error note, photo fan-out
prototype.html   built copy of the prototype with the embed parameters below
prototype-src/   source of that copy (from ../../prelude/v3)
photos/          the three world photos
iphone-frame.png the iPhone mockup image (no longer used by the page)
```

## Prototype copy

`prototype.html` adds URL parameters the original does not have:

- `?screen=<id>` opens straight on a screen, without reading or saving progress. Ids are the tester panel's jump ids in `prototype-src/app.jsx` (`mirror` is "your flower"; `world` is a prelude with both answers and world photos, added for this page).
- `&loop=<ms>` restarts the screen every `<ms>`, and scrolls to the bottom halfway through, so it plays like a clip.
- `&name=<name>` shows the other person under a different name on the prelude screens (the page uses `alex`).
- `&bg=mint` gives the embedded screen a mint background (used for "your flower").
- `&photos=real` reads world photos from `photos/` (`window.jpg`, `plants.jpg`, `room.jpg`).

To rebuild after editing `prototype-src/` (run from `prototype-src`; it borrows the prototype project's installed packages):

```bash
ln -s ../../../prelude/node_modules node_modules && npx vite build --config vite.config.js && cp out/index.html ../prototype.html && rm -r out node_modules
```
