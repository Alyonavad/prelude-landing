# Prelude · landing page

The Prelude landing page: a scroll story told by a flower sticker, ending in a waitlist form.

- Plain HTML, CSS and JS. No build step, no dependencies, no backend.
- Nine scenes, each about one viewport tall, plus a footer FAQ.
- Illustration is inline SVG, plus three photos in `compare/photos/`; fonts load from `fonts/`. Nothing is fetched from another site.
- The waitlist form has no backend: the request is simulated in `joinWaitlist()` in `compare/compare.js`. Nothing is sent or stored.

## Run locally

Open `index.html` in a browser, or serve the folder (run from this folder):

```bash
npm run dev
```

## Deploy (static site)

The folder itself is the site, so there is nothing to build. Run one of these from this folder.

```bash
npm run deploy
```

```bash
npm run deploy:netlify
```

The first is Vercel, the second Netlify; each asks you to log in on the first run. You can also drag this folder onto https://app.netlify.com/drop.

## How the motion works

There is no scroll-snapping or scroll-jacking. `script.js` gives every `.scene` a `--p` value from its scroll position: 0 as the scene's top enters the bottom of the viewport, 0.5 when it fills the viewport, 1 as it leaves the top. All motion is CSS `calc()` on `--p` in `styles.css`, so it plays forward and backward at the reader's pace.

- `.rise` (text) and `.pop` (stickers) take `--at`, the `--p` value at which they start arriving. `.pop` also takes `--dx` / `--dy`, where it arrives from.
- The flower takes `--fold` (0 open, 1 bud), `--eyes` (0 closed, 1 open) and `--look` (-1 to 1, face shifts left or right). Each scene sets these from `--p`.
- The page background drains to grey through scene 3 and returns in scene 4 (`--grey`, set in `script.js`).
- With `prefers-reduced-motion`, scroll animation is off and every scene shows its settled state.

## Structure

```
index.html   scenes and copy
styles.css   base styles: type, pills, tags, flower states, per-scene scroll motion
script.js    sticker templates (flower, bubble, moon, pixel face), scroll progress
compare/     the second layer loaded by index.html: compare.css, compare.js, the embedded
             prototype (prototype.html, built from prototype-src/) and photos. See compare/README.md
assets/      the source sticker SVGs; script.js carries inline copies of them
fonts/       Dharma Gothic E Heavy (big titles), Bebas Neue (scene lines), Anton (tags, buttons), Nority-Demo (wordmark)
```

## Notes

- Stickers are placed inside a `.stage` with `--x`, `--y` (position) and `--w` (width) in percent, and `--r` for rotation.
- The "is it safe?" FAQ answer is a draft and needs real copy.
- Font licences: Anton and Bebas Neue are open source (SIL OFL). Dharma Gothic E is a commercial font and Nority-Demo is a demo; both need a web licence before the page goes public.
- `fonts/Boldnova-Demo.otf` is no longer used.
- No longer used by the page: `assets/flower.svg`, `fonts/DMSerifDisplay-Regular.ttf`, `fonts/Boldnova-Demo.otf` (still used by the prototype copy's source), `compare/iphone-frame.png`.
- The photos in `compare/photos/` and `compare/iphone-frame.png` are placeholders, not licensed for publishing.
