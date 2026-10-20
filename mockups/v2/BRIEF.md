# Brief v2 — build out Craft Grid and One Big Demo

*Working prompt for round two. Round one is in `../BRIEF.md`; this supersedes it for the
two surviving directions.*

---

## 1. What was decided

Nathan picked **03 Craft Grid** and **05 One Big Demo** out of the five. Both are
engineer-first: they prove ability by running, not by describing. Round two takes each one
seriously — three fully-built variants apiece, six pages total.

The positioning from round one stands: **senior software engineer, front-end / UI / UX
emphasis.** Not a freelance services site. The reader is a hiring manager or a senior
engineer, and the page itself is the work sample.

## 2. What changes in round two

Round one was deliberately restrained — the brief said "restraint is the flex." Nathan's
direction now pushes the other way: **unique and creative**, with real animation work on
display. So the new rule is not *less*, it is **earned**:

> Every animated thing on these pages must be doing a job — teaching, revealing structure,
> showing state, or demonstrating a technique that is itself the credential. Decoration
> that could be deleted without loss gets deleted.

That is the line between "shows off" and "shows". A hiring manager should finish the page
thinking *this person can build anything I need*, not *this person likes plugins*.

## 3. Direction constraints Nathan set

1. **Three variants per direction, six pages.** Same bones per direction, genuinely
   different palettes and personality — not a hue-rotate.
2. **Dark-dominant, not dark-exclusive.** Each page carries at least one substantial
   light-background section or component. The dark/light switch is a *composition* device:
   it should mark a change of register (the loud part vs. the quiet part), not just happen.
3. **Three to five signature animations/graphics**, the best work on display.
4. **One of them is "How I get it done"** — a multi-step, genuinely complex process
   animation. This is the centerpiece and gets the most craft.
5. **Case studies stay themed in the client's own colors**, the way `/work/recurly/` and
   `/work/forallsecure/` already are. Bring that idea forward onto the homepage: selecting
   a project re-themes its surroundings into that company's palette.

## 4. The signature set

Five pieces, built once in `shared/`, themed by CSS custom properties so each variant
re-skins them without forking the code. Building them shared is itself part of the
argument: it is how a component system is supposed to work.

| # | Piece | Job it does | Technique on show |
|---|-------|-------------|-------------------|
| 1 | **Process** — "How I get it done" | Explains the actual working method in five stages | State-driven SVG choreography, staggered timing, scrub + autoplay, interruptible |
| 2 | **Company morph** | Project switcher that re-themes the page into the client's palette and morphs its data chart | Animated custom properties, `@property`, shared-element feel without a framework |
| 3 | **Masthead field** | Makes the name arrive with intent instead of just existing | Per-character mask reveal, slow generative background field, CSS-only after load |
| 4 | **Reflow** | Proves responsive mastery concretely | Container queries + pointer capture + keyboard-operable resize |
| 5 | **Craft wall** | Breadth — many small interactions, all live | Springs, FLIP-free measured indicators, `::details-content`, pointer capture |

Pieces 1–3 appear on every page. Piece 4 leads the One Big Demo variants; piece 5 leads
the Craft Grid variants. Each direction therefore shares a spine but leads with its own
argument.

### 4.1 "How I get it done" — the five stages

A single SVG stage, five states, each a visibly different drawing that *transforms into*
the next rather than cross-fading:

1. **Understand** — scattered fragments of a request converge into one sentence. The point:
   the work starts by deciding what the thing actually is.
2. **Prototype** — that sentence becomes a rough wireframe, laid out in the browser rather
   than argued about in a comment thread.
3. **Systemize** — the wireframe breaks into tokens — color, type scale, spacing — and
   recomposes as one component at three sizes.
4. **Build** — the component fills with real content while correctness lands beside it:
   contrast, focus order, keyboard path, weight budget.
5. **Ship & learn** — it goes live, real use draws a chart, and an arrow loops back to 1.

Autoplay with a progress ring, clickable stages, pause, and a static end-state under
`prefers-reduced-motion`. It must be interruptible at any frame — a process animation you
cannot steer is a video.

## 5. Palettes

Dark-dominant, each with a named light register. Distinct in hue *and* in temperature,
contrast ratio, and texture, so they read as different products.

**Craft Grid variants**

- **A — Acid Lab.** Near-black graphite, acid lime signal, bone-white light sections.
  Clinical, high-contrast, laboratory.
- **B — Ember.** Warm brown-black, ember orange and dusty gold, cream light sections.
  Analog, printerly, human.
- **C — Cyanotype.** Midnight navy, electric cyan, pale blue-white light sections.
  Technical, blueprinty, cold.

**One Big Demo variants**

- **D — Dusk.** Deep plum-indigo, lavender and soft gold, warm paper light sections.
  (Nods to Recurly's own plum without copying it.)
- **E — Signal.** Charcoal, signal red into amber, oat light sections. Editorial, urgent.
- **F — Deepwater.** Deep teal-black, mint and sand, sand light sections. Calm, marine.

Every palette must clear WCAG AA for body text in both its dark and light registers.

## 6. Client palettes (from the real case studies)

Taken from `/work/*/style.css` where they exist; the rest are drawn from each brand's own
identity.

| Client | Core | Secondary |
|--------|------|-----------|
| Recurly | `#24152f` plum | `#9161c5` purple, `#d3adf1` lilac, `#9de4cc` teal |
| ForAllSecure | `#183536` ink | `#94dfc4` teal, `#ff947e` coral |
| Four Winds Interactive | `#0b2b45` deep blue | `#2fb6e8` cyan |
| Mathews Inc. | `#101210` black | `#8a9a33` olive, `#e0532f` orange |
| SeriesFest | `#160d1c` violet-black | `#e8356d` magenta, `#f2c14e` gold |

## 7. Non-negotiables (carried from round one)

- Static HTML/CSS/JS. No dependencies, no build step. Shared files, not copy-paste.
- Keyboard-complete; designed focus states; correct roles and live regions.
- `prefers-reduced-motion` honoured by every animation — with a *useful* static state, not
  a blank one.
- No horizontal scroll at 320px. No layout shift on load.
- Animation runs on `transform`, `opacity`, and registered custom properties. Nothing
  animates `width`/`top`/`left` on a hot path.
- Real content only. Placeholder facts (titles, date ranges) stay flagged as placeholders.

## 8. Anti-goals

- Scroll-jacking, or any animation that blocks reading.
- A process animation that is really a looping video — it must be steerable.
- Six pages that are one page with the hue rotated.
- Motion without a reduced-motion path. On a portfolio that claims accessibility, that is
  a disqualification, not a bug.
