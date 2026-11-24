## 2026-11-23 — Letter Land: 5 choices and little letters
- Letter rounds show 5 choices (1 correct letter + 4 different ones, never a copy of the right letter). The tiles wrap and shrink so five big tap targets still fit on a phone or tablet.
- Little letters from the start: about half of find-the-letter rounds use little letters for the prompt and the choices, and the rest stay big letters. Level 6 still matches a big letter to its little letter. Yaya still says the letter name, so a little "a" is spoken as the letter, not the word.

## 2026-11-18 — Batch 2 (commit 7139384)
- Save code: press-and-hold Grown-ups button on the map; "Get my code" / "Enter a code" (VROOM-… base32 with checksum + version), preview and confirm before overwrite; bad codes rejected.
- Quick Look slower: 2.5s at L1 down to 1.5s at L6.
- Bigger or Smaller: "Fewer means the little pile" hint (spoken + badge) with big-gap piles until 3 first-try fewer answers in a row; returns after a miss.
- Rex the dino: second buddy unlocks at 39 stars, ROAR stomp on correct answers, 12 accessories at 42–75.
- Car garage: opens at 78, new car every 3 stars (24 cars, 78–147), tap to move/swap; extras at 100/125/150/200; golden cars every 5 stars 152–267; endless trophies every 20 after.
- Rewards in series with a next-prize silhouette + "N more stars!" on the map.
- Letter Land: 7th path, find the letter from 3 (M, P, A first, up to all 26; lowercase and big-to-little matching at L5–6).
- Anti-spam on all paths: answers disabled until Yaya finishes speaking (fallback timer); only the first tap counts toward a star.

## 2026-11-17 — Map update (commit 4ce66f6)
- Rebuilt as a map game with 6 paths, levels 1–6, 3 right in a row to level up, stars only for a correct first try.
- Count (up to 5 → 20, rows of 10 at top levels), Add (two groups with a gap that zoom together; up to 5 → 20), Take Away (items visibly leave; from 5 → 20), Bigger or Smaller (tap the pile with more; "fewer" at L5–6), Find the Number ("Tap 7!", up to 20), Quick Look (flash 1–5 items).
- Yaya reads every question aloud (spoken prompts never reveal the answer).
- Dress Up for Yaya: Head, Face, Back, Hold slots; 12 items unlocking every 3 stars (3–36).
- Old saves migrate: stars kept, old level maps onto Count.

## 2026-11-17 — Initial publish (commit d95bf84)
- Vroom Count: count cars, balls, penguins, trucks, rockets with Yaya; BOOM + confetti on correct answers.
