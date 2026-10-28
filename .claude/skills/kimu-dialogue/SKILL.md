---
name: kimu-dialogue
description: Write and voice-direct dialogue for "The Adventures of Kimu" (1-minute English cartoon episodes). Use before writing or changing any spoken line, narration, or voice settings.
---

# Kimu dialogue and voice direction

Run this checklist BEFORE writing lines for a new episode, and again before rendering.

## Principles (from screenwriting craft)
1. Start mid-moment. No greetings, goodbyes, or "As you know". Enter late, leave early.
2. Speak in fragments. Real people interrupt, trail off, repeat a word, restart. Full tidy sentences read as written, not spoken.
3. Say less. A line that only repeats what the picture already shows gets cut. Silence is a line: use a 0.5 to 1 s beat after the loudest moment.
4. Subtext over statement. Characters rarely say what they feel. Anger covers fear; "go to sleep" can mean "I love you".
5. Each character has a verbal fingerprint (below). Cover the names: you should still know who is talking.
6. One idea per line, one breath per phrase. If it cannot be said in one breath, split it with a pause or an em dash.
7. Read it aloud and time it. Spoken seconds, not word count, decide if it fits the beat.
8. Every exchange has tension or a turn. If nothing changes between first and last line, cut it.

## Characters
| Who | Sounds like | Fingerprint | Never |
|---|---|---|---|
| Kimu (early 20s) | Light, quick, unsure | Stammers when caught ("I— I'm"), trails off, short fibs | Long speeches, jargon in conversation |
| Dad (50s) | Deep, gravelly, slow | 1 to 5 words. Names him flatly ("Kimu."). Commands, not explanations. Anger is quiet then one bark. Care comes out as an order ("Go to sleep.") | Career roadmaps, lectures, praise out loud |
| Mom (40s) | Soft, warm | Starts with "Hey" or "Please", asks nothing, defuses | Taking sides loudly |
| Uncle (60s) | Big, warm, loud | Laughs into words ("Ha!"), calls Kimu "kid" | Being formal |
| Narrator | Calm, dry, close, British storyteller | Plain, concrete, short sentences, explains the engineering with one everyday comparison (water, traffic) | Echo or reverb, baby talk, jokes at Kimu's expense |

## Rules for this series
- English only. No Hindi or romanised Hindi words (validate_packet.py checks).
- Engineering is explained by the narrator in 4 to 6 short lines per episode, each under 4.3 s spoken, each matching one on-screen infographic.
- Family scenes carry feeling, not information. Dad never explains himself.
- Emotional arc in the first 20 s: surprise, fear, anger, deflation, tenderness. Change emotion every line.
- Hook in the first 3 s, payoff line in the last 3 s ("Small proof. Big start.").

## Voice direction (scripts/studio/kimu_voice.py)
- Pick an `emo` per line: neutral calm warm stern sad worried scared annoyed angry shout joy relieved whisper narrate.
- Punctuation is direction: `.` lands (pitch falls), `?` rises, `,` keeps going, `...` is a held, longer pause, `—` is an interruption (voice cut off, no landing).
- Spell stammers: "I— I'm", "N-nothing". Use one-word lines for impact ("Kimu.").
- Keep each phrase to about 2 to 6 words. The engine speaks phrase by phrase and redraws pitch for each.
- Check numbers after building: `f0_std_st` in each voice json should be 3 to 6 for living speech; under 2 is monotone.
- No reverb on voices. Echo only comes from music and sfx.
