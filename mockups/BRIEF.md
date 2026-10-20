# Brief: nmoore.net redesign — engineer-first portfolio

*Written as the working prompt for this exploration. Nathan reviews and corrects it; the
mockups in this folder are built from it.*

---

## 1. The job to be done

Nathan Moore is a **senior software engineer with an emphasis in front-end / UI / UX**.
The site he has today does not say that. It says *"independent web partner for lean B2B
marketing teams"* — services, process steps, engagement tiers, an inquiry form. That is a
freelance-agency site. It sells a relationship.

The site he wants sells a **person's skill**. A hiring manager, a staff engineer running a
loop, or a founder looking for someone to own the front end should land on it and conclude
within about ten seconds: *this person is unusually good at building interfaces.*

**The core constraint he set: "more basic."** Not plainer in craft — plainer in *structure*.
Less scaffolding, fewer sections, less marketing voice, less to scroll past before the
evidence arrives.

## 2. The central design problem

There is a real tension to solve, and every mockup is an answer to it:

> How do you prove exceptional front-end ability on a page that is deliberately simple?

The naive answers both fail:

- **Loud and maximal** (parallax, WebGL, scroll-jacking) reads as a 2016 agency site. It
  signals *effort*, not *judgment*. Senior engineers read it as a lack of taste.
- **Bare and minimal** (a text file with links) is honest but proves nothing. Anyone can
  ship a `<ul>`.

The resolution: **a simple structure executed at a level of precision that is itself the
portfolio.** Restraint everywhere, with a small number of places where the craft is
unmistakable and *useful* — not decorative. The page should be the work sample.

Concretely, that means the page must get right the things only a strong front-end engineer
gets right, and which a reviewer will notice without being told:

- Real typographic rhythm — a type scale, consistent optical spacing, hanging punctuation,
  sane measure (~65ch), correct `font-feature-settings` for numerals in tables.
- Focus states that are designed, not browser default. Full keyboard operability.
- Motion that is short, interruptible, and gated behind `prefers-reduced-motion`.
- Light and dark that are both authored, not one inverted.
- Layouts that hold from 320px to ultrawide with no horizontal scroll and no media-query
  sprawl — container queries, `clamp()`, intrinsic grid.
- No layout shift on load. No font flash. Fast on a cold cache.
- Semantics that are correct because they are correct: `<time datetime>`, real headings,
  real landmarks, labelled controls.

## 3. Audience and what they need, in order

Primary: **engineering hiring managers and senior/staff engineers** evaluating him.
Secondary: founders and design-engineering leads. Tertiary: people who still want to hire
him for client work (today's audience — do not actively repel them, but stop leading with
them).

What they look for, roughly in this order:

1. **Who is this and what level?** — name, title, seniority, current/recent context.
2. **What have they actually built?** — named work, with the *specific role* Nathan played.
3. **How good is the execution?** — judged from the page itself as much as the links.
4. **Can I see it running?** — live demos beat screenshots beat descriptions.
5. **How do I reach them?** — one obvious channel, no form funnel.

Everything else — process diagrams, service tiers, engagement options — is cut.

## 4. Content inventory (real, from the existing site)

**Work:** Recurly (detailed UI development; animated charts, graphs, maps; mobile layout
solutions) · ForAllSecure (technical storytelling, animation, site development) ·
Four Winds Interactive · Mathews Inc. · SeriesFest · Ideaison · Freebird Boots ·
Punch Bowl Social.

**Interactive studies:** the existing `/work/recurly/` and `/work/forallsecure/` motion
studies, and the five `/concepts/` prototypes. These are the strongest asset on the site
for this new positioning and are currently buried — they should be promoted.

**Writing:** ten articles under `/insights/`. Note: they are written for *marketing
leaders*, not engineers. Keep the section, retitle the framing, and expect that over time
the strongest engineering-audience posts will be new ones.

**Facts:** Colorado-based, building for the web since 2014 (~12 years), works across
design and implementation. LinkedIn: `/in/nateisgreat`.

## 5. Non-goals and anti-goals

**Non-goals:** a CMS or build step (the repo is static HTML/CSS/JS on GitHub Pages — keep
it that way); a blog redesign; a logo change; SEO-driven service pages.

**Anti-goals — the things that would make this a failure even if it shipped:**

- Reading as a *freelancer looking for leads* rather than an engineer with a craft.
- Any decorative animation that costs more than it communicates.
- A homepage that requires three screens of scrolling before a named project appears.
- Screenshots where a live demo was possible.
- Visible AI-generated copy voice — the breathless parallel-construction marketing cadence
  the current site has ("Standout websites. Clear product stories.").
- An accessibility failure anywhere. For this positioning it is not a bug, it is a
  disqualification.

## 6. How the five directions differ

Each is a different *bet* about what the strongest proof is. They are not variations on a
theme; they are five arguments.

| # | Direction | The bet | Proof mechanism |
|---|-----------|---------|-----------------|
| 01 | **Plain Text** | Confidence is the signal. | Typographic precision at near-zero chrome; the restraint is the flex. |
| 02 | **The Split** | Structure is the signal. | Sticky identity rail + scroll-spy index; an interaction system executed perfectly. |
| 03 | **Craft Grid** | Volume of built things is the signal. | Homepage is a wall of *live, running* micro-components, not images. |
| 04 | **Spec Sheet** | Rigor is the signal. | Engineering-document aesthetic: dense tables, tabular numerals, measured data. |
| 05 | **One Big Demo** | A single undeniable artifact is the signal. | One genuinely hard interactive piece above an otherwise plain page. |

## 7. Shared ground rules for all five

- Static HTML/CSS/JS, no dependencies, no build step. Each mockup is one self-contained file.
- Authored light **and** dark via `prefers-color-scheme`, plus a manual toggle where it fits.
- `prefers-reduced-motion` respected in every direction.
- Keyboard-complete. Visible, designed focus rings.
- Works at 320px. No horizontal scroll at any width.
- Real content from §4 — no lorem, no invented clients, no fabricated metrics.
- Contact is a link, not a funnel.

## 8. What "done" looks like for this exploration

Five mockups Nathan can open, click, resize, and tab through — enough to react to, with the
reaction being *"that one, but…"*. Not production code. Picking a direction comes next;
the chosen one gets built properly against the real content.
