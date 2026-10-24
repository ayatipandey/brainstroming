# Design

Frosted glass over a warm, softly blurred colour field, with bold tight type and one dark sheet for the next action. Palette derived from FIS.

## Colour

| Token | Value | Use |
|---|---|---|
| `--ground` | #f6f1ea | Warm neutral page |
| Field | apricot #f2a679, soft green #9fe28f, soft cyan #8fd3e2, soft rose #f0b4b8 | Blurred background only, never under text without glass |
| `--glass` | 72% white + 22px blur | Panels; text on it passes AA over every field colour |
| `--ink` / `--sheet` | #012834 | Text, the dark bottom sheet, primary dark buttons |
| `--ink-2` | #33494f | Secondary text, 5.5:1 or better everywhere |
| `--link` | #014a66 | Links and store names |
| `--green` | #4bcd3e | The lime moment: primary actions (ink text on it, 7.5:1), accents on the dark sheet |
| `--green-text` | #145010 | Green on light surfaces |
| Card tones | lime #d4f5c2, pink #f9d3d6, cyan #c7ecf3, sand #efe4d3 | Activity stack, favorite brands |

High contrast mode removes the field and glass and uses black on white.

## Type

Atkinson Hyperlegible Next (variable), 800 for headlines with -0.045 to -0.06em tracking. Display steps do not grow with the reader's text size, so headlines keep to two lines.

## Signature parts

- Logo: a deep-teal disc, an FIS-green arc that stops short, and a warm dot in the gap. No letters.
- Home: points with their dollar value, a tick-mark bar (points used against earned this year), the 14-day expiry clock, saved-from-expiring, a search pill, pill rows ending in round arrow buttons, and the dark "next best step" sheet with its reasons.
- Activity: used rewards as a 3D stack with scroll snap, or a plain list.
- A 3D coin (three.js, lazy) that turns with scroll, pointer and device tilt.

## Motion

Lazy and calm: the coin loads after the page settles and renders only while moving; the field drifts slowly; a reward card flies from Home to Activity when a payment applies it. Reduced motion (system or in-app) turns all of it off, and Activity opens as a list.
