# Brief v3 — real animation work, six real layouts

Supersedes `../v2/BRIEF.md`. Three corrections from Nathan, taken literally.

---

## 1. What was wrong with round two

**The six pages were one page in six colours.** Same header, same section order, same
components in the same places. A palette is not a design. Round three builds six genuinely
different layouts — different navigation models, different reading orders, different
compositional logic. If you screenshot them in greyscale they should still be
unmistakably different sites.

**The components wall was the wrong flex.** A toggle, a segmented control and a tooltip
prove competence, not imagination. Every hiring manager has seen a toggle. It is replaced
by **ten showpiece animations** whose only job is to be impressive and clearly difficult —
they don't have to come from Nathan's client work, because what's being demonstrated is
capability, not history.

**The process animation was too plain.** Nine rectangles sliding around is a diagram, not a
piece of motion design. The five-step structure stays — Nathan likes it — but it gets
**ten different visual treatments**, each a distinct way of drawing the same argument.

---

## 2. Influences (looked at, not copied)

Studios and sites reviewed for this round, with what was taken from each as *principle*:

| Source | Taken as influence |
|---|---|
| Mat Voyce × Uncommon Studio | Type with mass: letters stretch, snap and recombine, settling with inertia rather than an ease curve |
| Uncommon Studio | Section changes that read as camera moves rather than fades |
| By-Kin | Weighted scroll that makes a page feel like one continuous surface |
| Iventions | Objects lit like installations — reveal by lighting, not by opacity |
| Lusion, Active Theory, Resn | Ambition of scale: an effect that owns the whole viewport |
| Obys, Unseen | Editorial art direction carrying the motion, not decorating it |
| Basement Studio | Dense, confident dark surfaces with one loud accent |
| Cuberto, Dave Holloway | The cursor as an instrument, not a pointer |
| Bruno Simon, Patatap | Play — an effect that rewards messing with it |
| Codrops (gooey filters, morph transitions, shape overlays) | SVG filter stacks; morph targets sharing a point count |
| Codrops / Three.js text-displacement work | Pointer-driven displacement of glyphs, with chromatic split |
| Flowmap / grid-UV displacement demos | Velocity accumulation per cell with a decay back to rest |
| GSAP SplitText + Inertia patterns | Per-character staggering; flick-and-release momentum |
| Epic, BDSN Club | Typography that changes shape as you scroll |
| Hello Monday, Locomotive, Minh Pham | Restraint: one strong idea per screen |
| Apple / Stripe product pages | Scroll as a timeline you scrub, not a trigger you trip |
| Chrome scroll-driven animations work | `animation-timeline: view()` / `scroll()`, behind `@supports` |
| Linear, Vercel | Motion as product polish — fast, short, interruptible |

**Hard constraint that makes this interesting:** no libraries. No GSAP, no Three.js, no
Lenis. Canvas 2D, SVG, and modern CSS only, hand-written, no build step. Several of these
effects are normally reached for with WebGL; doing them in a few KB of canvas is itself
part of the argument.

---

## 3. The ten showpieces

Replacing the component wall. Each is a self-contained, interactive piece with a caption
naming the technique — the caption matters, because an impressive effect that a reader
can't attribute to skill is just a gif.

| # | Piece | What it does | Technique on show |
|---|---|---|---|
| 01 | **Gooey morph** | A word dissolves into blobs and reforms as the next word | SVG filter stack: blur → contrast matrix; merge thresholding |
| 02 | **Flow field** | Thousands of particles ride a noise field; the pointer cuts a vortex | Canvas 2D, value noise, trail compositing, velocity fields |
| 03 | **Grid displacement** | An image-grid shoves away from cursor velocity and relaxes back, with a chromatic split | Per-cell velocity accumulation and decay — a flowmap without WebGL |
| 04 | **Kinetic type** | A headline stretches, snaps and recombines as you scrub it | Per-character timeline with inertia and overshoot; variable-weight interpolation |
| 05 | **Spotlight stage** | A dark room of objects revealed by a light you carry, casting real directional shadows | Radial gradient mask + per-object shadow projection maths |
| 06 | **One line** | A single continuous stroke morphs through six drawings without ever lifting | Shared point-count path interpolation, computed per frame |
| 07 | **Type drum** | Words wrapped around a cylinder you flick and release | CSS 3D transforms, momentum with friction, snap-to-face |
| 08 | **Dot matrix** | A field of dots that flees the cursor and ripples outward when struck | Inverse-square repulsion, wave propagation over a lattice |
| 09 | **Chromatic text** | Glyphs tear into RGB channels under the cursor and heal behind it | Canvas glyph sampling, per-channel offset, displacement falloff |
| 10 | **Ribbon** | A tapering ribbon chases the pointer with spring physics and fades | Verlet chain, perpendicular extrusion, gradient stroke |

## 4. The ten "How I get it done" treatments

The five stages are fixed and good: **Understand → Prototype → Systemize → Build →
Ship & learn.** What changes is how they're drawn.

| # | Treatment | The visual argument |
|---|---|---|
| 01 | **Blocks** | Nine rectangles survive all five stages, rearranging — the original, retuned |
| 02 | **One line** | A single unbroken stroke redraws itself into each stage's diagram |
| 03 | **Isometric** | A structure built up plate by plate in axonometric projection |
| 04 | **Blueprint** | A plotter draws the stage with dimension lines and construction marks |
| 05 | **Conveyor** | The work travels left to right through five stations |
| 06 | **Orbit** | Five concentric rings; the live one energises and its artifacts orbit |
| 07 | **Film strip** | Frames slide past a gate, each one a small scene |
| 08 | **Terminal** | Code types on the left while the preview assembles on the right |
| 09 | **Swarm** | Six hundred canvas particles flock into five formations |
| 10 | **Graph** | A node network rewires itself between stages |

All ten share the stepper, captions, autoplay clock, transport and motion-switch behaviour,
because that chrome is correct already. Only the stage renderer changes.

## 5. The six layouts

Three per direction, structurally different — not restyled.

**Showcase** (the animation gallery leads)

- **S1 · Reel.** No hero. A full-viewport vertical reel, one showpiece per screen, with a
  fixed side counter and name. Scroll is the transport.
- **S2 · Bento.** A dense asymmetric grid of pieces at wildly different sizes under a
  kinetic masthead. Everything visible at once; the page is the contact sheet.
- **S3 · Console.** App-shell: a fixed left rail of the ten pieces, a single stage on the
  right that swaps with a camera-move transition. Reads as a tool, not a page.

**Demo** (one artifact leads)

- **D1 · Stage.** The demo owns the first viewport edge to edge; copy is pinned into the
  corners around it; everything else scrolls underneath.
- **D2 · Long-read.** A narrow editorial column — the demo, the process and the showpieces
  arrive as full-bleed figure breaks in the middle of the prose.
- **D3 · Control room.** A fixed identity panel on the left that never scrolls, a working
  surface on the right, instrument-panel chrome throughout.

## 6. Unchanged ground rules

Static HTML/CSS/JS, no dependencies, no build step. Keyboard-complete, designed focus
states. Every animation honours the motion switch from round two, with a useful static
state. No horizontal scroll at 320px. Canvas work pauses off-screen and when the tab is
hidden. Content facts remain placeholders until Nathan corrects them.
