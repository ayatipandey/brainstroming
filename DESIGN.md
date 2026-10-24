# Design

Claret and brass on white. Editorial and quiet; the app is the hero, framed in a tilted phone.

## Color

| Token | Value | Use |
|---|---|---|
| `--ground` | #ffffff | Page |
| `--mist` / `--mist-2` | #f5f1f2 / #ebe4e6 | Soft fields, tracks |
| `--line` | #e2d9dc | Hairlines |
| `--ink` | #22161b | Text, 17.5:1 |
| `--ink-2` | #675a60 | Secondary text, 6.5:1 |
| `--claret` | #5b1531 | Primary actions, top pick, fields, footer |
| `--link` | #8a1f45 | Links and store names, 8.9:1 |
| `--brass` | #b8935a | Expiry ring and Gold tier; never text on white |
| `--brass-hi` | #e3c995 | Accent text on claret, 8.2:1 |
| Tier materials | #ebe4e6, #c9c7cb, #b8935a, #2a2d33 | Member, Silver, Gold, Platinum |

Chart: model #a3245a solid, rules #3f6db8 dashed (validated for color vision deficiency).

## Type

Atkinson Hyperlegible Next (variable), 400 body and 700 to 780 display, tracking -0.04em to -0.06em. Display steps do not grow with the reader's text size, so headlines stay at two lines.

## Shape

Pills for actions and filters, 22 to 30px radii for cards, 48px phone. No resting shadows, gradients or glass.

## Motion

GSAP ScrollTrigger with Lenis. CSS 3D only: the hero phone swings in and squares up as you scroll, a pile of reward cards stands up and sorts into the ranked list, a reward card turns over to its QR, the tier cards fan out of a stack, and points climb until Gold unlocks. All of it is off under reduced motion.
