# Design

The product is the exhibit. A plain white page frames a working wallet the way a gallery frames one object. Editorial, left aligned, generous space; motion is used once per idea.

## Color

| Token | Value | Use |
|---|---|---|
| `--white` | #ffffff | Page ground |
| `--paper` | #f5f4f1 | Warm grey fields, panels |
| `--paper-2` | #ecebe6 | Clock track on light, quiet fills |
| `--rule` | #dcd9d2 | Hairlines |
| `--ink` / `--field` | #012834 | Text, and the only dark field (stakes, wallet hero, footer) |
| `--ink-2` | #4f5752 | Secondary text, 7.6:1 on white |
| `--green` | #4bcd3e | Actions only; text on it is `--field` (7.6:1) |
| `--teal` | #015b7e | Links, default app accent |
| `--blue` | #285bc5 | Focus ring, alternate accent, model series |
| `--yellow` | #ffc845 | The expiry clock only |

High contrast mode swaps ink and fields to pure black and drops warm greys to white.

## Type

Atkinson Hyperlegible, 400 and 700, self-hosted. Display at 700 with -0.035em to -0.045em tracking and 0.92 to 0.98 line height; body 17px at 1.55. Headlines stay at two lines or fewer at every width and text size. Display steps (`--step-3` to `--step-5`) do not scale with the reader's text size; reading steps do.

## Shape and depth

Pill buttons, 20px UI fragments, 28 to 36px composition panels, 46px phone. No resting shadows, gradients or glass. Depth comes from overlap and parallax.

## Signature parts

- The 14-day expiry clock: one segment per day, yellow for days left.
- The phone frame with real UI inside, inert and described as one image.
- Reasons lists with score deltas, and a meter with the 70% bar marked.

## Motion

GSAP + ScrollTrigger with Lenis. One load sequence in the hero (headline words rise from masks, phone arrives, nudge lands), parallax on the phone and fragments, the stakes clock draining from 14 to 0 on scroll, a sticky engine stage that changes scene with a WebGL noise dissolve, clip-path reveals on feature compositions, and a guilloche line pattern on offer tiles that bends toward the pointer. All of it is skipped under reduced motion; content is visible without scripts running the motion.
