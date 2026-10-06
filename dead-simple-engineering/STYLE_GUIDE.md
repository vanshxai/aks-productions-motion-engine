# Style guide

## Copy
- Headline = one idea, max ~6 words, 2 lines. Wrap the emotional word in `*asterisks*` (renders serif italic, usually amber/cyan).
- Voice lines: plain, concrete, one fact per sentence. Use commas and full stops deliberately; they become audible pauses.
- Hero words (e.g. "Boil. Squeeze. Release. Expand.") get one-word headlines synced to the voice. Recap with "That's a ___."
- No jargon without drawing it first. Label parts in caps mono tags (EVAPORATOR, SHEAR LINE).

## Layout (1080×1920)
- Chapter HUD top-left ("HOW IT WORKS / NN"), figure counter top-right ("FIG.0N"), corner brackets, faint blueprint grid.
- Headline top third, main drawing centre (about 1000 px wide), tags/readouts below. Keep 60 px safe margin; Instagram UI covers the bottom ~250 px and right edge.
- Never let a tag overlap a moving part. Check every beat with stills.

## Motion
- Single continuous shot. Objects move, the camera does not (slow push-ins allowed). New thing every ~1.5–2 s.
- Draw-on: fills first, then outlines. Mask-up headline lines. No strobing: cap rotation to ~29°/frame.
- Colour carries meaning: cool blue/cyan = cold/low pressure, orange/amber = hot/high energy, green = OK, red = fault.

## Audio
- Music bed low and pulled back under hero words; SFX synthesized (clicks, whooshes, hums) and kept quieter than the voice.
- Run the `--stems` check in the soundtrack script; a phrase under 6 dB above the bed is flagged LOW and must be fixed.

## End card
Gear cluster, amber button tag "COMMENT ANYTHING ↓", "FOLLOW US TO RECEIVE IT", "AKS PRODUCTIONS".
