import { useState, useEffect, useGrokTheme } from "grok/canvas";
import type { CSSProperties } from "grok/canvas";

type Mode = "count" | "add" | "take" | "compare" | "find" | "quick" | "letters";
type Kind = "car" | "ball" | "penguin" | "truck" | "rocket";
type Slot = "head" | "face" | "back" | "hold";
type Buddy = "yaya" | "rex";
type Screen = "home" | "dress" | "play" | "garage" | "grownup";
type Layout = "row" | "rows5" | "scatter" | "tens" | "dice";
type Spot = { x: number; y: number };
type Ask = "more" | "fewer";
type LetterKind = "upper" | "lower" | "match";
type Q = {
  mode: Mode;
  level: number;
  kind: Kind;
  a: number;
  b: number;
  answer: number;
  choices: number[];
  layout: Layout;
  spots: Spot[];
  spots2: Spot[];
  ask: Ask;
  flashMs: number;
  hint: boolean;
  labels: string[];
  target: string;
  letterKind: LetterKind;
};
type QOpts = { fewerEasy?: boolean; hint?: boolean };
type Levels = { [K in Mode]: number };
type Outfit = { head: string; face: string; back: string; hold: string };
type Save = {
  v: number;
  stars: number;
  levels: Levels;
  head: string;
  face: string;
  back: string;
  hold: string;
  unlocked: string[];
  buddy: Buddy;
  rex: Outfit;
  garage: string[];
  fewerRun: number;
  fewerDone: boolean;
};
type Item = { id: string; slot: Slot; name: string; cost: number };
type CarBody = "race" | "sedan" | "truck" | "bus" | "van" | "monster" | "dump" | "tow" | "mixer" | "tractor" | "pickup" | "dozer" | "jeep" | "limo";
type Car = { id: string; name: string; body: CarBody; color: string; deco: string; cost: number };
type RewardKind = "yaya" | "rexpal" | "rex" | "car" | "gold" | "extra" | "trophy";
type Reward = { id: string; kind: RewardKind; name: string; cost: number };
type BoomBit = { id: number; dx: number; dy: number; delay: number; color: string; shape: "star" | "circle" | "sq" };

const SAVE_KEY = "miles-vroom-count-v1";
const SAVE_VERSION = 3;
const KINDS: Kind[] = ["car", "ball", "penguin", "truck", "rocket"];
const MODES: Mode[] = ["count", "add", "take", "compare", "find", "quick", "letters"];
const SLOTS: Slot[] = ["head", "face", "back", "hold"];
const NO_OUTFIT: Outfit = { head: "none", face: "none", back: "none", hold: "none" };
const ITEM_COLORS = [
  "#E11D48", "#2563EB", "#EAB308", "#16A34A", "#F97316",
  "#7C3AED", "#0891B2", "#DB2777", "#0F766E", "#C2410C",
];

const ITEMS: Item[] = [
  { id: "racehelmet", slot: "head", name: "Race helmet", cost: 3 },
  { id: "sunglasses", slot: "face", name: "Cool sunglasses", cost: 6 },
  { id: "firehat", slot: "head", name: "Firefighter hat", cost: 9 },
  { id: "hardhat", slot: "head", name: "Hard hat", cost: 12 },
  { id: "cape", slot: "back", name: "Superhero cape", cost: 15 },
  { id: "goggles", slot: "face", name: "Pilot goggles", cost: 18 },
  { id: "racecar", slot: "hold", name: "Toy race car", cost: 21 },
  { id: "soccer", slot: "hold", name: "Soccer ball", cost: 24 },
  { id: "rocketpack", slot: "back", name: "Rocket backpack", cost: 27 },
  { id: "dinohood", slot: "head", name: "Dino hood", cost: 30 },
  { id: "policecap", slot: "head", name: "Police cap", cost: 33 },
  { id: "trophy", slot: "hold", name: "Trophy", cost: 36 },
];

// Rex the dino: unlocks at 39, then his own set every 3 stars (42..75).
const REX_COST = 39;
const REX_ITEMS: Item[] = [
  { id: "rexcap", slot: "head", name: "Baseball cap", cost: 42 },
  { id: "rexshades", slot: "face", name: "Star shades", cost: 45 },
  { id: "rexwings", slot: "back", name: "Dragon wings", cost: 48 },
  { id: "rexguitar", slot: "hold", name: "Guitar", cost: 51 },
  { id: "rexcrown", slot: "head", name: "Dino crown", cost: 54 },
  { id: "rexpatch", slot: "face", name: "Pirate eye patch", cost: 57 },
  { id: "rexpack", slot: "back", name: "Explorer backpack", cost: 60 },
  { id: "rexburger", slot: "hold", name: "Giant burger", cost: 63 },
  { id: "rexcowboy", slot: "head", name: "Cowboy hat", cost: 66 },
  { id: "rexstache", slot: "face", name: "Silly mustache", cost: 69 },
  { id: "rexcape", slot: "back", name: "Rex cape", cost: 72 },
  { id: "rexrocket", slot: "hold", name: "Toy rocket", cost: 75 },
];

// Garage opens after Rex's set: a new car every 3 stars (78..147).
const GARAGE_OPEN = 78;
const GARAGE_SPOTS = 24;
const CAR_DEFS: Array<[string, string, CarBody, string, string]> = [
  ["racecar", "Race car", "race", "#DC2626", "num"],
  ["firetruck", "Fire truck", "truck", "#DC2626", "ladder"],
  ["police", "Police car", "sedan", "#1E3A8A", "police"],
  ["monster", "Monster truck", "monster", "#7C3AED", "flame"],
  ["taxi", "Taxi", "sedan", "#FACC15", "taxi"],
  ["dump", "Dump truck", "dump", "#F59E0B", ""],
  ["ambulance", "Ambulance", "van", "#F8FAFC", "cross"],
  ["schoolbus", "School bus", "bus", "#FACC15", "school"],
  ["tow", "Tow truck", "tow", "#EA580C", ""],
  ["sports", "Sports car", "race", "#2563EB", "stripe"],
  ["garbage", "Garbage truck", "truck", "#16A34A", "garbage"],
  ["icecream", "Ice cream truck", "van", "#F9A8D4", "cone"],
  ["mixer", "Cement mixer", "mixer", "#94A3B8", ""],
  ["tractor", "Tractor", "tractor", "#16A34A", ""],
  ["jeep", "Jungle jeep", "jeep", "#65A30D", ""],
  ["mail", "Mail truck", "van", "#E2E8F0", "mail"],
  ["limo", "Limo", "limo", "#111827", ""],
  ["pickup", "Pickup truck", "pickup", "#0891B2", ""],
  ["dozer", "Bulldozer", "dozer", "#EAB308", ""],
  ["camper", "Camper van", "van", "#FB923C", "camper"],
  ["dragster", "Dragster", "race", "#F97316", "flame"],
  ["chief", "Fire chief car", "sedan", "#B91C1C", "chief"],
  ["rocketcar", "Rocket car", "race", "#475569", "rocket"],
  ["rexmonster", "Rex monster truck", "monster", "#22C55E", "spikes"],
];
const CARS: Car[] = CAR_DEFS.map((d, i) => ({ id: d[0], name: d[1], body: d[2], color: d[3], deco: d[4], cost: GARAGE_OPEN + 3 * i }));
// Parallel thread once the garage is full: each car turns gold, one every 5 stars (152..267).
const GOLD_START = 152;
// Big garage milestones in between.
const EXTRAS: Reward[] = [
  { id: "gaspump", kind: "extra", name: "Gas pump", cost: 100 },
  { id: "carwash", kind: "extra", name: "Car wash", cost: 125 },
  { id: "stoplight", kind: "extra", name: "Traffic light", cost: 150 },
  { id: "bigcup", kind: "extra", name: "Champion cup", cost: 200 },
];
// After that, a star trophy every 20 stars, forever (280, 300, 320, ...), so there is never a dead stretch.
const TROPHY_START = 280;
const TROPHY_STEP = 20;

function staticRewards(): Reward[] {
  const out: Reward[] = [];
  for (let i = 0; i < ITEMS.length; i++) out.push({ id: ITEMS[i].id, kind: "yaya", name: ITEMS[i].name, cost: ITEMS[i].cost });
  out.push({ id: "rex", kind: "rexpal", name: "Rex the dino", cost: REX_COST });
  for (let i = 0; i < REX_ITEMS.length; i++) out.push({ id: REX_ITEMS[i].id, kind: "rex", name: REX_ITEMS[i].name, cost: REX_ITEMS[i].cost });
  for (let i = 0; i < CARS.length; i++) out.push({ id: "car-" + CARS[i].id, kind: "car", name: CARS[i].name, cost: CARS[i].cost });
  for (let i = 0; i < EXTRAS.length; i++) out.push(EXTRAS[i]);
  for (let i = 0; i < CARS.length; i++) out.push({ id: "gold-" + CARS[i].id, kind: "gold", name: "Golden " + CARS[i].name.toLowerCase(), cost: GOLD_START + 5 * i });
  out.sort((x, y) => x.cost - y.cost);
  return out;
}
const REWARDS: Reward[] = staticRewards();

function trophyReward(cost: number): Reward {
  return { id: "trophy-" + cost, kind: "trophy", name: cost + "-star trophy", cost };
}

function rewardsBetween(from: number, to: number): Reward[] {
  const out: Reward[] = REWARDS.filter((r) => r.cost > from && r.cost <= to);
  for (let c = TROPHY_START; c <= to; c += TROPHY_STEP) if (c > from) out.push(trophyReward(c));
  return out;
}

function nextPrize(stars: number): Reward {
  for (let i = 0; i < REWARDS.length; i++) if (REWARDS[i].cost > stars) return REWARDS[i];
  let c = TROPHY_START;
  while (c <= stars) c += TROPHY_STEP;
  return trophyReward(c);
}

function rewardById(id: string): Reward | null {
  for (let i = 0; i < REWARDS.length; i++) if (REWARDS[i].id === id) return REWARDS[i];
  return null;
}

function carById(id: string): Car | null {
  for (let i = 0; i < CARS.length; i++) if (CARS[i].id === id) return CARS[i];
  return null;
}

const SLOT_META: { [K in Slot]: { title: string; emoji: string } } = {
  head: { title: "Head", emoji: "🪖" },
  face: { title: "Face", emoji: "😎" },
  back: { title: "Back", emoji: "🦸" },
  hold: { title: "Hold", emoji: "🧸" },
};

const MODE_META: { [K in Mode]: { title: string; emoji: string; blurb: string } } = {
  count: { title: "Count", emoji: "🚗", blurb: "How many? Count them up!" },
  add: { title: "Add", emoji: "➕", blurb: "Two groups zoom together." },
  take: { title: "Take Away", emoji: "👋", blurb: "Some go bye-bye. How many stay?" },
  compare: { title: "Bigger or Smaller", emoji: "⚖️", blurb: "Which pile has more? Or fewer?" },
  find: { title: "Find the Number", emoji: "🔎", blurb: "Yaya says a number. Find it!" },
  quick: { title: "Quick Look", emoji: "👀", blurb: "Peek! How many?" },
  letters: { title: "Letter Land", emoji: "🔤", blurb: "Yaya says a letter. Find it!" },
};

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const c = arr.slice();
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = c[i];
    c[i] = c[j];
    c[j] = t;
  }
  return c;
}

function noun(kind: Kind, n: number): string {
  const words: { [K in Kind]: [string, string] } = {
    car: ["car", "cars"],
    ball: ["ball", "balls"],
    penguin: ["penguin", "penguins"],
    truck: ["truck", "trucks"],
    rocket: ["rocket", "rockets"],
  };
  return n === 1 ? words[kind][0] : words[kind][1];
}

function leaveVerb(kind: Kind, n: number): string {
  const one = n === 1;
  if (kind === "ball") return one ? "rolls away" : "roll away";
  if (kind === "penguin") return one ? "waddles away" : "waddle away";
  if (kind === "rocket") return one ? "blasts off" : "blast off";
  return one ? "drives away" : "drive away";
}

function clampLevel(n: number): number {
  if (!isFinite(n) || n < 1) return 1;
  if (n > 6) return 6;
  return Math.floor(n);
}

function levelInfo(mode: Mode, lv: number): string {
  const L = clampLevel(lv);
  if (mode === "count") return ["up to 5", "up to 10", "up to 10, spread out", "up to 15", "up to 20, rows of 10", "up to 20, rows of 10"][L - 1];
  if (mode === "add") return ["totals up to 5", "totals up to 5", "totals up to 10", "totals up to 10", "totals up to 20", "totals up to 20"][L - 1];
  if (mode === "take") return ["start with 5", "start with 5", "start with 10", "start with 10", "start with 20", "start with 20"][L - 1];
  if (mode === "compare") return ["up to 5, easy", "up to 6", "up to 10", "up to 10, close", "up to 15, more or fewer", "up to 20, more or fewer"][L - 1];
  if (mode === "find") return ["1 to 5", "1 to 10", "6 to 12", "8 to 15", "10 to 20", "10 to 20, look-alikes"][L - 1];
  if (mode === "letters") return ["M, P, A, big or little", "7 letters, big or little", "13 letters, big or little", "all 26, big or little", "all 26, big or little", "big to little match"][L - 1];
  return ["1 to 3, dice dots", "1 to 4, dice dots", "1 to 5, dice dots", "2 to 5, mixed up", "2 to 5, a bit faster", "3 to 5, fastest"][L - 1];
}

function numChoices(answer: number, lo: number, hi: number, spread: number): number[] {
  const set: number[] = [answer];
  // Four other numbers, kept near the answer. At the edge (answer 1 in 1-20) a
  // spread of 2 only reaches 2 and 3, so open it until four neighbors fit.
  let s = spread;
  while (s < hi - lo) {
    let near = 0;
    for (let n = Math.max(lo, answer - s); n <= Math.min(hi, answer + s); n++) if (n !== answer) near++;
    if (near >= 4) break;
    s++;
  }
  let guard = 0;
  while (set.length < 5 && guard < 300) {
    guard++;
    const d = rand(1, Math.max(1, s)) * (Math.random() < 0.5 ? -1 : 1);
    const n = answer + d;
    if (n >= lo && n <= hi && set.indexOf(n) < 0) set.push(n);
  }
  for (let d = 1; set.length < 5 && d <= hi - lo; d++) {
    const up = answer + d;
    const down = answer - d;
    if (up >= lo && up <= hi && set.indexOf(up) < 0) set.push(up);
    if (set.length < 5 && down >= lo && down <= hi && set.indexOf(down) < 0) set.push(down);
  }
  for (let n = lo; set.length < 5 && n <= hi; n++) if (set.indexOf(n) < 0) set.push(n);
  return shuffle(set);
}

function scatterSpots(n: number, cols: number, rows: number): Spot[] {
  const cells: number[] = [];
  for (let i = 0; i < cols * rows; i++) cells.push(i);
  const pick = shuffle(cells).slice(0, n);
  const out: Spot[] = [];
  for (let i = 0; i < pick.length; i++) {
    const c = pick[i] % cols;
    const r = Math.floor(pick[i] / cols);
    const jx = (Math.random() - 0.5) * 0.3;
    const jy = (Math.random() - 0.5) * 0.3;
    out.push({ x: ((c + 0.5 + jx) / cols) * 100, y: ((r + 0.5 + jy) / rows) * 100 });
  }
  return out;
}

function diceSpots(n: number): Spot[] {
  const P: { [k: number]: number[][] } = {
    1: [[50, 50]],
    2: [[27, 27], [73, 73]],
    3: [[24, 24], [50, 50], [76, 76]],
    4: [[27, 27], [73, 27], [27, 73], [73, 73]],
    5: [[24, 24], [76, 24], [50, 50], [24, 76], [76, 76]],
  };
  const pts = P[n] || P[1];
  return pts.map((p) => ({ x: p[0], y: p[1] }));
}

function lookAlikes(n: number): number[] {
  const out: number[] = [];
  const add = (x: number) => {
    if (x >= 1 && x <= 20 && x !== n && out.indexOf(x) < 0) out.push(x);
  };
  if (n >= 11 && n <= 19) add(n - 10);
  if (n <= 9) add(n + 10);
  const s = String(n);
  if (s.length === 2) add(parseInt(s[1] + s[0], 10));
  add(parseInt(s.replace(/6/g, "x").replace(/9/g, "6").replace(/x/g, "9"), 10));
  add(n + 1);
  add(n - 1);
  return out;
}

function blankQ(mode: Mode, level: number): Q {
  return {
    mode,
    level,
    kind: KINDS[rand(0, KINDS.length - 1)],
    a: 0,
    b: 0,
    answer: 0,
    choices: [],
    layout: "row",
    spots: [],
    spots2: [],
    ask: "more",
    flashMs: 0,
    hint: false,
    labels: [],
    target: "",
    letterKind: "upper",
  };
}

function makeCount(lv: number): Q {
  const q = blankQ("count", lv);
  let n = 1;
  if (lv <= 1) { n = rand(1, 5); q.layout = "row"; }
  else if (lv === 2) { n = rand(3, 10); q.layout = n <= 5 ? "row" : "rows5"; }
  else if (lv === 3) { n = rand(4, 10); q.layout = "scatter"; q.spots = scatterSpots(n, 4, 3); }
  else if (lv === 4) { n = rand(8, 15); q.layout = "rows5"; }
  else if (lv === 5) { n = rand(10, 17); q.layout = "tens"; }
  else { n = rand(12, 20); q.layout = "tens"; }
  q.a = n;
  q.answer = n;
  q.choices = numChoices(n, 1, 20, lv <= 2 ? 2 : 3);
  return q;
}

function makeAdd(lv: number): Q {
  const q = blankQ("add", lv);
  let a = 1, b = 1;
  if (lv <= 1) { a = rand(1, 3); b = rand(1, Math.min(2, 5 - a)); }
  else if (lv === 2) { a = rand(1, 4); b = rand(1, 5 - a); }
  else if (lv === 3) { a = rand(2, 7); b = rand(1, Math.min(3, 10 - a)); }
  else if (lv === 4) { a = rand(3, 8); b = rand(2, 10 - a); }
  else if (lv === 5) { a = rand(5, 10); b = rand(2, Math.min(8, 20 - a)); }
  else { a = rand(8, 12); b = rand(3, 20 - a); }
  q.a = a;
  q.b = b;
  q.answer = a + b;
  q.choices = numChoices(q.answer, 1, 20, lv <= 2 ? 2 : 3);
  return q;
}

function makeTake(lv: number): Q {
  const q = blankQ("take", lv);
  let a = 2, b = 1;
  if (lv <= 1) { a = rand(2, 5); b = 1; }
  else if (lv === 2) { a = rand(3, 5); b = rand(1, 2); }
  else if (lv === 3) { a = rand(5, 10); b = rand(1, 3); }
  else if (lv === 4) { a = rand(6, 10); b = rand(2, Math.min(5, a - 1)); }
  else if (lv === 5) { a = rand(10, 16); b = rand(1, 5); }
  else { a = rand(14, 20); b = rand(2, 10); }
  q.a = a;
  q.b = b;
  q.answer = a - b;
  q.choices = numChoices(q.answer, 1, 20, lv <= 2 ? 2 : 3);
  return q;
}

function makeCompare(lv: number, opts?: QOpts): Q {
  const q = blankQ("compare", lv);
  const cfg: number[][] = [[5, 3, 4], [6, 2, 5], [10, 3, 9], [10, 2, 4], [15, 2, 5], [20, 1, 3]];
  const c = cfg[clampLevel(lv) - 1];
  const minBig = [4, 3, 6, 6, 8, 11][clampLevel(lv) - 1];
  let big = rand(Math.max(minBig, 1 + c[1]), c[0]);
  const d = rand(c[1], Math.min(c[2], big - 1));
  let small = big - d;
  q.ask = lv >= 5 && Math.random() < 0.4 ? "fewer" : "more";
  if (q.ask === "fewer" && opts && opts.fewerEasy) {
    // While "fewer" is new: a really little pile vs a really big pile (like 2 vs 8).
    small = rand(1, 3);
    big = Math.min(c[0], small + rand(5, 7));
  }
  q.hint = q.ask === "fewer" && !!(opts && opts.hint);
  const leftBig = Math.random() < 0.5;
  q.a = leftBig ? big : small;
  q.b = leftBig ? small : big;
  if (q.ask === "more") q.answer = q.a > q.b ? 0 : 1;
  else q.answer = q.a < q.b ? 0 : 1;
  q.choices = [0, 1];
  const grid = big <= 6 ? [3, 3] : big <= 12 ? [4, 4] : [5, 5];
  q.spots = scatterSpots(q.a, grid[0], grid[1]);
  q.spots2 = scatterSpots(q.b, grid[0], grid[1]);
  q.layout = "scatter";
  return q;
}

function makeFind(lv: number): Q {
  const q = blankQ("find", lv);
  let n = 1, lo = 1, hi = 5;
  if (lv <= 1) { lo = 1; hi = 5; n = rand(1, 5); }
  else if (lv === 2) { lo = 1; hi = 10; n = rand(1, 10); }
  else if (lv === 3) { lo = 1; hi = 12; n = rand(6, 12); }
  else if (lv === 4) { lo = 1; hi = 15; n = rand(8, 15); }
  else { lo = 1; hi = 20; n = rand(10, 20); }
  const set: number[] = [n];
  if (lv >= 5) {
    const all = shuffle(lookAlikes(n));
    const la = lv >= 6 ? all.filter((x) => Math.abs(x - n) !== 1).concat(all.filter((x) => Math.abs(x - n) === 1)) : all;
    const want = lv >= 6 ? 2 : 1;
    for (let i = 0; i < la.length && set.length < 1 + want; i++) if (set.indexOf(la[i]) < 0) set.push(la[i]);
  }
  let guard = 0;
  while (set.length < 5 && guard < 300) {
    guard++;
    const x = lv <= 2 ? rand(lo, hi) : n + rand(-4, 4);
    if (x >= lo && x <= hi && set.indexOf(x) < 0) set.push(x);
  }
  for (let d = 1; set.length < 5 && d <= hi - lo; d++) {
    const up = n + d;
    const down = n - d;
    if (up >= lo && up <= hi && set.indexOf(up) < 0) set.push(up);
    if (set.length < 5 && down >= lo && down <= hi && set.indexOf(down) < 0) set.push(down);
  }
  for (let x = lo; set.length < 5 && x <= hi; x++) if (set.indexOf(x) < 0) set.push(x);
  q.a = n;
  q.answer = n;
  q.choices = shuffle(set);
  return q;
}

const QUICK_FLASH_MS = [2500, 2300, 2100, 1900, 1700, 1500];

function makeQuick(lv: number): Q {
  const q = blankQ("quick", lv);
  let n = 1, max = 3;
  if (lv <= 1) { n = rand(1, 3); max = 3; q.layout = "dice"; }
  else if (lv === 2) { n = rand(1, 4); max = 4; q.layout = "dice"; }
  else if (lv === 3) { n = rand(1, 5); max = 5; q.layout = "dice"; }
  else if (lv === 4) { n = rand(2, 5); max = 5; q.layout = "scatter"; }
  else if (lv === 5) { n = rand(2, 5); max = 5; q.layout = "scatter"; }
  else { n = rand(3, 5); max = 5; q.layout = "scatter"; }
  q.flashMs = QUICK_FLASH_MS[clampLevel(lv) - 1];
  q.spots = q.layout === "dice" ? diceSpots(n) : scatterSpots(n, 3, 3);
  q.a = n;
  q.answer = n;
  const ch: number[] = [];
  for (let i = 1; i <= max; i++) ch.push(i);
  q.choices = ch;
  return q;
}

// Letter Land: M, P, A first (his letter books), then more letters. About half of
// find-the-letter rounds are little letters; level 6 matches big to little.
const LETTER_ORDER: string[] = "MPASTOBDCEHILNRFGKUWYJVQXZ".split("");
const LOOK_UP: { [k: string]: string } = {
  M: "NW", N: "MH", W: "MV", P: "BRD", B: "PDR", R: "PBK", D: "OPB", O: "QCD", Q: "OG", C: "OG", G: "CO", E: "FB", F: "ET",
  I: "LT", L: "IT", T: "IF", U: "VJ", V: "UY", K: "XR", X: "KY", Y: "VX", H: "NA", A: "HV", S: "Z", Z: "SN", J: "UI",
};
const LOOK_LOW: { [k: string]: string } = {
  b: "dpq", d: "bqp", p: "qbd", q: "pdg", m: "nw", n: "mhu", u: "nv", h: "nb", i: "lj", l: "it", a: "oe", e: "ac", o: "ac",
  c: "oe", g: "qp", f: "t", t: "fl", r: "n", s: "z", w: "mv", v: "wy", y: "vg", k: "x", x: "k", j: "i", z: "s",
};

function letterPool(lv: number): string[] {
  return LETTER_ORDER.slice(0, [3, 7, 13, 26, 26, 26][clampLevel(lv) - 1]);
}

function makeLetters(lv: number): Q {
  const q = blankQ("letters", lv);
  let kind: LetterKind = "upper";
  const pool = letterPool(lv);
  // Little letters from the first level, about half the find-the-letter rounds.
  // Level 6 stays the big-to-little truck match, with some little-letter rounds mixed in.
  if (lv >= 6) {
    kind = Math.random() < 0.6 ? "match" : "lower";
  } else if (Math.random() < 0.5) {
    kind = "lower";
  }
  const T = pool[rand(0, pool.length - 1)];
  const set: string[] = [T];
  if (lv >= 4) {
    const src = kind === "upper" ? LOOK_UP[T] || "" : (LOOK_LOW[T.toLowerCase()] || "").toUpperCase();
    const la = shuffle(src.split(""));
    const want = lv >= 6 ? 2 : 1;
    for (let i = 0; i < la.length && set.length < 1 + want; i++) if (set.indexOf(la[i]) < 0) set.push(la[i]);
  }
  let guard = 0;
  while (set.length < 5 && guard < 300) {
    guard++;
    const x = pool[rand(0, pool.length - 1)];
    if (set.indexOf(x) < 0) set.push(x);
  }
  for (let i = 0; set.length < 5 && i < LETTER_ORDER.length; i++) if (set.indexOf(LETTER_ORDER[i]) < 0) set.push(LETTER_ORDER[i]);
  const show = (ch: string) => (kind === "upper" ? ch : ch.toLowerCase());
  q.labels = shuffle(set).map(show);
  q.choices = [0, 1, 2, 3, 4];
  q.answer = q.labels.indexOf(show(T));
  q.target = T;
  q.letterKind = kind;
  q.layout = "row";
  q.kind = "penguin"; // light, calm background so the letters stand out
  return q;
}

function makeQ(mode: Mode, level: number, opts?: QOpts): Q {
  const lv = clampLevel(level);
  if (mode === "add") return makeAdd(lv);
  if (mode === "take") return makeTake(lv);
  if (mode === "compare") return makeCompare(lv, opts);
  if (mode === "find") return makeFind(lv);
  if (mode === "quick") return makeQuick(lv);
  if (mode === "letters") return makeLetters(lv);
  return makeCount(lv);
}

const FEWER_HINT = "Fewer means the little pile.";

function promptFor(q: Q, takeGone: boolean): string {
  const k = q.kind;
  if (q.mode === "count") return "How many " + noun(k, 2) + "?";
  if (q.mode === "add") return q.a + " " + noun(k, q.a) + " + " + q.b + " " + noun(k, q.b) + ". How many in all?";
  if (q.mode === "take") {
    if (!takeGone) return q.a + " " + noun(k, q.a) + "...";
    return q.a + " " + noun(k, q.a) + ". " + q.b + " " + leaveVerb(k, q.b) + ". How many are left?";
  }
  if (q.mode === "compare") return "Tap the pile with " + (q.ask === "more" ? "MORE" : "FEWER") + " " + noun(k, 2) + ".";
  if (q.mode === "find") return "Tap the number Yaya says!";
  if (q.mode === "letters") {
    if (q.letterKind === "match") return "Big " + q.target + " needs little " + q.target.toLowerCase() + "! Which trailer?";
    if (q.letterKind === "lower") return "Find the little letter Yaya says!";
    return "Find the letter Yaya says!";
  }
  return "Quick look! How many " + noun(k, 2) + "?";
}

function speechFor(q: Q): string {
  const k = q.kind;
  if (q.mode === "count") return "How many " + noun(k, 2) + "? Count them!";
  if (q.mode === "add") {
    return "Here " + (q.a === 1 ? "is " : "are ") + q.a + " " + noun(k, q.a) + ". And here " + (q.b === 1 ? "is " : "are ") + q.b + " more. How many " + noun(k, 2) + " in all?";
  }
  if (q.mode === "take") return q.a + " " + noun(k, q.a) + ". " + q.b + " " + leaveVerb(k, q.b) + ". How many are left?";
  if (q.mode === "compare") return "Which pile has " + (q.ask === "more" ? "more" : "fewer") + " " + noun(k, 2) + "? " + (q.hint ? FEWER_HINT + " " : "") + "Tap it!";
  if (q.mode === "find") return "Tap " + q.answer + "!";
  if (q.mode === "letters") {
    // Always speak the capital so the voice says the letter name ("ay"), not the word "a".
    if (q.letterKind === "match") return "Big " + q.target + "! Find little " + q.target + " for the trailer!";
    if (q.letterKind === "lower") return "Find the little letter " + q.target + "!";
    return "Find the letter " + q.target + "!";
  }
  return "Quick look! How many " + noun(k, 2) + " did you see?";
}

function defaultLevels(): Levels {
  return { count: 1, add: 1, take: 1, compare: 1, find: 1, quick: 1, letters: 1 };
}

function emptyGarage(): string[] {
  const g: string[] = [];
  for (let i = 0; i < GARAGE_SPOTS; i++) g.push("");
  return g;
}

function defaultSave(): Save {
  return {
    v: SAVE_VERSION, stars: 0, levels: defaultLevels(), head: "none", face: "none", back: "none", hold: "none", unlocked: ["none"],
    buddy: "yaya", rex: { ...NO_OUTFIT }, garage: emptyGarage(), fewerRun: 0, fewerDone: false,
  };
}

function findItem(id: string): Item | null {
  for (let i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
  return null;
}

function findRexItem(id: string): Item | null {
  for (let i = 0; i < REX_ITEMS.length; i++) if (REX_ITEMS[i].id === id) return REX_ITEMS[i];
  return null;
}

function itemName(id: string): string {
  const it = findItem(id) || findRexItem(id);
  if (it) return it.name;
  const r = rewardById(id);
  return r ? r.name : "";
}

// Everything earned at this star count, in reward order ("none" first). Trophies are counted from stars, not stored.
function unlockedFor(stars: number): string[] {
  const out: string[] = ["none"];
  for (let i = 0; i < REWARDS.length; i++) if (REWARDS[i].cost <= stars) out.push(REWARDS[i].id);
  return out;
}

function slotPickIn(list: Item[], v: unknown, slot: Slot, unlocked: string[]): string {
  if (typeof v !== "string") return "none";
  let it: Item | null = null;
  for (let i = 0; i < list.length; i++) if (list[i].id === v) it = list[i];
  if (!it || it.slot !== slot || unlocked.indexOf(v) < 0) return "none";
  return v;
}

function slotPick(v: unknown, slot: Slot, unlocked: string[]): string {
  return slotPickIn(ITEMS, v, slot, unlocked);
}

function carsFor(stars: number): Car[] {
  return CARS.filter((c) => c.cost <= stars);
}

// Keep his arrangement, drop anything not earned, and park any newly earned car in the first empty spot.
function normalizeGarage(g: unknown, stars: number): string[] {
  const out = emptyGarage();
  const have = carsFor(stars).map((c) => c.id);
  if (Array.isArray(g)) {
    for (let i = 0; i < GARAGE_SPOTS && i < g.length; i++) {
      const id = g[i];
      if (typeof id === "string" && have.indexOf(id) >= 0 && out.indexOf(id) < 0) out[i] = id;
    }
  }
  for (let i = 0; i < have.length; i++) {
    if (out.indexOf(have[i]) >= 0) continue;
    const free = out.indexOf("");
    if (free >= 0) out[free] = have[i];
  }
  return out;
}

function parseSave(raw: string): { save: Save; migrated: boolean } {
  const base = defaultSave();
  let migrated = false;
  try {
    const v = JSON.parse(raw) as {
      v?: unknown; stars?: unknown; level?: unknown; levels?: unknown;
      head?: unknown; face?: unknown; back?: unknown; hold?: unknown; unlocked?: unknown;
      buddy?: unknown; rex?: unknown; garage?: unknown; fewerRun?: unknown; fewerDone?: unknown;
    };
    if (!v || typeof v !== "object") return { save: base, migrated: false };
    if (typeof v.stars === "number" && isFinite(v.stars) && v.stars >= 0) base.stars = Math.floor(v.stars);
    if (v.levels && typeof v.levels === "object") {
      const lv = v.levels as { [k: string]: unknown };
      for (let i = 0; i < MODES.length; i++) {
        const n = lv[MODES[i]];
        if (typeof n === "number" && isFinite(n)) base.levels[MODES[i]] = clampLevel(n);
      }
    } else if (typeof v.level === "number" && isFinite(v.level)) {
      // Old one-screen game: one level for everything (counted to 5, 7, then 10).
      const old = clampLevel(v.level);
      base.levels.count = old <= 2 ? 1 : old <= 4 ? 2 : 3;
      migrated = true;
    } else if (v.v !== 2 && v.v !== SAVE_VERSION) {
      migrated = true;
    }
    // Unlocks always follow the star count (stars never go down), so nothing earned can be lost.
    const u = unlockedFor(base.stars);
    if (Array.isArray(v.unlocked)) {
      for (let i = 0; i < v.unlocked.length; i++) {
        const it = v.unlocked[i];
        if (typeof it === "string" && rewardById(it) && u.indexOf(it) < 0) u.push(it);
      }
    }
    base.unlocked = u;
    base.head = slotPick(v.head, "head", base.unlocked);
    base.face = slotPick(v.face, "face", base.unlocked);
    base.back = slotPick(v.back, "back", base.unlocked);
    base.hold = slotPick(v.hold, "hold", base.unlocked);
    const rx = (v.rex && typeof v.rex === "object" ? v.rex : {}) as { [k: string]: unknown };
    base.rex = {
      head: slotPickIn(REX_ITEMS, rx.head, "head", base.unlocked),
      face: slotPickIn(REX_ITEMS, rx.face, "face", base.unlocked),
      back: slotPickIn(REX_ITEMS, rx.back, "back", base.unlocked),
      hold: slotPickIn(REX_ITEMS, rx.hold, "hold", base.unlocked),
    };
    base.buddy = v.buddy === "rex" && base.unlocked.indexOf("rex") >= 0 ? "rex" : "yaya";
    base.garage = normalizeGarage(v.garage, base.stars);
    if (typeof v.fewerRun === "number" && isFinite(v.fewerRun)) base.fewerRun = Math.max(0, Math.min(3, Math.floor(v.fewerRun)));
    base.fewerDone = v.fewerDone === true;
  } catch (e) {
    return { save: defaultSave(), migrated: false };
  }
  return { save: base, migrated };
}

function storage(): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } | null {
  try {
    const w = window as unknown as { localStorage?: { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } };
    return w.localStorage || null;
  } catch (e) {
    return null;
  }
}

function loadSave(): { save: Save; migrated: boolean } {
  try {
    const s = storage();
    if (!s) return { save: defaultSave(), migrated: false };
    const raw = s.getItem(SAVE_KEY);
    if (!raw) return { save: defaultSave(), migrated: false };
    return parseSave(raw);
  } catch (e) {
    return { save: defaultSave(), migrated: false };
  }
}

function writeSave(data: Save): void {
  try {
    const s = storage();
    if (s) s.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable */ }
}

// ---------- Save code: packed bits -> base32 (no I, L, O, U) with a version and a CRC-16 check: 80 bits = VROOM-XXXX-XXXX-XXXX-XXXX (longer only if he rearranged his garage) ----------
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_VERSION = 1;
const CODE_PREFIX = "VROOM";

function slotIds(list: Item[], slot: Slot): string[] {
  return ["none"].concat(list.filter((it) => it.slot === slot).map((it) => it.id));
}
// bits per outfit slot: Yaya head has 6 options (3 bits), the rest fit in 2 bits.
const CODE_SLOTS: Array<[Buddy, Slot, number]> = [
  ["yaya", "head", 3], ["yaya", "face", 2], ["yaya", "back", 2], ["yaya", "hold", 2],
  ["rex", "head", 2], ["rex", "face", 2], ["rex", "back", 2], ["rex", "hold", 2],
];

function pushBits(out: number[], val: number, n: number): void {
  for (let i = n - 1; i >= 0; i--) out.push((val >> i) & 1);
}

function crc16(bits: number[]): number {
  let crc = 0xffff;
  for (let i = 0; i < bits.length; i++) {
    const top = ((crc >> 15) & 1) ^ bits[i];
    crc = (crc << 1) & 0xffff;
    if (top) crc ^= 0x1021;
  }
  return crc;
}

function defaultGarage(stars: number): string[] {
  return normalizeGarage([], stars);
}

function encodeSave(s: Save): string {
  const bits: number[] = [];
  pushBits(bits, CODE_VERSION, 8);
  const stars = Math.min(8191, s.stars);
  pushBits(bits, stars, 13);
  for (let i = 0; i < MODES.length; i++) pushBits(bits, clampLevel(s.levels[MODES[i]]) - 1, 3);
  pushBits(bits, s.buddy === "rex" ? 1 : 0, 1);
  pushBits(bits, Math.max(0, Math.min(3, s.fewerRun)), 2);
  pushBits(bits, s.fewerDone ? 1 : 0, 1);
  const garage = normalizeGarage(s.garage, stars);
  const custom = garage.join(",") !== defaultGarage(stars).join(",");
  pushBits(bits, custom ? 1 : 0, 1);
  for (let i = 0; i < CODE_SLOTS.length; i++) {
    const [who, slot, n] = CODE_SLOTS[i];
    const ids = slotIds(who === "yaya" ? ITEMS : REX_ITEMS, slot);
    const cur = who === "yaya" ? s[slot] : s.rex[slot];
    pushBits(bits, Math.max(0, ids.indexOf(cur)), n);
  }
  if (custom) {
    const cars = carsFor(stars);
    for (let i = 0; i < cars.length; i++) pushBits(bits, Math.max(0, garage.indexOf(cars[i].id)), 5);
  }
  pushBits(bits, crc16(bits), 16);
  while (bits.length % 5 !== 0) bits.push(0);
  let chars = "";
  for (let i = 0; i < bits.length; i += 5) {
    let v = 0;
    for (let j = 0; j < 5; j++) v = v * 2 + bits[i + j];
    chars += B32[v];
  }
  const groups: string[] = [];
  for (let i = 0; i < chars.length; i += 4) groups.push(chars.slice(i, i + 4));
  return CODE_PREFIX + "-" + groups.join("-");
}

function decodeCode(text: string): { save: Save | null; error: string } {
  const bad = { save: null, error: "That code doesn't look right. Check the letters and numbers and try again." };
  let t = String(text || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (t.indexOf(CODE_PREFIX) === 0) t = t.slice(CODE_PREFIX.length);
  t = t.replace(/O/g, "0").replace(/[IL]/g, "1").replace(/U/g, "V");
  if (t.length < 14) return bad;
  const bits: number[] = [];
  for (let i = 0; i < t.length; i++) {
    const v = B32.indexOf(t[i]);
    if (v < 0) return bad;
    pushBits(bits, v, 5);
  }
  let pos = 0;
  const read = (n: number): number => {
    let v = 0;
    for (let i = 0; i < n; i++) v = v * 2 + (bits[pos + i] || 0);
    pos += n;
    return v;
  };
  const version = read(8);
  if (version !== CODE_VERSION) return bad;
  const stars = read(13);
  const levels = defaultLevels();
  for (let i = 0; i < MODES.length; i++) {
    const lv = read(3) + 1;
    if (lv > 6) return bad;
    levels[MODES[i]] = lv;
  }
  const buddy: Buddy = read(1) ? "rex" : "yaya";
  const fewerRun = read(2);
  const fewerDone = read(1) === 1;
  const custom = read(1) === 1;
  const yaya: Outfit = { ...NO_OUTFIT };
  const rex: Outfit = { ...NO_OUTFIT };
  for (let i = 0; i < CODE_SLOTS.length; i++) {
    const [who, slot, n] = CODE_SLOTS[i];
    const ids = slotIds(who === "yaya" ? ITEMS : REX_ITEMS, slot);
    const k = read(n);
    if (k >= ids.length) return bad;
    if (who === "yaya") yaya[slot] = ids[k];
    else rex[slot] = ids[k];
  }
  let garage: string[] = [];
  if (custom) {
    garage = emptyGarage();
    const cars = carsFor(stars);
    for (let i = 0; i < cars.length; i++) {
      const spot = read(5);
      if (spot >= GARAGE_SPOTS || garage[spot] !== "") return bad;
      garage[spot] = cars[i].id;
    }
  }
  if (pos + 16 > bits.length) return bad;
  const payload = bits.slice(0, pos);
  const crc = read(16);
  const rest = bits.length - pos;
  if (rest < 0 || rest >= 5) return bad;
  for (let i = pos; i < bits.length; i++) if (bits[i] !== 0) return bad;
  if (crc !== crc16(payload)) return bad;
  const obj = { v: SAVE_VERSION, stars, levels, head: yaya.head, face: yaya.face, back: yaya.back, hold: yaya.hold, buddy, rex, garage, fewerRun, fewerDone };
  return { save: parseSave(JSON.stringify(obj)).save, error: "" };
}

function codeSummary(s: Save): string {
  const parts = MODES.map((m) => MODE_META[m].title + " L" + s.levels[m]);
  const cars = carsFor(s.stars).length;
  return "Miles: " + s.stars + " stars, " + parts.join(", ") + ". Buddy: " + (s.buddy === "rex" ? "Rex" : "Yaya") + ". Cars: " + cars + ".";
}

// ---------- Voice ----------
function say(text: string): void {
  sayThen(text, null);
}

let speechSeq = 0;
// Speak, then call done when Yaya has finished (or after a fallback timeout, e.g. an iPad with no voice that never fires "end").
function sayThen(text: string, done: (() => void) | null, minMs?: number): void {
  const seq = ++speechSeq;
  const start = Date.now();
  let fired = false;
  const finish = () => {
    if (fired) return;
    fired = true;
    if (!done) return;
    const wait = Math.max(0, (minMs || 0) - (Date.now() - start));
    setTimeout(done, wait);
  };
  if (done) setTimeout(finish, Math.min(6000, 900 + text.length * 65));
  try {
    const w = window as unknown as { speechSynthesis?: SpeechSynthesis };
    if (!w.speechSynthesis) { finish(); return; }
    w.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 1.15;
    u.onend = () => { if (seq === speechSeq) finish(); };
    u.onerror = () => { if (seq === speechSeq) finish(); };
    w.speechSynthesis.speak(u);
  } catch (e) {
    finish();
  }
}

function makeBoomBits(): BoomBit[] {
  const colors = ["#FACC15", "#FB7185", "#38BDF8", "#A3E635", "#FB923C", "#C084FC", "#FFFFFF"];
  const shapes: Array<BoomBit["shape"]> = ["star", "circle", "sq"];
  const bits: BoomBit[] = [];
  for (let i = 0; i < 18; i++) {
    const ang = (Math.PI * 2 * i) / 18;
    const dist = 100 + (i % 5) * 14;
    bits.push({ id: i, dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist - 10, delay: (i % 6) * 30, color: colors[i % colors.length], shape: shapes[i % 3] });
  }
  return bits;
}

function HeadWear(props: { id: string }) {
  const id = props.id;
  if (id === "racehelmet") {
    return (
      <g>
        <path d="M19 40 C17 6 73 6 71 40 L64 38 C60 25 30 25 26 38 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
        <path d="M45 11 V27" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M24 33 C34 27 56 27 66 33" stroke="#1F2937" strokeWidth="3" fill="none" />
        <circle cx="62" cy="22" r="4" fill="#FFFFFF" stroke="#7F1D1D" strokeWidth="1" />
        <text x="62" y="24.5" fontSize="6" textAnchor="middle" fontWeight="900" fill="#7F1D1D">1</text>
      </g>
    );
  }
  if (id === "firehat") {
    return (
      <g>
        <ellipse cx="45" cy="22" rx="31" ry="6" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.2" />
        <path d="M27 22 C27 2 63 2 63 22 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.2" />
        <path d="M45 6 L51 10 L49 18 H41 L39 10 Z" fill="#FACC15" stroke="#A16207" strokeWidth="1" />
      </g>
    );
  }
  if (id === "hardhat") {
    return (
      <g>
        <path d="M24 23 C24 2 66 2 66 23 Z" fill="#FACC15" stroke="#A16207" strokeWidth="1.2" />
        <rect x="17" y="21" width="56" height="6" rx="3" fill="#EAB308" stroke="#A16207" strokeWidth="1" />
        <path d="M45 5 V21" stroke="#A16207" strokeWidth="3" />
      </g>
    );
  }
  if (id === "dinohood") {
    return (
      <g>
        <polygon points="30,13 34,1 39,11" fill="#86EFAC" stroke="#166534" strokeWidth="1" />
        <polygon points="40,9 45,-3 50,9" fill="#86EFAC" stroke="#166534" strokeWidth="1" />
        <polygon points="51,11 56,1 60,13" fill="#86EFAC" stroke="#166534" strokeWidth="1" />
        <path d="M17 50 C11 6 79 6 73 50 C68 30 22 30 17 50 Z" fill="#22C55E" stroke="#166534" strokeWidth="1.4" />
        <circle cx="33" cy="19" r="4" fill="#FFFFFF" stroke="#166534" strokeWidth="1" />
        <circle cx="57" cy="19" r="4" fill="#FFFFFF" stroke="#166534" strokeWidth="1" />
        <circle cx="34" cy="19" r="1.8" fill="#111827" />
        <circle cx="58" cy="19" r="1.8" fill="#111827" />
        <path d="M30 28 L33 32 L36 28 L39 32 L42 28 L45 32 L48 28 L51 32 L54 28 L57 32 L60 28" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
      </g>
    );
  }
  if (id === "policecap") {
    return (
      <g>
        <path d="M23 22 C20 6 70 6 67 22 Z" fill="#1E3A8A" stroke="#0F172A" strokeWidth="1.2" />
        <ellipse cx="45" cy="23" rx="22" ry="4.5" fill="#111827" />
        <polygon points="45,8 47,13 52,13 48,16 49.5,21 45,18 40.5,21 42,16 38,13 43,13" fill="#FACC15" stroke="#A16207" strokeWidth="0.6" />
      </g>
    );
  }
  return null;
}

function FaceWear(props: { id: string }) {
  if (props.id === "sunglasses") {
    return (
      <g>
        <rect x="27.5" y="34.5" width="16" height="11" rx="4.5" fill="#111827" />
        <rect x="46.5" y="34.5" width="16" height="11" rx="4.5" fill="#111827" />
        <path d="M43.5 38 H46.5" stroke="#111827" strokeWidth="2.5" />
        <path d="M27.5 37 L21 34" stroke="#111827" strokeWidth="2" />
        <path d="M62.5 37 L69 34" stroke="#111827" strokeWidth="2" />
        <path d="M30 37.5 L34 36.5" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
        <path d="M49 37.5 L53 36.5" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
      </g>
    );
  }
  if (props.id === "goggles") {
    return (
      <g>
        <path d="M21 34 C30 30 60 30 69 34" stroke="#78350F" strokeWidth="5" fill="none" />
        <circle cx="36" cy="36" r="8" fill="#BAE6FD" fillOpacity="0.75" stroke="#92400E" strokeWidth="3" />
        <circle cx="54" cy="36" r="8" fill="#BAE6FD" fillOpacity="0.75" stroke="#92400E" strokeWidth="3" />
        <path d="M32 33 L35 31.5" stroke="#FFFFFF" strokeWidth="1.6" />
        <path d="M50 33 L53 31.5" stroke="#FFFFFF" strokeWidth="1.6" />
      </g>
    );
  }
  return null;
}

function BackWear(props: { id: string }) {
  if (props.id === "cape") {
    return (
      <g>
        <path d="M27 50 L8 104 C30 98 60 98 82 104 L63 50 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
        <path d="M14 96 L20 84 M76 96 L70 84" stroke="#FCA5A5" strokeWidth="2" />
      </g>
    );
  }
  if (props.id === "rocketpack") {
    return (
      <g>
        <ellipse cx="11" cy="88" rx="4" ry="8" fill="#F97316" />
        <ellipse cx="79" cy="88" rx="4" ry="8" fill="#F97316" />
        <ellipse cx="11" cy="87" rx="2" ry="5" fill="#FDE68A" />
        <ellipse cx="79" cy="87" rx="2" ry="5" fill="#FDE68A" />
        <rect x="4" y="52" width="14" height="30" rx="6" fill="#E5E7EB" stroke="#475569" strokeWidth="1.5" />
        <rect x="72" y="52" width="14" height="30" rx="6" fill="#E5E7EB" stroke="#475569" strokeWidth="1.5" />
        <polygon points="4,55 11,40 18,55" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
        <polygon points="72,55 79,40 86,55" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
      </g>
    );
  }
  return null;
}

function BackFront(props: { id: string }) {
  if (props.id === "cape") {
    return (
      <g>
        <path d="M28 54 C38 60 52 60 62 54" stroke="#DC2626" strokeWidth="4" fill="none" />
        <circle cx="45" cy="59" r="4" fill="#FACC15" stroke="#A16207" strokeWidth="1" />
      </g>
    );
  }
  if (props.id === "rocketpack") {
    return (
      <g>
        <path d="M31 56 L35 86" stroke="#475569" strokeWidth="3.5" />
        <path d="M59 56 L55 86" stroke="#475569" strokeWidth="3.5" />
      </g>
    );
  }
  return null;
}

function HoldWear(props: { id: string }) {
  if (props.id === "racecar") {
    return (
      <g>
        <path d="M60 84 L64 77 H78 L84 84 Z" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1" />
        <rect x="56" y="83" width="32" height="9" rx="3.5" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1" />
        <path d="M66 79 H76 L80 84 H64 Z" fill="#BFDBFE" />
        <circle cx="63" cy="93" r="4" fill="#111827" />
        <circle cx="81" cy="93" r="4" fill="#111827" />
        <circle cx="63" cy="93" r="1.5" fill="#D1D5DB" />
        <circle cx="81" cy="93" r="1.5" fill="#D1D5DB" />
        <text x="72" y="90.5" fontSize="6" textAnchor="middle" fontWeight="900" fill="#FFFFFF">1</text>
      </g>
    );
  }
  if (props.id === "soccer") {
    return (
      <g>
        <circle cx="76" cy="86" r="10" fill="#FFFFFF" stroke="#111827" strokeWidth="1.5" />
        <polygon points="76,81 80.5,84.3 78.8,89.5 73.2,89.5 71.5,84.3" fill="#111827" />
        <path d="M76 81 V76.5 M80.5 84.3 L85 82.5 M78.8 89.5 L81.5 94 M73.2 89.5 L70.5 94 M71.5 84.3 L67 82.5" stroke="#111827" strokeWidth="1.2" />
      </g>
    );
  }
  if (props.id === "trophy") {
    return (
      <g>
        <path d="M67 77 C61 77 61 85 68 86" stroke="#A16207" strokeWidth="2" fill="none" />
        <path d="M85 77 C91 77 91 85 84 86" stroke="#A16207" strokeWidth="2" fill="none" />
        <path d="M66 74 H86 C86 86 80 90 76 90 C72 90 66 86 66 74 Z" fill="#FACC15" stroke="#A16207" strokeWidth="1.4" />
        <rect x="74" y="90" width="4" height="5" fill="#EAB308" />
        <rect x="69" y="95" width="14" height="5" rx="1.5" fill="#A16207" />
        <polygon points="76,77 77.3,80.3 80.8,80.3 78,82.4 79,85.7 76,83.7 73,85.7 74,82.4 71.2,80.3 74.7,80.3" fill="#FFFFFF" />
      </g>
    );
  }
  return null;
}

function Yaya(props: { mood: "idle" | "cheer" | "hint"; size?: number; outfit?: Outfit }) {
  const s = props.size || 86;
  const cheer = props.mood === "cheer";
  const hint = props.mood === "hint";
  const o: Outfit = props.outfit || { head: "none", face: "none", back: "none", hold: "none" };
  return (
    <svg width={s} height={s * 1.2} viewBox="-4 -6 98 116" aria-label="Yaya the penguin" style={{
      display: "block",
      overflow: "visible",
      animation: cheer ? "miles-yaya-cheer 600ms ease-in-out infinite" : hint ? "miles-hop 900ms ease-in-out infinite" : "none",
    }}>
      <ellipse cx="45" cy="102" rx="22" ry="5" fill="rgba(0,0,0,0.16)" />
      <BackWear id={o.back} />
      <ellipse cx="18" cy={cheer ? 38 : 72} rx="8" ry="16" fill="#6E7B88" transform={cheer ? "rotate(-40 18 38)" : "rotate(-18 18 72)"} />
      <ellipse cx="45" cy="64" rx="28" ry="33" fill="#8B97A3" />
      <circle cx="28" cy="52" r="2.2" fill="#A8B2BC" />
      <circle cx="62" cy="58" r="1.8" fill="#A8B2BC" />
      <circle cx="34" cy="78" r="2" fill="#748190" />
      <circle cx="58" cy="82" r="1.6" fill="#A8B2BC" />
      <circle cx="24" cy="68" r="1.4" fill="#748190" />
      <circle cx="66" cy="70" r="2.1" fill="#748190" />
      <circle cx="40" cy="90" r="1.5" fill="#A8B2BC" />
      <circle cx="52" cy="50" r="1.3" fill="#748190" />
      <ellipse cx="45" cy="74" rx="17" ry="22" fill="#FFFDF8" />
      <BackFront id={o.back} />
      <ellipse cx="45" cy="36" rx="24" ry="22" fill="#8B97A3" />
      <circle cx="30" cy="24" r="1.6" fill="#A8B2BC" />
      <circle cx="58" cy="22" r="1.3" fill="#748190" />
      <circle cx="48" cy="18" r="1.5" fill="#A8B2BC" />
      <ellipse cx="45" cy="40" rx="19" ry="17" fill="#FFFDF8" />
      <ellipse cx="33" cy="45" rx="4" ry="2.6" fill="#FFB4B4" opacity="0.75" />
      <ellipse cx="57" cy="45" rx="4" ry="2.6" fill="#FFB4B4" opacity="0.75" />
      <ellipse cx="37" cy="40" rx="3.2" ry="3.8" fill="#1F2937" />
      <ellipse cx="53" cy="40" rx="3.2" ry="3.8" fill="#1F2937" />
      <circle cx="36" cy="38.5" r="1.1" fill="#FFFFFF" />
      <circle cx="52" cy="38.5" r="1.1" fill="#FFFFFF" />
      <FaceWear id={o.face} />
      <path d="M45 44 L52.5 50 L45 55 L37.5 50 Z" fill="#F59E0B" />
      <path d="M45 48 L50 50.5 L45 53 L40 50.5 Z" fill="#EA580C" />
      <HeadWear id={o.head} />
      <ellipse cx="72" cy={cheer ? 38 : 72} rx="8" ry="16" fill="#6E7B88" transform={cheer ? "rotate(40 72 38)" : "rotate(18 72 72)"} />
      <ellipse cx="34" cy="97" rx="10" ry="5.2" fill="#F97316" />
      <ellipse cx="56" cy="97" rx="10" ry="5.2" fill="#F97316" />
      <ellipse cx="34" cy="96" rx="4" ry="2" fill="#FDBA74" />
      <ellipse cx="56" cy="96" rx="4" ry="2" fill="#FDBA74" />
      <HoldWear id={o.hold} />
    </svg>
  );
}

function starPts(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    pts.push((cx + Math.cos(ang) * rad).toFixed(1) + "," + (cy + Math.sin(ang) * rad).toFixed(1));
  }
  return pts.join(" ");
}

function RexHead(props: { id: string }) {
  const id = props.id;
  if (id === "rexcap") {
    return (
      <g>
        <path d="M23 21 C22 1 70 1 69 21 Z" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.4" />
        <path d="M60 19 C72 16 86 18 89 23 C78 25 67 25 58 23 Z" fill="#1D4ED8" stroke="#1E3A8A" strokeWidth="1.2" />
        <circle cx="46" cy="3.5" r="2.5" fill="#1E3A8A" />
        <text x="46" y="17" fontSize="11" textAnchor="middle" fontWeight="900" fill="#FFFFFF">R</text>
      </g>
    );
  }
  if (id === "rexcrown") {
    return (
      <g>
        <polygon points="25,22 27,2 36,13 46,-2 56,13 65,2 67,22" fill="#FACC15" stroke="#A16207" strokeWidth="1.4" />
        <rect x="25" y="17" width="42" height="6" fill="#EAB308" stroke="#A16207" strokeWidth="1" />
        <circle cx="36" cy="20" r="2.2" fill="#DC2626" />
        <circle cx="46" cy="20" r="2.2" fill="#2563EB" />
        <circle cx="56" cy="20" r="2.2" fill="#16A34A" />
      </g>
    );
  }
  if (id === "rexcowboy") {
    return (
      <g>
        <ellipse cx="46" cy="19" rx="36" ry="6.5" fill="#92400E" stroke="#451A03" strokeWidth="1.3" />
        <path d="M29 19 C28 -1 64 -1 63 19 Z" fill="#B45309" stroke="#451A03" strokeWidth="1.3" />
        <path d="M46 2 C44 8 44 12 46 16" stroke="#78350F" strokeWidth="1.6" fill="none" />
        <rect x="29" y="13" width="34" height="4.5" fill="#451A03" />
        <polygon points={starPts(46, 15.5, 3, 1.3)} fill="#FACC15" />
      </g>
    );
  }
  return null;
}

function RexFace(props: { id: string }) {
  if (props.id === "rexshades") {
    return (
      <g>
        <polygon points={starPts(35, 29, 11, 5.5)} fill="#111827" stroke="#F97316" strokeWidth="2" />
        <polygon points={starPts(57, 29, 11, 5.5)} fill="#111827" stroke="#F97316" strokeWidth="2" />
        <path d="M42 29 H50" stroke="#F97316" strokeWidth="2.5" />
        <path d="M24 28 L18 25 M68 28 L74 25" stroke="#F97316" strokeWidth="2" />
      </g>
    );
  }
  if (props.id === "rexpatch") {
    return (
      <g>
        <path d="M20 20 L72 33" stroke="#111827" strokeWidth="2.2" />
        <ellipse cx="57" cy="29" rx="8" ry="7" fill="#111827" />
        <path d="M54 26 L60 32 M60 26 L54 32" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.7" />
      </g>
    );
  }
  if (props.id === "rexstache") {
    return <path d="M46 43 C41 38 31 39 27 46 C33 44 39 46 46 45 C53 46 59 44 65 46 C61 39 51 38 46 43 Z" fill="#78350F" stroke="#451A03" strokeWidth="1" />;
  }
  return null;
}

function RexBack(props: { id: string }) {
  if (props.id === "rexwings") {
    return (
      <g>
        <path d="M28 58 L0 34 L6 52 L-3 62 L10 66 L22 82 Z" fill="#A855F7" stroke="#581C87" strokeWidth="1.5" />
        <path d="M64 58 L92 34 L86 52 L95 62 L82 66 L70 82 Z" fill="#A855F7" stroke="#581C87" strokeWidth="1.5" />
        <path d="M24 64 L6 52 M68 64 L86 52" stroke="#581C87" strokeWidth="1.2" />
      </g>
    );
  }
  if (props.id === "rexpack") {
    return (
      <g>
        <rect x="66" y="52" width="22" height="32" rx="6" fill="#A16207" stroke="#451A03" strokeWidth="1.5" />
        <path d="M66 62 H88" stroke="#451A03" strokeWidth="1.4" />
        <rect x="72" y="66" width="10" height="8" rx="2" fill="#CA8A04" stroke="#451A03" strokeWidth="1" />
      </g>
    );
  }
  if (props.id === "rexcape") {
    return (
      <g>
        <path d="M27 50 L8 106 C30 100 62 100 86 106 L67 50 Z" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.5" />
        <path d="M14 98 L20 86 M80 98 L74 86" stroke="#93C5FD" strokeWidth="2" />
      </g>
    );
  }
  return null;
}

function RexBackFront(props: { id: string }) {
  if (props.id === "rexpack") {
    return (
      <g>
        <path d="M33 52 L37 84" stroke="#451A03" strokeWidth="3.5" />
        <path d="M61 52 L57 84" stroke="#451A03" strokeWidth="3.5" />
      </g>
    );
  }
  if (props.id === "rexcape") {
    return (
      <g>
        <path d="M30 52 C40 58 54 58 64 52" stroke="#2563EB" strokeWidth="4" fill="none" />
        <circle cx="47" cy="57" r="5" fill="#FACC15" stroke="#A16207" strokeWidth="1" />
        <text x="47" y="59.5" fontSize="7" textAnchor="middle" fontWeight="900" fill="#1E3A8A">R</text>
      </g>
    );
  }
  return null;
}

function RexHold(props: { id: string }) {
  if (props.id === "rexguitar") {
    return (
      <g>
        <path d="M78 76 L94 48" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
        <rect x="90" y="42" width="7" height="8" rx="2" fill="#451A03" transform="rotate(30 93 46)" />
        <ellipse cx="72" cy="86" rx="11" ry="9" fill="#F97316" stroke="#7C2D12" strokeWidth="1.5" />
        <ellipse cx="78" cy="77" rx="8" ry="7" fill="#F97316" stroke="#7C2D12" strokeWidth="1.5" />
        <circle cx="74" cy="82" r="3" fill="#451A03" />
        <path d="M70 90 L92 50" stroke="#FDE68A" strokeWidth="0.8" />
      </g>
    );
  }
  if (props.id === "rexburger") {
    return (
      <g>
        <path d="M62 78 C62 66 90 66 90 78 Z" fill="#D97706" stroke="#78350F" strokeWidth="1.3" />
        <circle cx="70" cy="72" r="0.9" fill="#FEF3C7" />
        <circle cx="77" cy="70" r="0.9" fill="#FEF3C7" />
        <circle cx="83" cy="73" r="0.9" fill="#FEF3C7" />
        <path d="M61 79 L64 82 L67 79 L70 82 L73 79 L76 82 L79 79 L82 82 L85 79 L88 82 L91 79" stroke="#16A34A" strokeWidth="2.4" fill="none" />
        <polygon points="62,82 90,82 86,87 66,87" fill="#FACC15" />
        <rect x="61" y="84" width="30" height="6" rx="3" fill="#7C2D12" />
        <rect x="62" y="89" width="28" height="6" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />
      </g>
    );
  }
  if (props.id === "rexrocket") {
    return (
      <g transform="rotate(-25 78 78)">
        <ellipse cx="78" cy="96" rx="4" ry="6" fill="#F97316" />
        <rect x="72" y="66" width="12" height="28" rx="6" fill="#E5E7EB" stroke="#475569" strokeWidth="1.3" />
        <path d="M72 70 L78 56 L84 70 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
        <circle cx="78" cy="76" r="3" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1" />
        <path d="M72 86 L66 96 L72 92 Z M84 86 L90 96 L84 92 Z" fill="#DC2626" />
      </g>
    );
  }
  return null;
}

function Rex(props: { mood: "idle" | "cheer" | "hint"; size?: number; outfit?: Outfit }) {
  const s = props.size || 86;
  const roar = props.mood === "cheer";
  const hint = props.mood === "hint";
  const o: Outfit = props.outfit || NO_OUTFIT;
  return (
    <svg width={s} height={s * 1.2} viewBox="-4 -6 98 116" aria-label="Rex the dino" style={{
      display: "block",
      overflow: "visible",
      animation: roar ? "miles-stomp 520ms ease-in-out infinite" : hint ? "miles-hop 900ms ease-in-out infinite" : "none",
    }}>
      <ellipse cx="46" cy="104" rx="26" ry="5" fill="rgba(0,0,0,0.16)" />
      <RexBack id={o.back} />
      <path d="M24 74 C8 80 -2 92 -4 100 C10 98 22 92 30 88 Z" fill="#22C55E" stroke="#166534" strokeWidth="1.4" />
      <polygon points="14,82 10,72 20,78" fill="#F97316" />
      <polygon points="22,72 20,61 29,68" fill="#F97316" />
      <ellipse cx="47" cy="70" rx="26" ry="28" fill="#4ADE80" stroke="#166534" strokeWidth="1.5" />
      <ellipse cx="49" cy="76" rx="15" ry="19" fill="#FEF3C7" />
      <path d="M38 68 H60 M36 76 H62 M38 84 H60" stroke="#FDE68A" strokeWidth="2" />
      <circle cx="30" cy="80" r="2.4" fill="#16A34A" />
      <circle cx="66" cy="66" r="2" fill="#16A34A" />
      <circle cx="64" cy="86" r="2.6" fill="#16A34A" />
      <RexBackFront id={o.back} />
      <ellipse cx="29" cy={roar ? 54 : 62} rx="4.5" ry="8" fill="#22C55E" stroke="#166534" strokeWidth="1.2" transform={roar ? "rotate(-50 29 54)" : "rotate(-25 29 62)"} />
      <polygon points="34,13 38,2 42,12" fill="#F97316" stroke="#9A3412" strokeWidth="0.8" />
      <polygon points="43,10 47,-2 51,10" fill="#F97316" stroke="#9A3412" strokeWidth="0.8" />
      <polygon points="52,12 56,2 60,13" fill="#F97316" stroke="#9A3412" strokeWidth="0.8" />
      <ellipse cx="46" cy="32" rx="25" ry="21" fill="#4ADE80" stroke="#166534" strokeWidth="1.5" />
      <ellipse cx="47" cy="42" rx="20" ry="11" fill="#4ADE80" />
      <circle cx="35" cy="28" r="5.5" fill="#FFFFFF" stroke="#166534" strokeWidth="1" />
      <circle cx="57" cy="28" r="5.5" fill="#FFFFFF" stroke="#166534" strokeWidth="1" />
      <circle cx="36" cy="29" r="2.6" fill="#111827" />
      <circle cx="58" cy="29" r="2.6" fill="#111827" />
      <circle cx="35" cy="27.8" r="0.9" fill="#FFFFFF" />
      <circle cx="57" cy="27.8" r="0.9" fill="#FFFFFF" />
      <ellipse cx="27" cy="40" rx="4" ry="2.5" fill="#FDA4AF" opacity="0.8" />
      <ellipse cx="66" cy="40" rx="4" ry="2.5" fill="#FDA4AF" opacity="0.8" />
      <circle cx="42" cy="37" r="1.3" fill="#166534" />
      <circle cx="51" cy="37" r="1.3" fill="#166534" />
      {roar ? (
        <g>
          <ellipse cx="46.5" cy="48" rx="13" ry="7.5" fill="#7F1D1D" />
          <ellipse cx="46.5" cy="51" rx="7" ry="3" fill="#F87171" />
          <polygon points="35,43 37.5,47 40,43 42.5,47 45,43 47.5,47 50,43 52.5,47 55,43 57.5,47 58.5,43.5" fill="#FFFFFF" />
        </g>
      ) : (
        <g>
          <path d="M31 45 Q46.5 54 62 45" stroke="#166534" strokeWidth="2" fill="none" />
          <polygon points="36,46.4 38,49.5 40,47.8" fill="#FFFFFF" />
          <polygon points="53,47.8 55,49.5 57,46.4" fill="#FFFFFF" />
        </g>
      )}
      <RexFace id={o.face} />
      <RexHead id={o.head} />
      <ellipse cx="65" cy={roar ? 54 : 62} rx="4.5" ry="8" fill="#22C55E" stroke="#166534" strokeWidth="1.2" transform={roar ? "rotate(50 65 54)" : "rotate(25 65 62)"} />
      <ellipse cx="34" cy="99" rx="12" ry="6.5" fill="#22C55E" stroke="#166534" strokeWidth="1.4" />
      <ellipse cx="60" cy="99" rx="12" ry="6.5" fill="#22C55E" stroke="#166534" strokeWidth="1.4" />
      <path d="M26 101 L28 97 M33 102 L34 97 M40 101 L39 97 M52 101 L54 97 M59 102 L60 97 M66 101 L65 97" stroke="#FFFFFF" strokeWidth="2" />
      <RexHold id={o.hold} />
    </svg>
  );
}

function BuddyPic(props: { buddy: Buddy; mood: "idle" | "cheer" | "hint"; size?: number; outfit?: Outfit }) {
  if (props.buddy === "rex") return <Rex mood={props.mood} size={props.size} outfit={props.outfit} />;
  return <Yaya mood={props.mood} size={props.size} outfit={props.outfit} />;
}

function Wheel(props: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={props.x} cy={props.y} r={props.r} fill="#1F2937" />
      <circle cx={props.x} cy={props.y} r={props.r * 0.42} fill="#D1D5DB" />
    </g>
  );
}

function CarArt(props: { car: Car; w: number; gold?: boolean }) {
  const car = props.car;
  const c = props.gold ? "#FACC15" : car.color;
  const edge = props.gold ? "#A16207" : "#0F172A";
  const glass = "#BFDBFE";
  const sw = 1.5;
  const parts: Array<ReturnType<typeof Wheel>> = [];
  const b = car.body;
  if (b === "race") {
    parts.push(<path key="b" d="M6 58 L12 46 L42 42 L54 30 L76 30 L88 42 L112 47 L114 58 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M57 33 H74 L84 42 H48 Z" fill={glass} />);
    parts.push(<rect key="s" x="4" y="34" width="14" height="5" rx="1.5" fill={edge} />);
    parts.push(<path key="s2" d="M10 39 V46" stroke={edge} strokeWidth="3" />);
    parts.push(<Wheel key="w1" x={30} y={60} r={11} />, <Wheel key="w2" x={94} y={60} r={11} />);
  } else if (b === "sedan" || b === "limo") {
    const x0 = b === "limo" ? 2 : 10, x1 = b === "limo" ? 118 : 110;
    parts.push(<rect key="b" x={x0} y="36" width={x1 - x0} height="22" rx="8" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="t" d={b === "limo" ? "M24 36 L34 20 H88 L98 36 Z" : "M30 36 L42 18 H78 L92 36 Z"} fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d={b === "limo" ? "M37 22 H58 V35 H29 Z M62 22 H86 L94 35 H62 Z" : "M44 21 H58 V35 H35 Z M62 21 H76 L86 35 H62 Z"} fill={glass} />);
    parts.push(<Wheel key="w1" x={b === "limo" ? 24 : 32} y={60} r={10} />, <Wheel key="w2" x={b === "limo" ? 96 : 88} y={60} r={10} />);
  } else if (b === "truck") {
    parts.push(<rect key="box" x="4" y="16" width="74" height="42" rx="4" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="cab" d="M80 58 V28 H102 L114 42 V58 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M86 32 H100 L108 42 H86 Z" fill={glass} />);
    parts.push(<Wheel key="w1" x={24} y={60} r={10} />, <Wheel key="w2" x={56} y={60} r={10} />, <Wheel key="w3" x={98} y={60} r={10} />);
  } else if (b === "bus") {
    parts.push(<rect key="b" x="3" y="14" width="113" height="44" rx="8" fill={c} stroke={edge} strokeWidth={sw} />);
    for (let i = 0; i < 5; i++) parts.push(<rect key={"win" + i} x={10 + i * 18} y="20" width="13" height="13" rx="2" fill={glass} stroke={edge} strokeWidth="0.8" />);
    parts.push(<path key="ws" d="M100 20 H110 L113 36 H100 Z" fill={glass} />);
    parts.push(<path key="stripe" d="M3 42 H116" stroke={edge} strokeWidth="2" />);
    parts.push(<Wheel key="w1" x={26} y={60} r={10} />, <Wheel key="w2" x={92} y={60} r={10} />);
  } else if (b === "van") {
    parts.push(<path key="b" d="M6 58 V24 C6 20 9 18 13 18 H92 L112 38 V58 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M94 23 L106 37 H94 Z" fill={glass} />);
    parts.push(<rect key="win" x="70" y="24" width="18" height="12" rx="2" fill={glass} />);
    parts.push(<Wheel key="w1" x={28} y={60} r={10} />, <Wheel key="w2" x={92} y={60} r={10} />);
  } else if (b === "monster") {
    parts.push(<rect key="b" x="16" y="22" width="88" height="20" rx="6" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="t" d="M36 22 L44 8 H72 L82 22 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M46 11 H70 L77 21 H41 Z" fill={glass} />);
    parts.push(<path key="sus" d="M32 42 V48 M88 42 V48" stroke="#475569" strokeWidth="4" />);
    parts.push(<Wheel key="w1" x={32} y={58} r={17} />, <Wheel key="w2" x={88} y={58} r={17} />);
    parts.push(<circle key="t1" cx="32" cy="58" r="17" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 3" />);
    parts.push(<circle key="t2" cx="88" cy="58" r="17" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 3" />);
  } else if (b === "dump") {
    parts.push(<polygon key="bed" points="4,18 74,24 70,52 10,52" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="lines" d="M22 22 L20 50 M40 23 L38 51 M58 24 L56 51" stroke={edge} strokeWidth="1.2" opacity="0.5" />);
    parts.push(<rect key="ch" x="6" y="52" width="104" height="6" fill="#475569" />);
    parts.push(<path key="cab" d="M78 52 V26 H100 L112 40 V58 H78 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M84 30 H98 L106 40 H84 Z" fill={glass} />);
    parts.push(<Wheel key="w1" x={24} y={60} r={10} />, <Wheel key="w2" x={50} y={60} r={10} />, <Wheel key="w3" x={96} y={60} r={10} />);
  } else if (b === "tow") {
    parts.push(<rect key="bed" x="4" y="44" width="70" height="12" fill="#475569" stroke={edge} strokeWidth="1" />);
    parts.push(<path key="arm" d="M30 44 L14 18 L6 22" stroke="#334155" strokeWidth="4" fill="none" />);
    parts.push(<path key="hook" d="M6 22 V34 C6 40 14 40 12 34" stroke="#334155" strokeWidth="2.5" fill="none" />);
    parts.push(<path key="cab" d="M70 56 V24 H96 L112 40 V56 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M76 28 H94 L104 40 H76 Z" fill={glass} />);
    parts.push(<rect key="light" x="80" y="18" width="12" height="6" rx="2" fill="#F59E0B" stroke={edge} strokeWidth="1" />);
    parts.push(<Wheel key="w1" x={26} y={60} r={10} />, <Wheel key="w2" x={92} y={60} r={10} />);
  } else if (b === "mixer") {
    parts.push(<rect key="ch" x="4" y="50" width="106" height="7" fill="#475569" />);
    parts.push(<ellipse key="drum" cx="40" cy="34" rx="34" ry="17" fill={c} stroke={edge} strokeWidth={sw} transform="rotate(-10 40 34)" />);
    parts.push(<path key="str" d="M20 22 L34 48 M38 18 L52 46 M56 18 L66 40" stroke="#F97316" strokeWidth="4" />);
    parts.push(<path key="cab" d="M80 50 V24 H100 L112 38 V57 H80 Z" fill="#F97316" stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M85 28 H98 L106 38 H85 Z" fill={glass} />);
    parts.push(<Wheel key="w1" x={22} y={60} r={10} />, <Wheel key="w2" x={50} y={60} r={10} />, <Wheel key="w3" x={96} y={60} r={10} />);
  } else if (b === "tractor") {
    parts.push(<rect key="hood" x="50" y="34" width="56" height="18" rx="4" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="cab" d="M20 52 V14 H52 V52 Z" fill="none" stroke={edge} strokeWidth="4" />);
    parts.push(<rect key="roof" x="16" y="10" width="40" height="6" rx="2" fill={c} stroke={edge} strokeWidth="1" />);
    parts.push(<rect key="seat" x="20" y="34" width="32" height="18" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="pipe" d="M92 34 V16" stroke="#334155" strokeWidth="4" />);
    parts.push(<Wheel key="w1" x={34} y={56} r={18} />, <Wheel key="w2" x={96} y={62} r={10} />);
  } else if (b === "pickup") {
    parts.push(<path key="b" d="M6 58 V40 H54 V22 H86 L100 40 H112 V58 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M60 26 H84 L95 39 H60 Z" fill={glass} />);
    parts.push(<path key="bed" d="M8 40 H52" stroke={edge} strokeWidth="2" />);
    parts.push(<Wheel key="w1" x={28} y={60} r={10} />, <Wheel key="w2" x={92} y={60} r={10} />);
  } else if (b === "dozer") {
    parts.push(<rect key="trk" x="10" y="50" width="80" height="16" rx="8" fill="#1F2937" />);
    for (let i = 0; i < 5; i++) parts.push(<circle key={"r" + i} cx={18 + i * 16} cy="58" r="4.5" fill="#9CA3AF" />);
    parts.push(<rect key="body" x="16" y="30" width="70" height="20" rx="3" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<rect key="cab" x="24" y="10" width="30" height="20" rx="2" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<rect key="g" x="28" y="14" width="22" height="12" fill={glass} />);
    parts.push(<path key="arm" d="M86 44 L100 44" stroke="#334155" strokeWidth="4" />);
    parts.push(<path key="blade" d="M98 26 C112 30 112 58 98 66 L104 66 C118 58 118 30 104 26 Z" fill="#9CA3AF" stroke={edge} strokeWidth="1.2" />);
  } else {
    parts.push(<path key="b" d="M8 58 V30 H30 L40 18 H84 V30 H106 V58 Z" fill={c} stroke={edge} strokeWidth={sw} />);
    parts.push(<path key="g" d="M44 22 H80 V32 H36 Z" fill={glass} />);
    parts.push(<circle key="spare" cx="8" cy="40" r="9" fill="#1F2937" stroke="#475569" strokeWidth="2" />);
    parts.push(<path key="bar" d="M86 26 V18 H40" stroke="#334155" strokeWidth="2.5" fill="none" />);
    parts.push(<Wheel key="w1" x={32} y={60} r={11} />, <Wheel key="w2" x={88} y={60} r={11} />);
  }
  const d = car.deco;
  if (d === "num") parts.push(<g key="d"><circle cx="34" cy="49" r="6.5" fill="#FFFFFF" stroke={edge} strokeWidth="1" /><text x="34" y="52.5" fontSize="9" textAnchor="middle" fontWeight="900" fill="#0F172A">1</text></g>);
  if (d === "stripe") parts.push(<path key="d" d="M12 50 H112" stroke="#FFFFFF" strokeWidth="4" />);
  if (d === "ladder") parts.push(<g key="d"><rect x="8" y="9" width="66" height="6" fill="#E5E7EB" stroke="#475569" strokeWidth="1" /><path d="M16 9 V15 M26 9 V15 M36 9 V15 M46 9 V15 M56 9 V15 M66 9 V15" stroke="#475569" strokeWidth="1.5" /><rect x="88" y="22" width="12" height="6" rx="2" fill="#F59E0B" stroke={edge} strokeWidth="1" /></g>);
  if (d === "police" || d === "chief") parts.push(<g key="d"><rect x="50" y="12" width="9" height="6" rx="2" fill="#DC2626" stroke={edge} strokeWidth="1" /><rect x="61" y="12" width="9" height="6" rx="2" fill="#3B82F6" stroke={edge} strokeWidth="1" />{d === "police" ? <><rect x="20" y="42" width="80" height="10" fill="#FFFFFF" /><text x="60" y="50.5" fontSize="9" textAnchor="middle" fontWeight="900" fill="#1E3A8A">POLICE</text></> : <text x="60" y="51" fontSize="9" textAnchor="middle" fontWeight="900" fill="#FFFFFF">CHIEF</text>}</g>);
  if (d === "taxi") parts.push(<g key="d"><rect x="50" y="10" width="20" height="8" rx="2" fill="#FFFFFF" stroke={edge} strokeWidth="1" /><text x="60" y="16.5" fontSize="6.5" textAnchor="middle" fontWeight="900" fill="#0F172A">TAXI</text><path d="M14 48 H106" stroke="#0F172A" strokeWidth="4" strokeDasharray="5 5" /></g>);
  if (d === "cross") parts.push(<g key="d"><rect x="30" y="28" width="22" height="22" fill="#FFFFFF" /><path d="M41 31 V47 M33 39 H49" stroke="#DC2626" strokeWidth="5" /><rect x="40" y="12" width="14" height="6" rx="2" fill="#DC2626" stroke={edge} strokeWidth="1" /></g>);
  if (d === "school") parts.push(<text key="d" x="52" y="53" fontSize="8.5" textAnchor="middle" fontWeight="900" fill="#0F172A">SCHOOL BUS</text>);
  if (d === "garbage") parts.push(<g key="d"><path d="M14 26 H70 M14 36 H70 M14 46 H70" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" /><text x="41" y="42" fontSize="14" textAnchor="middle">♻️</text></g>);
  if (d === "cone") parts.push(<g key="d"><path d="M34 46 L40 30 L46 46 Z" fill="#D97706" /><circle cx="40" cy="28" r="7" fill="#FDF2F8" stroke="#DB2777" strokeWidth="1.5" /><circle cx="40" cy="20" r="4" fill="#DC2626" /></g>);
  if (d === "mail") parts.push(<g key="d"><rect x="22" y="30" width="30" height="18" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="1.5" /><path d="M22 30 L37 41 L52 30" stroke="#1E3A8A" strokeWidth="1.5" fill="none" /><path d="M6 50 H112" stroke="#DC2626" strokeWidth="3" /><path d="M6 54 H112" stroke="#1E3A8A" strokeWidth="3" /></g>);
  if (d === "camper") parts.push(<g key="d"><path d="M6 44 H112" stroke="#FFFFFF" strokeWidth="5" /><rect x="18" y="24" width="20" height="12" rx="2" fill={glass} /><rect x="44" y="24" width="20" height="12" rx="2" fill={glass} /></g>);
  if (d === "flame") parts.push(<g key="d"><path d="M20 50 C30 42 34 54 44 44 C46 50 54 50 60 44" stroke="#F97316" strokeWidth="4" fill="none" /><path d="M20 50 C30 46 34 54 44 48" stroke="#FACC15" strokeWidth="2" fill="none" /></g>);
  if (d === "rocket") parts.push(<g key="d"><path d="M6 46 L-6 42 L-2 50 L-8 54 L6 54 Z" fill="#F97316" /><path d="M6 48 L-2 48 L6 52 Z" fill="#FDE68A" /></g>);
  if (d === "spikes") parts.push(<g key="d"><polygon points="20,22 26,12 32,22" fill="#F97316" /><polygon points="88,22 94,12 100,22" fill="#F97316" /><circle cx="58" cy="32" r="3" fill="#FFFFFF" /><circle cx="58" cy="32" r="1.5" fill="#111827" /></g>);
  if (props.gold) {
    parts.push(<polygon key="sp1" points={starPts(14, 14, 7, 3)} fill="#FFFFFF" stroke="#A16207" strokeWidth="1" />);
    parts.push(<polygon key="sp2" points={starPts(108, 18, 5, 2.2)} fill="#FFFFFF" stroke="#A16207" strokeWidth="1" />);
  }
  return (
    <svg width={props.w} height={(props.w * 74) / 124} viewBox="-6 2 128 74" style={{ display: "block", maxWidth: "100%", height: "auto", overflow: "visible" }} aria-label={(props.gold ? "Golden " : "") + car.name}>
      <ellipse cx="60" cy="71" rx="50" ry="3.5" fill="rgba(0,0,0,0.15)" />
      {parts}
    </svg>
  );
}

function ExtraArt(props: { id: string; w: number }) {
  const w = props.w;
  const st: CSSProperties = { display: "block", maxWidth: "100%", height: "auto" };
  if (props.id === "gaspump") {
    return (
      <svg width={w} height={w} viewBox="0 0 80 80" style={st} aria-label="Gas pump">
        <rect x="18" y="12" width="32" height="60" rx="5" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" />
        <rect x="24" y="20" width="20" height="14" rx="2" fill="#F8FAFC" />
        <text x="34" y="31" fontSize="10" textAnchor="middle" fontWeight="900" fill="#0F172A">GAS</text>
        <rect x="12" y="70" width="44" height="6" rx="2" fill="#475569" />
        <path d="M50 40 C64 40 64 56 62 64 L58 64" stroke="#111827" strokeWidth="3" fill="none" />
        <rect x="54" y="60" width="8" height="12" rx="2" fill="#111827" />
      </svg>
    );
  }
  if (props.id === "carwash") {
    return (
      <svg width={w} height={w} viewBox="0 0 80 80" style={st} aria-label="Car wash">
        <path d="M6 76 V22 L40 6 L74 22 V76 Z" fill="#38BDF8" stroke="#075985" strokeWidth="2" />
        <rect x="16" y="34" width="48" height="42" fill="#E0F2FE" stroke="#075985" strokeWidth="1.5" />
        <path d="M22 34 V70 M30 34 V66 M38 34 V70 M46 34 V66 M54 34 V70" stroke="#2563EB" strokeWidth="3" />
        <circle cx="26" cy="20" r="4" fill="#FFFFFF" stroke="#075985" strokeWidth="1" />
        <circle cx="40" cy="16" r="5" fill="#FFFFFF" stroke="#075985" strokeWidth="1" />
        <circle cx="54" cy="20" r="3.5" fill="#FFFFFF" stroke="#075985" strokeWidth="1" />
      </svg>
    );
  }
  if (props.id === "stoplight") {
    return (
      <svg width={w} height={w} viewBox="0 0 80 80" style={st} aria-label="Traffic light">
        <rect x="25" y="56" width="6" height="22" fill="#334155" />
        <rect x="12" y="2" width="32" height="58" rx="8" fill="#1F2937" />
        <circle cx="28" cy="15" r="7" fill="#EF4444" />
        <circle cx="28" cy="31" r="7" fill="#FACC15" />
        <circle cx="28" cy="47" r="7" fill="#22C55E" />
        <text x="47" y="18" fontSize="9" fontWeight="900" fill="#0F172A">STOP</text>
        <text x="47" y="50" fontSize="9" fontWeight="900" fill="#0F172A">GO</text>
      </svg>
    );
  }
  return (
    <svg width={w} height={w} viewBox="0 0 80 80" style={st} aria-label="Champion cup">
      <path d="M20 14 C6 14 6 34 22 36" stroke="#A16207" strokeWidth="4" fill="none" />
      <path d="M60 14 C74 14 74 34 58 36" stroke="#A16207" strokeWidth="4" fill="none" />
      <path d="M18 8 H62 C62 36 50 46 40 46 C30 46 18 36 18 8 Z" fill="#FACC15" stroke="#A16207" strokeWidth="2" />
      <rect x="35" y="46" width="10" height="12" fill="#EAB308" />
      <rect x="22" y="58" width="36" height="14" rx="3" fill="#A16207" />
      <polygon points={starPts(40, 24, 10, 4.5)} fill="#FFFFFF" />
    </svg>
  );
}

function TrophyArt(props: { cost: number; w: number }) {
  return (
    <svg width={props.w} height={props.w} viewBox="0 0 80 80" style={{ display: "block", maxWidth: "100%", height: "auto" }} aria-label={props.cost + "-star trophy"}>
      <path d="M20 10 H60 C60 34 50 44 40 44 C30 44 20 34 20 10 Z" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
      <rect x="35" y="44" width="10" height="10" fill="#94A3B8" />
      <rect x="18" y="54" width="44" height="20" rx="3" fill="#475569" />
      <text x="40" y="69" fontSize="13" textAnchor="middle" fontWeight="900" fill="#FFFFFF">{props.cost}</text>
      <polygon points={starPts(40, 25, 10, 4.5)} fill="#FACC15" stroke="#A16207" strokeWidth="1" />
    </svg>
  );
}

function RewardArt(props: { r: Reward; size: number }) {
  const r = props.r;
  if (r.kind === "yaya") {
    const it = findItem(r.id);
    const o: Outfit = { ...NO_OUTFIT };
    if (it) o[it.slot] = it.id;
    return <Yaya mood="idle" size={props.size * 0.8} outfit={o} />;
  }
  if (r.kind === "rexpal") return <Rex mood="idle" size={props.size * 0.8} />;
  if (r.kind === "rex") {
    const it = findRexItem(r.id);
    const o: Outfit = { ...NO_OUTFIT };
    if (it) o[it.slot] = it.id;
    return <Rex mood="idle" size={props.size * 0.8} outfit={o} />;
  }
  if (r.kind === "car" || r.kind === "gold") {
    const car = carById(r.id.replace(/^(car|gold)-/, ""));
    return car ? <CarArt car={car} w={props.size * 1.3} gold={r.kind === "gold"} /> : null;
  }
  if (r.kind === "extra") return <ExtraArt id={r.id} w={props.size} />;
  return <TrophyArt cost={r.cost} w={props.size} />;
}

function unlockMessage(list: Reward[]): { text: string; speak: string } {
  const texts: string[] = [];
  const speaks: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const nm = r.name.toLowerCase();
    if (r.kind === "yaya") { texts.push("New for Yaya: the " + r.name + "! Tap Dress Up to try it on."); speaks.push("You got the " + nm + " for Yaya!"); }
    else if (r.kind === "rexpal") { texts.push("Rex the dino is here! Tap Rex on the map to play with him."); speaks.push("ROAR! Rex the dino is here!"); }
    else if (r.kind === "rex") { texts.push("New for Rex: the " + r.name + "! Tap Dress Up to try it on."); speaks.push("You got the " + nm + " for Rex!"); }
    else if (r.kind === "car") { texts.push((r.cost === GARAGE_OPEN ? "The garage is open! " : "") + "New car: the " + r.name + "! Tap Garage to see it."); speaks.push((r.cost === GARAGE_OPEN ? "The garage is open! " : "") + "Vroom! You got the " + nm + "!"); }
    else if (r.kind === "gold") { texts.push("✨ The " + r.name + " is in your garage!"); speaks.push("Wow! The " + nm + "!"); }
    else if (r.kind === "extra") { texts.push("New for the garage: the " + r.name + "!"); speaks.push("You got the " + nm + " for the garage!"); }
    else { texts.push("🏆 You won the " + r.name + "!"); speaks.push("You won the " + nm + "!"); }
  }
  return { text: texts.join(" "), speak: speaks.join(" ") };
}

function LetterTruck(props: { big: string; small: string; hooked: boolean }) {
  return (
    <svg width="440" height="190" viewBox="0 0 440 190" style={{ display: "block", maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", flex: "1 1 auto", minHeight: 0 }} aria-label={"Truck with big " + props.big}>
      <rect x="10" y="36" width="160" height="104" rx="12" fill={props.hooked ? "#FFFFFF" : "rgba(255,255,255,0.7)"} stroke="#1E3A5F" strokeWidth="5" strokeDasharray={props.hooked ? "none" : "14 9"} />
      <text x="90" y="118" fontSize="92" textAnchor="middle" fontWeight="900" fill="#0F172A" fontFamily='ui-rounded, "Nunito", Arial, sans-serif'>{props.small}</text>
      <path d="M170 124 H204" stroke="#334155" strokeWidth="7" />
      <circle cx="50" cy="152" r="16" fill="#1F2937" />
      <circle cx="50" cy="152" r="6" fill="#D1D5DB" />
      <circle cx="130" cy="152" r="16" fill="#1F2937" />
      <circle cx="130" cy="152" r="6" fill="#D1D5DB" />
      <rect x="204" y="26" width="140" height="114" rx="12" fill="#FDE68A" stroke="#1E3A5F" strokeWidth="5" />
      <text x="274" y="122" fontSize="104" textAnchor="middle" fontWeight="900" fill="#0F172A" fontFamily='ui-rounded, "Nunito", Arial, sans-serif'>{props.big}</text>
      <path d="M344 140 V62 H392 L428 104 V140 Z" fill="#2563EB" stroke="#1E3A5F" strokeWidth="5" />
      <path d="M354 72 H388 L412 102 H354 Z" fill="#BFDBFE" />
      <circle cx="244" cy="152" r="16" fill="#1F2937" />
      <circle cx="244" cy="152" r="6" fill="#D1D5DB" />
      <circle cx="304" cy="152" r="16" fill="#1F2937" />
      <circle cx="304" cy="152" r="6" fill="#D1D5DB" />
      <circle cx="398" cy="152" r="16" fill="#1F2937" />
      <circle cx="398" cy="152" r="6" fill="#D1D5DB" />
    </svg>
  );
}

function ItemPic(props: { kind: Kind; index: number; w: number; flame?: boolean }) {
  const color = ITEM_COLORS[props.index % ITEM_COLORS.length];
  const w = props.w;
  const st: CSSProperties = { display: "block", maxWidth: "100%", height: "auto" };
  if (props.kind === "car") {
    return (
      <svg width={w} height={(w * 78) / 110} viewBox="0 0 110 78" style={st}>
        <ellipse cx="55" cy="70" rx="34" ry="5" fill="rgba(0,0,0,0.15)" />
        <rect x="18" y="34" width="76" height="26" rx="10" fill={color} />
        <path d="M32 34 L42 16 H70 L84 34 Z" fill={color} />
        <path d="M44 18 H68 L78 34 H36 Z" fill="#BFDBFE" />
        <rect x="22" y="42" width="12" height="6" rx="2" fill="#FDE68A" />
        <rect x="86" y="42" width="6" height="6" rx="2" fill="#FECACA" />
        <circle cx="36" cy="60" r="10" fill="#1F2937" />
        <circle cx="36" cy="60" r="4" fill="#D1D5DB" />
        <circle cx="78" cy="60" r="10" fill="#1F2937" />
        <circle cx="78" cy="60" r="4" fill="#D1D5DB" />
      </svg>
    );
  }
  if (props.kind === "truck") {
    return (
      <svg width={w} height={(w * 78) / 110} viewBox="0 0 110 78" style={st}>
        <ellipse cx="55" cy="70" rx="36" ry="5" fill="rgba(0,0,0,0.15)" />
        <rect x="8" y="28" width="58" height="30" rx="4" fill={color} />
        <rect x="66" y="36" width="34" height="22" rx="4" fill={color} />
        <rect x="74" y="22" width="22" height="16" rx="3" fill="#93C5FD" />
        <rect x="12" y="32" width="18" height="12" rx="2" fill="rgba(255,255,255,0.28)" />
        <circle cx="28" cy="60" r="10" fill="#1F2937" />
        <circle cx="28" cy="60" r="4" fill="#D1D5DB" />
        <circle cx="80" cy="60" r="10" fill="#1F2937" />
        <circle cx="80" cy="60" r="4" fill="#D1D5DB" />
      </svg>
    );
  }
  if (props.kind === "ball") {
    const style = props.index % 3;
    return (
      <svg width={w * 0.84} height={w * 0.84} viewBox="0 0 92 92" style={st}>
        <ellipse cx="46" cy="84" rx="22" ry="4" fill="rgba(0,0,0,0.15)" />
        <circle cx="46" cy="44" r="32" fill={style === 1 ? "#FFF7ED" : color} />
        {style === 0 ? (
          <>
            <path d="M46 12 A32 32 0 0 1 46 76" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="6" />
            <path d="M16 36 H76" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
          </>
        ) : null}
        {style === 1 ? (
          <>
            <circle cx="46" cy="44" r="8" fill="#1F2937" />
            <path d="M46 12 C58 28 58 60 46 76 C34 60 34 28 46 12" fill="none" stroke="#1F2937" strokeWidth="5" />
            <path d="M16 36 C32 42 60 42 76 36" fill="none" stroke="#1F2937" strokeWidth="5" />
            <path d="M16 52 C32 46 60 46 76 52" fill="none" stroke="#1F2937" strokeWidth="5" />
          </>
        ) : null}
        {style === 2 ? (
          <>
            <path d="M20 28 C36 38 56 38 72 28" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
            <path d="M18 44 H74" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
            <path d="M22 60 C36 52 56 52 70 60" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
            <path d="M46 12 V76" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
          </>
        ) : null}
        <circle cx="34" cy="30" r="8" fill="rgba(255,255,255,0.28)" />
      </svg>
    );
  }
  if (props.kind === "penguin") {
    const coat = color === "#EAB308" ? "#4B5563" : "#1F2937";
    return (
      <svg width={w * 0.86} height={w * 1.02} viewBox="0 0 84 100" style={st}>
        <ellipse cx="42" cy="94" rx="18" ry="4" fill="rgba(0,0,0,0.15)" />
        <ellipse cx="18" cy="62" rx="7" ry="14" fill={coat} transform="rotate(-16 18 62)" />
        <ellipse cx="42" cy="56" rx="22" ry="28" fill={coat} />
        <ellipse cx="42" cy="64" rx="14" ry="18" fill="#FFFDF8" />
        <ellipse cx="42" cy="32" rx="16" ry="15" fill={coat} />
        <ellipse cx="42" cy="34" rx="12" ry="11" fill="#FFFDF8" />
        <circle cx="36" cy="33" r="2.4" fill="#1F2937" />
        <circle cx="48" cy="33" r="2.4" fill="#1F2937" />
        <path d="M42 36 L48 41 L42 44 L36 41 Z" fill="#F59E0B" />
        <ellipse cx="66" cy="62" rx="7" ry="14" fill={coat} transform="rotate(16 66 62)" />
        <ellipse cx="32" cy="86" rx="8" ry="4.2" fill="#F97316" />
        <ellipse cx="52" cy="86" rx="8" ry="4.2" fill="#F97316" />
        <path d="M36 52 L48 52" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={w * 0.86} height={w * 1.13} viewBox="0 0 84 110" style={st}>
      <ellipse cx="42" cy="104" rx="16" ry="4" fill="rgba(0,0,0,0.15)" />
      {props.flame ? (
        <>
          <ellipse cx="42" cy="94" rx="8" ry="12" fill="#F97316" />
          <ellipse cx="42" cy="96" rx="4" ry="8" fill="#FDE68A" />
        </>
      ) : null}
      <path d="M24 78 L42 92 L60 78 Z" fill="#F59E0B" />
      <rect x="28" y="30" width="28" height="50" rx="14" fill={color} />
      <path d="M42 8 L58 32 H26 Z" fill={color} />
      <circle cx="42" cy="50" r="8" fill="#BFDBFE" />
      <circle cx="42" cy="50" r="4" fill="#1E3A8A" />
      <path d="M28 70 L16 86 L28 80 Z" fill="#F97316" />
      <path d="M56 70 L68 86 L56 80 Z" fill="#F97316" />
    </svg>
  );
}

function CountItem(props: {
  kind: Kind;
  index: number;
  w: number;
  lit?: boolean;
  mark?: number;
  leaving?: boolean;
  hop?: boolean;
  anim?: string;
  onTap?: () => void;
  plain?: boolean;
}) {
  const compact = props.w < 70;
  const style: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    margin: compact ? 2 : 6,
    padding: compact ? 2 : 6,
    minWidth: 0,
    width: "100%",
    maxWidth: props.w + (compact ? 8 : 16),
    boxSizing: "border-box",
    border: props.lit ? "4px solid #F59E0B" : props.leaving ? "3px dashed #1E3A5F" : "4px solid transparent",
    borderRadius: compact ? 14 : 22,
    background: props.lit ? "rgba(250, 204, 21, 0.4)" : props.leaving ? "rgba(255,255,255,0.35)" : "transparent",
    opacity: props.leaving ? 0.45 : 1,
    transform: props.hop ? "translateY(-8px)" : "none",
    transition: "transform 450ms ease, opacity 500ms ease, background 250ms ease",
    cursor: props.onTap ? "pointer" : "default",
    pointerEvents: props.onTap ? "auto" : "none",
    animation: props.leaving ? "miles-drive-away 900ms ease forwards" : props.anim || "none",
    fontFamily: "inherit",
    WebkitTapHighlightColor: "transparent",
  };
  const label = (
    <div style={{
      height: compact ? 20 : 28,
      fontSize: compact ? 16 : 22,
      fontWeight: 900,
      color: "#0F2A4A",
      lineHeight: compact ? "20px" : "28px",
      textAlign: "center",
      padding: "0 6px",
      borderRadius: 10,
      background: props.mark != null || props.leaving ? "rgba(255,255,255,0.92)" : "transparent",
    }}>
      {props.mark != null ? props.mark : props.leaving ? "👋➜" : ""}
    </div>
  );
  const pic = <ItemPic kind={props.kind} index={props.index} w={props.w} flame={props.leaving} />;
  if (props.plain) {
    return <div style={style}>{pic}{label}</div>;
  }
  return (
    <button type="button" onClick={props.onTap} aria-label={props.mark != null ? "Item " + props.mark : props.leaving ? "Going away" : "Count this one"} style={style}>
      {pic}
      {label}
    </button>
  );
}

function fieldBg(kind: Kind): string {
  if (kind === "car" || kind === "truck") return "linear-gradient(#7EC8E8 0 30%, #6B7280 30% 100%)";
  if (kind === "ball") return "linear-gradient(#87CEEB, #7BC67A)";
  if (kind === "penguin") return "linear-gradient(#E0F2FE, #F8FAFC)";
  return "linear-gradient(#1E3A8A, #6D28D9)";
}

let activeToken = 0;
// Tap gate for the current question (module-level so two taps in the same frame cannot both get through).
let gate = { id: 0, busy: true, tapped: false, missed: false, done: false };
let holdTimer: ReturnType<typeof setInterval> | null = null;
let holdStart = 0;

function rowsOf(list: number[], per: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < list.length; i += per) out.push(list.slice(i, i + per));
  return out;
}

function upTo(n: number, start?: number): number[] {
  const out: number[] = [];
  for (let i = start || 0; i < n; i++) out.push(i);
  return out;
}

function answerPhrase(q: Q): string {
  if (q.mode === "compare") return "That pile has " + (q.ask === "more" ? "more" : "fewer") + "!";
  if (q.mode === "letters") return "It's " + (q.letterKind === "upper" ? "" : "little ") + q.target + ".";
  return "It's " + q.answer + ".";
}

export default function App() {
  const theme = useGrokTheme();
  const font = 'ui-rounded, "Nunito", "Segoe UI Rounded", ' + theme.font.family;
  const [boot] = useState<{ save: Save; migrated: boolean }>(() => loadSave());
  const [vpH, setVpH] = useState<number>(800);
  const [vpW, setVpW] = useState<number>(800);
  useEffect(() => {
    const onResize = () => {
      setVpH(window.innerHeight);
      setVpW(window.innerWidth);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [save, setSave] = useState<Save>(boot.save);
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("count");
  const [q, setQ] = useState<Q>(() => makeQ("count", boot.save.levels.count));
  const [streak, setStreak] = useState<number>(0);
  const [missed, setMissed] = useState<boolean>(false);
  const [wrongs, setWrongs] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [hinting, setHinting] = useState<boolean>(false);
  const [hintCount, setHintCount] = useState<number>(0);
  const [taps, setTaps] = useState<number[]>([]);
  const [joined, setJoined] = useState<boolean>(false);
  const [gone, setGone] = useState<boolean>(false);
  const [showQuick, setShowQuick] = useState<boolean>(false);
  const [peekId, setPeekId] = useState<number>(0);
  const [reveal, setReveal] = useState<boolean>(false);
  const [boom, setBoom] = useState<boolean>(false);
  const [boomBits, setBoomBits] = useState<BoomBit[]>([]);
  const [hop, setHop] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [qNum, setQNum] = useState<number>(0);
  const [resolving, setResolving] = useState<boolean>(false);
  const [dressWho, setDressWho] = useState<Buddy>(boot.save.buddy);
  const [garagePick, setGaragePick] = useState<number>(-1);
  const [holdPct, setHoldPct] = useState<number>(0);
  const [codeInput, setCodeInput] = useState<string>("");
  const [codePreview, setCodePreview] = useState<Save | null>(null);
  const [codeErr, setCodeErr] = useState<string>("");
  const [copied, setCopied] = useState<string>("");
  const [unlockNote, setUnlockNote] = useState<string>(() => {
    if (!boot.migrated || boot.save.unlocked.length <= 1) return "";
    const names = boot.save.unlocked.filter((id) => id !== "none").map(itemName).slice(0, 14);
    return "Yaya kept all " + boot.save.stars + " of your stars, and they unlocked: " + names.join(", ") + ". Tap Dress Up to try them on!";
  });

  useEffect(() => {
    writeSave(save);
  }, [save]);

  useEffect(() => {
    setHop(true);
    const t = setTimeout(() => setHop(false), 450);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (q.mode !== "take") return;
    setGone(false);
    const t = setTimeout(() => setGone(true), 1700);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (q.mode !== "quick") return;
    setShowQuick(true);
    const t = setTimeout(() => setShowQuick(false), peekId > 0 ? q.flashMs + 300 : q.flashMs);
    return () => clearTimeout(t);
  }, [q, peekId]);

  const live: number[] =
    q.mode === "take" ? upTo(q.a - q.b) : q.mode === "add" || q.mode === "compare" ? upTo(q.a + q.b) : upTo(q.a);

  useEffect(() => {
    if (!hinting) return;
    if (hintCount >= live.length) return;
    const t = setTimeout(() => setHintCount((c) => c + 1), hintCount === 0 ? 400 : 650);
    return () => clearTimeout(t);
  }, [hinting, hintCount, live.length]);

  function newQuestion(m: Mode, lv: number, fewerDone?: boolean): void {
    const fd = fewerDone == null ? save.fewerDone : fewerDone;
    const nq = makeQ(m, lv, { fewerEasy: !fd, hint: !fd });
    // New question: answers stay locked until Yaya finishes asking (or a fallback timer), so no taps carry over.
    gate = { id: gate.id + 1, busy: true, tapped: false, missed: false, done: false };
    const gid = gate.id;
    setQNum(gid);
    setReady(false);
    setResolving(false);
    setQ(nq);
    setMissed(false);
    setWrongs([]);
    setPicked(null);
    setLocked(false);
    setFeedback("");
    setHinting(false);
    setHintCount(0);
    setTaps([]);
    setJoined(false);
    setGone(false);
    setReveal(false);
    setBoom(false);
    setPeekId(0);
    sayThen(speechFor(nq), () => {
      if (gate.id === gid) {
        gate.busy = false;
        setReady(true);
      }
    }, 700);
  }

  function startMode(m: Mode): void {
    activeToken++;
    setMode(m);
    setStreak(0);
    setUnlockNote("");
    setScreen("play");
    newQuestion(m, save.levels[m], save.fewerDone);
  }

  function goScreen(s: Screen): void {
    activeToken++;
    gate.busy = true;
    setScreen(s);
    setBoom(false);
    setGaragePick(-1);
    try {
      const w = window as unknown as { speechSynthesis?: SpeechSynthesis };
      if (w.speechSynthesis) w.speechSynthesis.cancel();
    } catch (e) { /* ignore */ }
  }

  function startHint(): void {
    setTaps([]);
    setHintCount(0);
    setHinting(true);
  }

  function choose(n: number): void {
    // Anti-spam: only the very first tap counts; everything else is ignored until the result resolves.
    if (gate.busy || gate.done) return;
    if (q.mode === "take" && !gone) return;
    if (wrongs.indexOf(n) >= 0) return;
    const first = !gate.tapped;
    gate.tapped = true;
    gate.busy = true;
    setResolving(true);
    const token = activeToken;
    const gid = gate.id;
    const isFewer = q.mode === "compare" && q.ask === "fewer";
    if (n === q.answer) {
      gate.done = true;
      setLocked(true);
      setPicked(n);
      setBoom(true);
      setBoomBits(makeBoomBits());
      setJoined(true);
      setHinting(false);
      const rex = save.buddy === "rex";
      const praise = rex
        ? ["ROAR! You got it!", "Stomp stomp, yes!", "Rex is so proud!", "Dino-mite, Miles!"][rand(0, 3)]
        : ["BOOM! You got it!", "Vroom vroom, yes!", "Yaya is so proud!", "Super job, Miles!"][rand(0, 3)];
      const what = answerPhrase(q);
      let lv = save.levels[mode];
      let wait = 2600;
      let fewerRun = save.fewerRun;
      let fewerDone = save.fewerDone;
      const star = first && !gate.missed;
      if (isFewer) {
        if (star) {
          fewerRun = Math.min(3, fewerRun + 1);
          if (fewerRun >= 3) fewerDone = true;
        } else {
          fewerRun = 0;
        }
      }
      if (star) {
        const s = streak + 1;
        setStreak(s);
        const up = s % 3 === 0 && lv < 6;
        if (up) lv = lv + 1;
        const stars = save.stars + 1;
        const fresh = rewardsBetween(save.stars, stars);
        const unlocked = save.unlocked.slice();
        const earned = unlockedFor(stars);
        for (let i = 0; i < earned.length; i++) if (unlocked.indexOf(earned[i]) < 0) unlocked.push(earned[i]);
        const garage = normalizeGarage(save.garage, stars);
        setSave({ ...save, stars, unlocked, garage, fewerRun, fewerDone, levels: { ...save.levels, [mode]: lv } });
        let msg = praise + " ⭐ " + what;
        let speak = praise;
        if (isFewer && fewerDone && !save.fewerDone) msg += " You know FEWER now!";
        if (up) {
          msg += " Level up! Now level " + lv + ".";
          speak += " Level up!";
        }
        if (fresh.length > 0) {
          const note = unlockMessage(fresh);
          setUnlockNote(note.text);
          speak += " " + note.speak;
          wait = 3600;
        } else if (!up) {
          wait = 2200;
        }
        setFeedback(msg);
        say(speak);
      } else {
        setStreak(0);
        if (isFewer && save.fewerRun !== fewerRun) setSave({ ...save, fewerRun });
        setFeedback("You got it! " + what + " The next one is a star chance.");
        say("You got it! Next one is a star chance.");
      }
      const finalLv = lv;
      const fd = fewerDone;
      setTimeout(() => {
        if (token === activeToken) newQuestion(mode, finalLv, fd);
      }, wait);
      return;
    }
    gate.missed = true;
    setWrongs((w) => w.concat([n]));
    setMissed(true);
    setStreak(0);
    let tip = "Almost! Let's count them together.";
    let speak = "";
    if (q.mode === "add") {
      tip = "Almost! Zoom them together and count them all.";
      setJoined(true);
      startHint();
    } else if (q.mode === "take") {
      tip = "Almost! Let's count the ones that stayed.";
      startHint();
    } else if (q.mode === "compare") {
      tip = isFewer ? "Hmm! " + FEWER_HINT + " Let's count each pile." : "Hmm! Let's count each pile.";
      if (isFewer && save.fewerRun !== 0) setSave({ ...save, fewerRun: 0 });
      startHint();
    } else if (q.mode === "find") {
      tip = "Not that one. Look and listen again!";
      speak = "Not that one. " + speechFor(q);
      setReveal(true);
    } else if (q.mode === "letters") {
      if (q.letterKind === "match") {
        tip = "Not that one. Look for little " + q.target.toLowerCase() + ".";
        speak = "Not that one. Look for little " + q.target + ".";
      } else {
        tip = "Not that one. Look and listen again!";
        speak = "Not that one. " + speechFor(q);
        setReveal(true);
      }
    } else if (q.mode === "quick") {
      tip = "Let's look again and count them.";
      startHint();
    } else {
      startHint();
    }
    setFeedback(tip);
    say(speak || tip);
    setTimeout(() => {
      if (gate.id === gid && !gate.done) {
        gate.busy = false;
        setResolving(false);
      }
    }, 1200);
  }

  function tapItem(i: number): void {
    if (locked || hinting) return;
    setTaps((prev) => (prev.indexOf(i) >= 0 ? prev.filter((x) => x !== i) : prev.concat([i])));
  }

  function wear(who: Buddy, slot: Slot, id: string): void {
    if (save.unlocked.indexOf(id) < 0) return;
    if (who === "rex") {
      const nv = save.rex[slot] === id ? "none" : id;
      const rx: Outfit = { ...save.rex };
      rx[slot] = nv;
      setSave({ ...save, rex: rx });
      if (nv !== "none") say("Rex has the " + itemName(id) + "!");
      return;
    }
    const nextVal = save[slot] === id ? "none" : id;
    const out: Save = { ...save };
    if (slot === "head") out.head = nextVal;
    else if (slot === "face") out.face = nextVal;
    else if (slot === "back") out.back = nextVal;
    else out.hold = nextVal;
    setSave(out);
    if (nextVal !== "none") say("Yaya has the " + itemName(id) + "!");
  }

  const outfit: Outfit = { head: save.head, face: save.face, back: save.back, hold: save.hold };
  const yayaMood: "idle" | "cheer" | "hint" = boom ? "cheer" : hinting ? "hint" : "idle";
  const buddyOutfit: Outfit = save.buddy === "rex" ? save.rex : outfit;

  function markFor(i: number): number | undefined {
    if (hinting) {
      const pos = live.indexOf(i);
      if (pos < 0 || pos >= hintCount) return undefined;
      if (q.mode === "compare") return i < q.a ? i + 1 : i - q.a + 1;
      return pos + 1;
    }
    const pos = taps.indexOf(i);
    return pos >= 0 ? pos + 1 : undefined;
  }
  function litFor(i: number): boolean {
    if (!hinting) return false;
    const pos = live.indexOf(i);
    return pos >= 0 && pos < hintCount;
  }

  function item(i: number, w: number, extra?: { leaving?: boolean; anim?: string; plain?: boolean; kindIndex?: number }) {
    const leaving = !!(extra && extra.leaving);
    const canTap = !locked && !hinting && !leaving && q.mode !== "compare";
    return (
      <CountItem
        key={i}
        kind={q.kind}
        index={extra && extra.kindIndex != null ? extra.kindIndex : i}
        w={w}
        lit={litFor(i)}
        mark={markFor(i)}
        leaving={leaving}
        hop={hop && q.mode === "count"}
        anim={extra ? extra.anim : undefined}
        plain={extra ? extra.plain : false}
        onTap={canTap ? () => tapItem(i) : undefined}
      />
    );
  }

  function grid(list: number[], per: number, w: number, opts?: (i: number) => { leaving?: boolean; anim?: string }) {
    return (
      <div style={{ width: "100%" }}>
        {rowsOf(list, per).map((row, r) => {
          const halves = per === 10 ? [row.slice(0, 5), row.slice(5)] : [row];
          return (
            <div key={r} style={{ display: "flex", justifyContent: "center", gap: 18, margin: "2px 0" }}>
              {halves.map((h, hi) => (
                <div key={hi} style={{ display: "flex", flex: per === 10 ? "1 1 0" : "0 1 auto", justifyContent: per === 10 ? (hi === 0 ? "flex-end" : "flex-start") : "center", minWidth: 0 }}>
                  {h.map((i) => (
                    <div key={i} style={{ flex: "0 1 " + (w + 12) + "px", minWidth: 0, display: "flex", justifyContent: "center" }}>{item(i, w, opts ? opts(i) : undefined)}</div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  const boxStyle: CSSProperties = {
    background: "rgba(255,255,255,0.55)",
    border: "4px solid #1E3A5F",
    borderRadius: 22,
    padding: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  };

  function renderField() {
    if (q.mode === "count") {
      const n = q.a;
      if (q.layout === "scatter") {
        return (
          <div style={{ position: "relative", width: "100%", height: 440 }}>
            {upTo(n).map((i) => (
              <div key={i} style={{ position: "absolute", left: q.spots[i].x + "%", top: q.spots[i].y + "%", transform: "translate(-50%, -50%)", width: 124 }}>
                {item(i, 104)}
              </div>
            ))}
          </div>
        );
      }
      if (q.layout === "tens") return grid(upTo(n), 10, 62);
      if (q.layout === "rows5") return grid(upTo(n), 5, n <= 10 ? 100 : 84);
      return grid(upTo(n), 5, 130);
    }
    if (q.mode === "add") {
      const total = q.a + q.b;
      if (joined) {
        const per = total <= 10 ? 5 : 10;
        const w = total <= 5 ? 120 : total <= 10 ? 92 : 62;
        return (
          <div style={{ width: "100%" }}>
            <div style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "#0F2A4A", marginBottom: 4 }}>
              <span style={{ background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: "2px 12px" }}>🧲 All together!</span>
            </div>
            <div style={{ ...boxStyle }}>
              {grid(upTo(total), per, w, (i) => ({ anim: i < q.a ? "miles-zoom-l 700ms ease-out both" : "miles-zoom-r 700ms ease-out both" }))}
            </div>
          </div>
        );
      }
      const big = Math.max(q.a, q.b);
      const w = big <= 3 ? 120 : big <= 5 ? 92 : big <= 8 ? 70 : 56;
      const per = (n: number) => (n <= 5 ? Math.max(1, Math.min(n, big <= 3 ? 3 : 5)) : 5);
      return (
        <div style={{ display: "flex", alignItems: "stretch", width: "100%", gap: 0 }}>
          <div style={{ ...boxStyle, flex: "1 1 0" }} aria-label={"Group of " + q.a}>
            {grid(upTo(q.a), per(q.a), w)}
          </div>
          <div style={{ width: 84, flex: "0 0 84px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 84, fontWeight: 900, color: "#0F2A4A", textShadow: "3px 3px 0 #FFFFFF" }}>+</div>
          <div style={{ ...boxStyle, flex: "1 1 0" }} aria-label={"Group of " + q.b}>
            {grid(upTo(q.a + q.b, q.a), per(q.b), w)}
          </div>
        </div>
      );
    }
    if (q.mode === "take") {
      const per = q.a <= 10 ? 5 : 10;
      const w = q.a <= 5 ? 130 : q.a <= 10 ? 96 : 62;
      return (
        <div style={{ width: "100%", position: "relative" }}>
          <div style={{ textAlign: "right", minHeight: 30, fontSize: 20, fontWeight: 900, color: "#0F2A4A" }}>
            <span style={{ background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: "2px 12px", border: gone ? "3px dashed #1E3A5F" : "3px solid transparent" }}>
              {gone ? "👋 " + q.b + " going bye-bye ➜" : "👀 Watch!"}
            </span>
          </div>
          {grid(upTo(q.a), per, w, (i) => ({ leaving: gone && i >= q.a - q.b }))}
        </div>
      );
    }
    if (q.mode === "compare") {
      const big = Math.max(q.a, q.b);
      const w = big <= 6 ? 90 : big <= 12 ? 56 : 44;
      const pile = (side: number) => {
        const n = side === 0 ? q.a : q.b;
        const spots = side === 0 ? q.spots : q.spots2;
        const offset = side === 0 ? 0 : q.a;
        const isRight = picked === side;
        const isWrong = wrongs.indexOf(side) >= 0;
        const counted = hinting && hintCount >= (side === 0 ? q.a : q.a + q.b);
        return (
          <button
            key={side}
            type="button"
            aria-label={side === 0 ? "Left pile" : "Right pile"}
            data-choice={side}
            onClick={() => choose(side)}
            disabled={!ready || (resolving && !locked)}
            style={{
              opacity: !ready ? 0.55 : 1,
              color: "#0F2A4A",
              flex: "1 1 0",
              position: "relative",
              height: 380,
              borderRadius: 26,
              border: isRight ? "7px solid #15803D" : isWrong ? "6px dashed #1E3A5F" : "5px solid #1E3A5F",
              background: isRight ? "rgba(187,247,208,0.75)" : "rgba(255,255,255,0.55)",
              cursor: locked ? "default" : "pointer",
              padding: 0,
              fontFamily: font,
              boxShadow: "0 6px 0 rgba(15,42,74,0.45)",
            }}
          >
            {upTo(n).map((k) => (
              <div key={k} style={{ position: "absolute", left: spots[k].x + "%", top: (4 + spots[k].y * 0.86) + "%", transform: "translate(-50%, -50%)", width: w + 10 }}>
                {item(offset + k, w, { plain: true, kindIndex: offset + k })}
              </div>
            ))}
            {isRight || isWrong || counted ? (
              <div style={{ position: "absolute", left: 8, bottom: 8, fontSize: 24, fontWeight: 900, background: "#FFFFFF", borderRadius: 12, padding: "2px 10px", color: "#0F2A4A", border: "2px solid #1E3A5F" }}>
                {(isRight ? "✓ Yes! " : isWrong ? "✗ " : "") + (counted || isRight ? String(n) : "")}
              </div>
            ) : null}
          </button>
        );
      };
      return (
        <div style={{ display: "flex", gap: 22, width: "100%" }}>
          {pile(0)}
          {pile(1)}
        </div>
      );
    }
    if (q.mode === "find") {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: snug ? 10 : 16, minHeight: snug ? 0 : 170, flexWrap: snug ? "nowrap" : "wrap", width: "100%" }}>
          <Yaya mood={yayaMood} size={snug ? 78 : 110} outfit={outfit} />
          <div style={{ background: "#FFFFFF", border: "5px solid #1E3A5F", borderRadius: 28, padding: snug ? "8px 12px" : "14px 26px", fontSize: snug ? 22 : 30, fontWeight: 900, color: "#0F2A4A", minWidth: snug ? 0 : 200, textAlign: "center" }}>
            {reveal || locked ? (
              <span>{"Tap "}<span style={{ fontSize: snug ? 48 : 72, lineHeight: snug ? "52px" : "80px" }}>{q.answer}</span>{" !"}</span>
            ) : (
              <span>{"🔊 Listen to Yaya!"}</span>
            )}
          </div>
        </div>
      );
    }
    if (q.mode === "letters") {
      const shown = q.letterKind === "upper" ? q.target : q.target.toLowerCase();
      if (q.letterKind === "match") {
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", height: "100%", minHeight: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0F2A4A", background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: "2px 12px", flexShrink: 0 }}>🚚 Big letter truck needs its little letter trailer!</div>
            <LetterTruck big={q.target} small={locked ? q.labels[q.answer] : "?"} hooked={locked} />
          </div>
        );
      }
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: "100%", minHeight: 0, flexWrap: "nowrap" }}>
          <Yaya mood={yayaMood} size={80} outfit={outfit} />
          <div style={{ background: "#FFFFFF", border: "5px solid #1E3A5F", borderRadius: 24, padding: "8px 14px", fontSize: 22, fontWeight: 900, color: "#0F2A4A", minWidth: 0, textAlign: "center" }}>
            {reveal || locked ? (
              <span>{"Find "}<span style={{ fontSize: 56, lineHeight: "60px", fontFamily: 'ui-rounded, "Nunito", Arial, sans-serif' }}>{shown}</span>{" !"}</span>
            ) : (
              <span>{"🔊 Listen to Yaya!"}</span>
            )}
          </div>
        </div>
      );
    }
    const visible = showQuick || hinting || locked;
    return (
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <div style={{ position: "relative", width: 400, maxWidth: "100%", height: 400, borderRadius: 30, background: "rgba(255,255,255,0.6)", border: "5px solid #1E3A5F" }}>
          {visible
            ? upTo(q.a).map((i) => (
                <div key={i + "-" + peekId} style={{ position: "absolute", left: q.spots[i].x + "%", top: q.spots[i].y + "%", transform: "translate(-50%, -50%)", width: 120, animation: "miles-pop-in 220ms ease-out both" }}>
                  {item(i, 100)}
                </div>
              ))
            : (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 100, color: "#0F2A4A" }}>
                <div>❓</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>How many did you see?</div>
              </div>
            )}
        </div>
      </div>
    );
  }

  function pickBuddy(b: Buddy): void {
    if (b === "rex" && save.unlocked.indexOf("rex") < 0) return;
    setSave({ ...save, buddy: b });
    setDressWho(b);
    say(b === "rex" ? "ROAR! Rex wants to play!" : "Yaya wants to play!");
  }

  function startHold(): void {
    if (holdTimer) clearInterval(holdTimer);
    holdStart = Date.now();
    setHoldPct(1);
    holdTimer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - holdStart) / 2000) * 100);
      setHoldPct(pct);
      if (pct >= 100) {
        if (holdTimer) clearInterval(holdTimer);
        holdTimer = null;
        setHoldPct(0);
        setCodeInput("");
        setCodeErr("");
        setCodePreview(null);
        setCopied("");
        goScreen("grownup");
      }
    }, 80);
  }

  function stopHold(): void {
    if (holdTimer) clearInterval(holdTimer);
    holdTimer = null;
    setHoldPct(0);
  }

  function carName(id: string): string {
    const c = carById(id);
    return c ? c.name : "car";
  }

  function tapSpot(i: number): void {
    const id = save.garage[i];
    if (garagePick < 0) {
      if (!id) return;
      setGaragePick(i);
      const gold = save.unlocked.indexOf("gold-" + id) >= 0;
      say((gold ? "The golden " : "The ") + carName(id).toLowerCase() + "! Where should it park?");
      return;
    }
    if (garagePick === i) {
      setGaragePick(-1);
      return;
    }
    const g = save.garage.slice();
    const t = g[i];
    g[i] = g[garagePick];
    g[garagePick] = t;
    setSave({ ...save, garage: g });
    setGaragePick(-1);
    say("Vroom! Parked!");
  }

  function copyCode(): void {
    const done = () => setCopied("✓ Copied!");
    try {
      const nav = navigator as unknown as { clipboard?: { writeText: (s: string) => Promise<void> } };
      if (nav.clipboard && nav.clipboard.writeText) {
        nav.clipboard.writeText(myCode).then(done, () => setCopied("Press and hold the code to copy it."));
        return;
      }
    } catch (e) { /* fall through */ }
    setCopied("Press and hold the code to copy it.");
  }

  function checkCode(): void {
    const r = decodeCode(codeInput);
    if (!r.save) {
      setCodePreview(null);
      setCodeErr(r.error);
      return;
    }
    setCodeErr("");
    setCodePreview(r.save);
  }

  function loadCode(): void {
    if (!codePreview) return;
    const s = codePreview;
    setSave(s);
    writeSave(s);
    setDressWho(s.buddy);
    setCodePreview(null);
    setCodeInput("");
    setStreak(0);
    setUnlockNote("Code loaded! Miles has " + s.stars + " stars.");
    goScreen("home");
  }

  const prize = nextPrize(save.stars);
  const prizeMore = prize.cost - save.stars;
  const prizeSpeech = prizeMore + " more " + (prizeMore === 1 ? "star" : "stars") + " and you get the " + prize.name.toLowerCase() + "!";
  const trophies: number[] = [];
  for (let c = TROPHY_START; c <= save.stars; c += TROPHY_STEP) trophies.push(c);
  const myCode = screen === "grownup" ? encodeSave(save) : "";

  const pillBtn = (active: boolean): CSSProperties => ({
    padding: "12px 20px",
    minHeight: 56,
    borderRadius: 9999,
    border: active ? "4px solid #0F2A4A" : "3px solid #1E3A5F",
    background: active ? "#1E3A5F" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#1E3A5F",
    fontSize: 22,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: font,
  });

  const lvNow = save.levels[mode];
  const inRow = streak % 3;
  const letterChoices = q.mode === "letters";
  const letterPlay = screen === "play" && letterChoices;
  // Short phones: tighten the header so five letter tiles still sit on screen.
  const shortPlay = letterPlay && vpH <= 760;
  const findChoices = q.mode === "find";
  const roadNumbers = q.mode === "count" || q.mode === "add" || q.mode === "take";
  // Narrow phones: a shorter header so five number buttons sit on the screen.
  const snug = screen === "play" && (roadNumbers || findChoices) && vpW <= 540;
  const compact = shortPlay || snug;
  // Five letter tiles: three across on a phone, up to five on a wider screen, still a big tap target.
  // Find the Number stays big, but five 150px buttons cannot sit on a phone, so they shrink to three across and wrap.
  // Count, Add, and Take Away do the same at a smaller size. Quick Look keeps 1..max at the old sizes.
  const choiceSize = letterChoices
    ? "min(148px, calc((100% - 32px) / 3))"
    : findChoices
      ? "min(128px, calc((100% - 36px) / 3))"
      : roadNumbers
        ? "min(124px, calc((100% - 40px) / 3))"
        : q.choices.length > 3 ? 104 : 124;
  const choiceGap = letterChoices ? 12 : findChoices ? 10 : 16;

  return (
    <div style={{
      fontFamily: font,
      color: "#1E3A5F",
      background: "linear-gradient(#7EC8E3, #FDE68A 55%, #FDBA74)",
      padding: compact ? 8 : 18,
      maxWidth: 840,
      margin: "0 auto",
      minHeight: letterPlay ? 0 : "100%",
      height: letterPlay ? "100dvh" : undefined,
      maxHeight: letterPlay ? "100dvh" : undefined,
      overflow: letterPlay ? "hidden" : undefined,
      display: letterPlay ? "flex" : undefined,
      flexDirection: letterPlay ? "column" : undefined,
      boxSizing: "border-box",
    }}>
      <style>{`
        @keyframes miles-boom-pop { 0% { transform: scale(0.2) rotate(-8deg); opacity: 0; } 45% { transform: scale(1.18) rotate(3deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes miles-boom-burst { 0% { transform: scale(0.2); opacity: 0.85; } 100% { transform: scale(2.6); opacity: 0; } }
        @keyframes miles-confetti { 0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; } 100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.7) rotate(200deg); opacity: 0; } }
        @keyframes miles-hop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes miles-yaya-cheer { 0%, 100% { transform: translateY(-4px) rotate(0deg); } 40% { transform: translateY(-12px) rotate(-7deg); } 70% { transform: translateY(-8px) rotate(7deg); } }
        @keyframes miles-drive-away { 0% { transform: translateX(0); } 100% { transform: translateX(46px); } }
        @keyframes miles-zoom-l { 0% { transform: translateX(-140px) scale(0.8); opacity: 0.3; } 100% { transform: translateX(0) scale(1); opacity: 1; } }
        @keyframes miles-zoom-r { 0% { transform: translateX(140px) scale(0.8); opacity: 0.3; } 100% { transform: translateX(0) scale(1); opacity: 1; } }
        @keyframes miles-stomp { 0%, 100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-14px) rotate(-7deg); } 50% { transform: translateY(0) rotate(0deg) scaleY(0.93); } 75% { transform: translateY(-14px) rotate(7deg); } }
        @keyframes miles-pop-in { 0% { transform: translate(-50%, -50%) scale(0.3); } 100% { transform: translate(-50%, -50%) scale(1); } }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: compact ? 6 : 10, flexShrink: letterPlay ? 0 : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BuddyPic buddy={save.buddy} mood={screen === "play" ? yayaMood : "idle"} size={screen === "home" ? 92 : compact ? 46 : 70} outfit={buddyOutfit} />
          <div>
            <div style={{ fontSize: compact ? 18 : 30, fontWeight: 800, lineHeight: compact ? "22px" : "34px", color: "#0F2A4A" }}>Miles's Vroom Count</div>
            <div style={{ fontSize: compact ? 15 : 22, fontWeight: 800 }}>
              {"⭐ " + save.stars}
              {screen === "play" ? (
                <span style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginLeft: 10 }}>
                  {MODE_META[mode].title + " · Level " + lvNow + " of 6"}
                </span>
              ) : null}
              {screen === "play" ? (
                <span style={{ fontSize: 16, fontWeight: 800, color: "#334155", marginLeft: 10 }}>{"🎁 " + prizeMore + " more to the " + prize.name.toLowerCase()}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: compact ? 4 : 8, flexWrap: compact ? "nowrap" : "wrap" }}>
          {screen !== "home" ? <button style={compact ? { ...pillBtn(false), padding: "4px 6px", minHeight: 36, fontSize: 14 } : pillBtn(false)} onClick={() => goScreen("home")}>🗺️ Map</button> : null}
          <button style={compact ? { ...pillBtn(screen === "dress"), padding: "4px 6px", minHeight: 36, fontSize: 14 } : pillBtn(screen === "dress")} onClick={() => { setDressWho(save.buddy); goScreen("dress"); }}>👕 Dress Up</button>
          <button style={compact ? { ...pillBtn(screen === "garage"), padding: "4px 6px", minHeight: 36, fontSize: 14 } : pillBtn(screen === "garage")} onClick={() => goScreen("garage")}>🏠 Garage</button>
        </div>
      </div>

      {unlockNote ? (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 18, background: "#FFFFFF", border: "3px solid #1E3A5F", fontWeight: 800, fontSize: 18, color: "#0F2A4A" }}>
          {"🎁 " + unlockNote}
        </div>
      ) : null}

      {screen === "home" ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
            <div style={{ background: "#FFFFFF", border: "3px solid #1E3A5F", borderRadius: 20, padding: "10px 16px", fontSize: 22, fontWeight: 800, color: "#0F2A4A" }}>
              {"💬 Yaya says: Let's start with Count! Pick a road to play."}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "0 0 14px" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0F2A4A" }}>Play with:</div>
            {(["yaya", "rex"] as Buddy[]).map((b) => {
              const open = b === "yaya" || save.unlocked.indexOf("rex") >= 0;
              const on = save.buddy === b;
              return (
                <button key={b} onClick={() => pickBuddy(b)} disabled={!open} aria-pressed={on} aria-label={b === "rex" ? "Pick Rex" : "Pick Yaya"} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 16px 6px 8px", minHeight: 80, borderRadius: 24,
                  border: on ? "6px solid #0F2A4A" : open ? "3px solid #1E3A5F" : "3px dashed #64748B",
                  background: on ? "#FDE68A" : open ? "#FFFFFF" : "rgba(255,255,255,0.5)", cursor: open ? "pointer" : "default",
                  fontFamily: font, color: "#0F2A4A", fontSize: 22, fontWeight: 900,
                }}>
                  <div style={{ filter: open ? "none" : "brightness(0)", opacity: open ? 1 : 0.45 }}>
                    <BuddyPic buddy={b} mood="idle" size={52} outfit={b === "rex" ? save.rex : outfit} />
                  </div>
                  <span>{(on ? "✓ " : "") + (b === "rex" ? "Rex" : "Yaya")}</span>
                  {!open ? <span style={{ fontSize: 16 }}>{"🔒 " + REX_COST + " ⭐"}</span> : null}
                </button>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {MODES.map((m) => {
              const lv = save.levels[m];
              const pips = upTo(6).map((k) => (k < lv ? "●" : "○")).join(" ");
              return (
                <button key={m} onClick={() => startMode(m)} aria-label={MODE_META[m].title} style={{
                  position: "relative",
                  textAlign: "left",
                  background: "#FFFFFF",
                  border: m === "count" ? "5px solid #0F2A4A" : "4px solid #1E3A5F",
                  borderRadius: 26,
                  padding: "16px 16px 14px",
                  cursor: "pointer",
                  fontFamily: font,
                  color: "#0F2A4A",
                  boxShadow: "0 6px 0 rgba(15,42,74,0.45)",
                  minHeight: 150,
                }}>
                  {m === "count" ? (
                    <div style={{ position: "absolute", top: -14, right: 14, background: "#FDE68A", border: "3px solid #0F2A4A", borderRadius: 9999, padding: "2px 10px", fontSize: 15, fontWeight: 900 }}>⭐ Start here</div>
                  ) : null}
                  <div style={{ fontSize: 44, lineHeight: "50px" }}>{MODE_META[m].emoji}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: "30px" }}>{MODE_META[m].title}</div>
                  <div style={{ fontSize: 16, color: "#334155", marginTop: 4, fontWeight: 700 }}>{MODE_META[m].blurb}</div>
                  <div style={{ fontSize: 15, marginTop: 8, fontWeight: 800 }}>{"Level " + lv + " of 6  " + pips}</div>
                  <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{levelInfo(m, lv)}</div>
                </button>
              );
            })}
          </div>
          <div aria-label="Next prize" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14, background: "#FFFFFF", border: "4px solid #0F2A4A", borderRadius: 24, padding: "10px 14px", boxShadow: "0 6px 0 rgba(15,42,74,0.35)" }}>
            <div style={{ position: "relative", width: 110, display: "flex", justifyContent: "center", flex: "0 0 110px" }}>
              <div style={{ filter: "brightness(0)", opacity: 0.55 }}>
                <RewardArt r={prize} size={90} />
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 900, color: "#FFFFFF", textShadow: "2px 2px 0 #0F2A4A" }}>?</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#334155" }}>{"🎁 Next prize: " + prize.name + " at " + prize.cost + " ⭐"}</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#0F2A4A", lineHeight: "40px" }}>{prizeMore + " more " + (prizeMore === 1 ? "star" : "stars") + "!"}</div>
              {prizeMore <= 6 ? <div style={{ fontSize: 26, letterSpacing: 2 }}>{upTo(prizeMore).map(() => "☆").join("")}</div> : null}
            </div>
            <button style={{ ...pillBtn(false), minWidth: 64, minHeight: 64, fontSize: 28, padding: 6 }} aria-label="Say the next prize" onClick={() => say(prizeSpeech)}>🔊</button>
          </div>
          <div style={{ marginTop: 18, fontSize: 14, color: "#334155", lineHeight: "20px", background: "rgba(255,255,255,0.6)", borderRadius: 14, padding: "10px 12px" }}>
            For the grown-up: start with Count, then let Miles wander. Each road has levels 1 to 6 and moves up after 3 right in a row. A star comes only from a right answer on the very first tap: the answer buttons stay dimmed until Yaya finishes asking, and after the first tap they lock until the result shows, so spamming never earns stars. After a miss he can still answer, and the help kicks in (items light up and count along, the Add groups zoom together, Quick Look shows them again). In Bigger or Smaller, Yaya says "fewer means the little pile" on every fewer question until he gets 3 fewer questions right in a row. Count, Add, Take Away, and Find the Number each show five numbers to choose from (the right one and four others). Letter Land starts with M, P and A from his books and works up to all 26. About half the rounds are little letters (five choices), and the top level matches a big letter to its little letter. Rewards come one at a time: Yaya's items, Rex the dino at 39 stars, Rex's 12 items (42 to 75), then the garage at 78 with a new car every 3 stars, golden cars, garage extras, and a trophy every 20 stars after 280. The box above always shows the next prize. Everything saves on this device; to move to another iPad, press and hold the grown-up button below for a save code.
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <button
              aria-label="Grown-ups: press and hold"
              onPointerDown={(e) => { e.preventDefault(); startHold(); }}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                position: "relative", overflow: "hidden", minHeight: 60, padding: "10px 22px", borderRadius: 9999,
                border: "3px solid #1E3A5F", background: "#FFFFFF", color: "#1E3A5F", fontSize: 18, fontWeight: 800,
                fontFamily: font, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", touchAction: "none",
              } as CSSProperties}
            >
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: holdPct + "%", background: "rgba(30,58,95,0.25)" }} />
              <span style={{ position: "relative" }}>{"🔒 Grown-ups: press and hold 2 seconds"}</span>
            </button>
          </div>
        </div>
      ) : null}

      {screen === "dress" ? (
        <div>
          <div style={{ display: "flex", gap: 10, margin: "14px 0 6px", flexWrap: "wrap" }}>
            {(["yaya", "rex"] as Buddy[]).map((b) => {
              const open = b === "yaya" || save.unlocked.indexOf("rex") >= 0;
              return (
                <button key={b} style={{ ...pillBtn(dressWho === b), opacity: open ? 1 : 0.6 }} disabled={!open} aria-pressed={dressWho === b} onClick={() => setDressWho(b)}>
                  {(b === "rex" ? "🦖 Dress Rex" : "🐧 Dress Yaya") + (open ? "" : " 🔒 " + REX_COST + " ⭐")}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 6px" }}>{"Dress up " + (dressWho === "rex" ? "Rex" : "Yaya") + "! Tap to put it on. Tap again to take it off."}</p>
          <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 14px" }}>
            <BuddyPic buddy={dressWho} mood="idle" size={190} outfit={dressWho === "rex" ? save.rex : outfit} />
          </div>
          {SLOTS.map((slot) => (
            <div key={slot} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 900, margin: "4px 0 8px" }}>{SLOT_META[slot].emoji + "  " + SLOT_META[slot].title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {(dressWho === "rex" ? REX_ITEMS : ITEMS).filter((it) => it.slot === slot).map((it) => {
                  const open = save.unlocked.indexOf(it.id) >= 0;
                  const on = (dressWho === "rex" ? save.rex[slot] : save[slot]) === it.id;
                  const preview: Outfit = { ...NO_OUTFIT };
                  preview[slot] = it.id;
                  return (
                    <button key={it.id} onClick={() => wear(dressWho, slot, it.id)} disabled={!open} aria-pressed={on} aria-label={it.name} style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: 10,
                      borderRadius: 20,
                      border: on ? "6px solid #0F2A4A" : open ? "3px solid #1E3A5F" : "3px dashed #64748B",
                      background: on ? "#FDE68A" : open ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                      cursor: open ? "pointer" : "default",
                      fontFamily: font,
                      color: "#0F2A4A",
                      opacity: open ? 1 : 0.75,
                    }}>
                      <div style={{ filter: open ? "none" : "grayscale(1)", opacity: open ? 1 : 0.5 }}>
                        <BuddyPic buddy={dressWho} mood="idle" size={64} outfit={preview} />
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, textAlign: "center" }}>{it.name}</div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{on ? "✓ Wearing" : open ? "Tap to wear" : "🔒 " + it.cost + " ⭐"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {screen === "garage" ? (
        <div>
          <p style={{ fontSize: 26, fontWeight: 900, margin: "14px 0 6px", color: "#0F2A4A" }}>🏠 Miles's Garage</p>
          {save.stars < GARAGE_OPEN ? (
            <div style={{ background: "#FFFFFF", border: "4px solid #0F2A4A", borderRadius: 24, padding: 18, textAlign: "center" }}>
              <svg width="260" height="170" viewBox="0 0 260 170" style={{ display: "block", margin: "0 auto", maxWidth: "100%" }} aria-label="Closed garage">
                <polygon points="10,70 130,10 250,70" fill="#DC2626" stroke="#7F1D1D" strokeWidth="3" />
                <rect x="30" y="70" width="200" height="96" fill="#E5E7EB" stroke="#475569" strokeWidth="3" />
                <rect x="55" y="88" width="150" height="78" fill="#94A3B8" stroke="#334155" strokeWidth="3" />
                <path d="M55 104 H205 M55 120 H205 M55 136 H205 M55 152 H205" stroke="#475569" strokeWidth="3" />
                <rect x="112" y="40" width="36" height="22" rx="4" fill="#FFFFFF" stroke="#334155" strokeWidth="2" />
                <text x="130" y="57" fontSize="16" textAnchor="middle">🔒</text>
              </svg>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>{"The garage opens at " + GARAGE_OPEN + " ⭐"}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#334155" }}>{(GARAGE_OPEN - save.stars) + " more stars. Then a new car about every 3 stars!"}</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", color: "#0F2A4A" }}>
                {garagePick >= 0 ? "✋ Now tap a spot to park the " + carName(save.garage[garagePick]) + "." : "Tap a car to pick it up, then tap a spot to park it."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, background: "#475569", padding: 10, borderRadius: 22, border: "5px solid #1E293B" }}>
                {upTo(GARAGE_SPOTS).map((i) => {
                  const id = save.garage[i];
                  const car = id ? carById(id) : null;
                  const gold = !!car && save.unlocked.indexOf("gold-" + car.id) >= 0;
                  const sel = garagePick === i;
                  return (
                    <button key={i} onClick={() => tapSpot(i)} aria-label={car ? "Spot " + (i + 1) + ": " + (gold ? "Golden " : "") + car.name : "Empty spot " + (i + 1)} aria-pressed={sel} style={{
                      position: "relative", minHeight: 150, borderRadius: 14, padding: "22px 6px 6px", fontFamily: font, cursor: "pointer",
                      border: sel ? "6px solid #FACC15" : "3px dashed #F8FAFC", background: sel ? "#FEF9C3" : "#64748B",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", color: sel ? "#0F2A4A" : "#F8FAFC",
                    }}>
                      <span style={{ position: "absolute", top: 4, left: 8, fontSize: 15, fontWeight: 900 }}>{"P" + (i + 1)}</span>
                      {sel ? <span style={{ position: "absolute", top: 2, right: 6, fontSize: 15, fontWeight: 900 }}>✋ Moving</span> : null}
                      {car ? (
                        <>
                          <div style={{ width: "100%", display: "flex", justifyContent: "center", animation: sel ? "miles-hop 900ms ease-in-out infinite" : "none" }}><CarArt car={car} w={140} gold={gold} /></div>
                          <div style={{ fontSize: 15, fontWeight: 900, background: "#FFFFFF", color: "#0F2A4A", borderRadius: 10, padding: "1px 8px", marginTop: 4, textAlign: "center" }}>{(gold ? "✨ Golden " : "") + car.name}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 15, fontWeight: 800, opacity: 0.8, paddingBottom: 30 }}>{garagePick >= 0 ? "Park here" : "Empty"}</div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, margin: "16px 0 8px" }}>Garage extras</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {EXTRAS.map((x) => {
                  const open = save.stars >= x.cost;
                  return (
                    <div key={x.id} style={{ width: 130, background: open ? "#FFFFFF" : "rgba(255,255,255,0.5)", border: open ? "3px solid #1E3A5F" : "3px dashed #64748B", borderRadius: 18, padding: 8, textAlign: "center" }}>
                      <div style={{ filter: open ? "none" : "brightness(0)", opacity: open ? 1 : 0.4, display: "flex", justifyContent: "center" }}><ExtraArt id={x.id} w={80} /></div>
                      <div style={{ fontSize: 15, fontWeight: 900 }}>{open ? x.name : "🔒 " + x.cost + " ⭐"}</div>
                    </div>
                  );
                })}
                {trophies.map((c) => (
                  <div key={c} style={{ width: 130, background: "#FFFFFF", border: "3px solid #1E3A5F", borderRadius: 18, padding: 8, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}><TrophyArt cost={c} w={80} /></div>
                    <div style={{ fontSize: 15, fontWeight: 900 }}>{c + "-star trophy"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {screen === "grownup" ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ background: "#FFFFFF", border: "4px solid #0F2A4A", borderRadius: 24, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#0F2A4A" }}>📤 Get my code</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#334155", margin: "4px 0 10px" }}>This code holds all of Miles's progress (stars, levels, buddy, outfits, garage). Type or paste it on another device under "Enter a code".</div>
            <div aria-label="Save code" data-code={myCode} style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 30, fontWeight: 900, letterSpacing: 2, wordBreak: "break-all", background: "#F1F5F9", border: "3px solid #1E3A5F", borderRadius: 16, padding: "12px 14px", color: "#0F172A", userSelect: "all" } as CSSProperties}>{myCode}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <button style={pillBtn(false)} onClick={copyCode}>📋 Copy</button>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{copied}</span>
            </div>
          </div>
          <div style={{ background: "#FFFFFF", border: "4px solid #0F2A4A", borderRadius: 24, padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#0F2A4A" }}>📥 Enter a code</div>
            <input
              aria-label="Code to load"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeErr(""); setCodePreview(null); }}
              placeholder="VROOM-XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              style={{ width: "100%", boxSizing: "border-box", marginTop: 10, fontSize: 24, fontWeight: 800, padding: "12px 14px", borderRadius: 14, border: "3px solid #1E3A5F", fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button style={pillBtn(false)} onClick={checkCode}>🔎 Check code</button>
            </div>
            {codeErr ? (
              <div role="alert" style={{ marginTop: 10, fontSize: 18, fontWeight: 800, color: "#0F2A4A", border: "3px dashed #0F2A4A", borderRadius: 14, padding: "8px 12px", background: "#FEF3C7" }}>{"⚠️ " + codeErr}</div>
            ) : null}
            {codePreview ? (
              <div aria-label="Code preview" style={{ marginTop: 12, border: "4px solid #0F2A4A", borderRadius: 18, padding: 12, background: "#F8FAFC" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{"🔎 " + codeSummary(codePreview)}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#334155", margin: "6px 0 10px" }}>{"Loading this replaces what's on this device now (" + save.stars + " stars)."}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={pillBtn(true)} onClick={loadCode}>✓ Yes, load this code</button>
                  <button style={pillBtn(false)} onClick={() => setCodePreview(null)}>✗ Cancel</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {screen === "play" ? (
        <div data-mode={q.mode} data-answer={q.answer} data-level={q.level} data-ready={ready && !resolving ? "1" : "0"} data-qid={qNum} data-letter-kind={q.mode === "letters" ? q.letterKind : ""} style={letterPlay ? { flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" } : undefined}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: letterPlay || snug ? "4px 0 6px" : "12px 0 10px", flexShrink: letterPlay ? 0 : undefined }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: compact ? 22 : 28, fontWeight: 900, lineHeight: compact ? "26px" : "34px", color: "#0F2A4A" }}>{promptFor(q, gone)}</div>
              {q.mode === "compare" ? (
                <div style={{ display: "inline-block", marginTop: 6, fontSize: 30, fontWeight: 900, padding: "4px 16px", borderRadius: 16, background: "#FFFFFF", border: "4px solid #0F2A4A" }}>
                  {q.ask === "more" ? "⬆️ MORE" : "⬇️ FEWER"}
                </div>
              ) : null}
              {q.mode === "compare" && q.ask === "fewer" && (q.hint || missed) ? (
                <div aria-label="Fewer hint" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 6, marginLeft: 8, fontSize: 22, fontWeight: 900, padding: "4px 14px", borderRadius: 16, background: "#FEF3C7", border: "3px dashed #0F2A4A" }}>
                  <span>💡 Fewer means the little pile</span>
                  <span aria-hidden="true" style={{ fontSize: 14, letterSpacing: -2 }}>●●</span>
                  <span aria-hidden="true" style={{ fontSize: 14 }}>vs</span>
                  <span aria-hidden="true" style={{ fontSize: 14, letterSpacing: -2 }}>●●●●●●●●</span>
                </div>
              ) : null}
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: "#334155" }}>
                {"In a row: " + upTo(3).map((k) => (k < inRow ? "●" : "○")).join(" ") + "   ·   " + levelInfo(mode, lvNow)}
              </div>
            </div>
            <button style={{ ...pillBtn(false), minWidth: compact ? 46 : 70, minHeight: compact ? 46 : 70, fontSize: compact ? 22 : 32, padding: compact ? 4 : 8 }} onClick={() => say(speechFor(q))} aria-label="Read it to me">🔊</button>
          </div>

          <div style={{ position: "relative", flex: letterPlay ? "1 1 auto" : undefined, minHeight: letterPlay ? 0 : undefined, display: letterPlay ? "flex" : undefined }}>
            <div style={{
              background: fieldBg(q.kind),
              borderRadius: 28,
              minHeight: letterPlay || (snug && findChoices) ? 0 : 240,
              flex: letterPlay ? "1 1 auto" : undefined,
              padding: letterPlay ? 8 : 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "6px solid #1E3A5F",
              overflow: "hidden",
              boxSizing: "border-box",
            }}>
              {renderField()}
            </div>
            {boom ? (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 28 }}>
                <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, #FDE68A 0%, #F97316 50%, transparent 70%)", animation: "miles-boom-burst 700ms ease-out forwards" }} />
                <div style={{ fontSize: 72, fontWeight: 900, color: "#F97316", textShadow: "3px 3px 0 #FFF, -2px -2px 0 #7C2D12, 0 0 16px #FDE68A", animation: "miles-boom-pop 500ms ease-out both", zIndex: 2, letterSpacing: 2 }}>BOOM!</div>
                {save.buddy === "rex" ? (
                  <div style={{ position: "absolute", left: 8, bottom: 4, zIndex: 3, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                    <div style={{ fontSize: 34, fontWeight: 900, color: "#166534", background: "#FFFFFF", border: "4px solid #166534", borderRadius: 20, padding: "0 12px", animation: "miles-boom-pop 500ms ease-out both" }}>ROAR!</div>
                    <Rex mood="cheer" size={100} outfit={save.rex} />
                  </div>
                ) : null}
                {boomBits.map((bit) => (
                  <div key={bit.id} style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: bit.shape === "star" ? 22 : 14,
                    height: bit.shape === "star" ? 22 : 14,
                    background: bit.shape === "star" ? "transparent" : bit.color,
                    borderRadius: bit.shape === "circle" ? "50%" : 3,
                    fontSize: 22,
                    lineHeight: "22px",
                    textAlign: "center",
                    animation: "miles-confetti 900ms ease-out forwards",
                    animationDelay: bit.delay + "ms",
                    zIndex: 1,
                    ["--dx"]: bit.dx + "px",
                    ["--dy"]: bit.dy + "px",
                  } as CSSProperties}>{bit.shape === "star" ? "⭐" : ""}</div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: letterPlay ? 6 : 12, flexWrap: "wrap", minHeight: letterPlay ? 0 : 8, flexShrink: letterPlay ? 0 : undefined }}>
            {q.mode === "add" && !joined && !locked ? (
              <button style={pillBtn(false)} onClick={() => { setJoined(true); setFeedback("Zoom! Now count them all."); say("Zoom! Now count them all."); }}>🧲 Zoom together</button>
            ) : null}
            {q.mode === "quick" && !locked && !hinting ? (
              <button style={pillBtn(false)} onClick={() => setPeekId((p) => p + 1)}>👀 Peek again</button>
            ) : null}
            {(q.mode === "find" || (q.mode === "letters" && q.letterKind !== "match")) && !reveal && !locked ? (
              <button style={compact ? { ...pillBtn(false), padding: "4px 10px", minHeight: 40, fontSize: 16 } : pillBtn(false)} onClick={() => { gate.missed = true; setReveal(true); setMissed(true); setStreak(0); setFeedback("Here it is! Find the one that looks just like it."); }}>👀 Show me</button>
            ) : null}
          </div>

          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 800, minHeight: letterPlay ? 0 : 24, color: "#334155", marginTop: letterPlay ? 2 : 6, flexShrink: letterPlay ? 0 : undefined }}>{!ready && !locked ? "👂 Listen first…" : ""}</div>
          {q.mode !== "compare" ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: letterChoices || findChoices || roadNumbers ? "center" : undefined, gap: choiceGap, margin: letterChoices ? "6px 0 4px" : "8px 0 10px", flexWrap: "wrap", flexShrink: letterChoices ? 0 : undefined }}>
              {q.choices.map((n) => {
                const right = picked === n;
                const wrong = wrongs.indexOf(n) >= 0;
                const waiting = (q.mode === "take" && !gone) || !ready || (resolving && !locked);
                const label = q.mode === "letters" ? q.labels[n] : String(n);
                return (
                  <button key={n} onClick={() => choose(n)} aria-label={"Answer " + label} data-choice={n} disabled={waiting} style={{
                    position: "relative",
                    width: choiceSize,
                    height: letterChoices || findChoices || roadNumbers ? "auto" : choiceSize,
                    aspectRatio: letterChoices || findChoices || roadNumbers ? "1 / 1" : undefined,
                    boxSizing: letterChoices || findChoices || roadNumbers ? "border-box" : undefined,
                    flexShrink: letterChoices || findChoices || roadNumbers ? 0 : undefined,
                    display: letterChoices || findChoices || roadNumbers ? "flex" : undefined,
                    alignItems: letterChoices || findChoices || roadNumbers ? "center" : undefined,
                    justifyContent: letterChoices || findChoices || roadNumbers ? "center" : undefined,
                    padding: letterChoices || findChoices || roadNumbers ? 0 : undefined,
                    whiteSpace: findChoices || roadNumbers ? "nowrap" : undefined,
                    borderRadius: 30,
                    fontSize: letterChoices ? "clamp(58px, 16vw, 86px)" : findChoices ? "clamp(48px, 12vw, 72px)" : roadNumbers ? "clamp(42px, 13vw, 58px)" : 58,
                    lineHeight: 1,
                    fontWeight: 900,
                    cursor: "pointer",
                    fontFamily: font,
                    border: right ? "7px solid #15803D" : wrong ? "5px dashed #64748B" : "5px solid #1E3A5F",
                    background: right ? "#BBF7D0" : wrong ? "#E2E8F0" : "#FFFFFF",
                    color: wrong ? "#64748B" : "#0F172A",
                    opacity: waiting ? 0.45 : 1,
                    boxShadow: "0 6px 0 " + (right ? "#15803D" : "#64748B"),
                  }}>
                    <span style={{ fontFamily: q.mode === "letters" ? 'ui-rounded, "Nunito", Arial, sans-serif' : "inherit" }}>{label}</span>
                    {right || wrong ? (
                      <span style={{ position: "absolute", top: 4, right: 8, fontSize: 26, fontWeight: 900, color: "#0F172A" }}>{right ? "✓" : "✗"}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div style={{ textAlign: "center", fontSize: 24, minHeight: letterPlay ? 0 : 36, fontWeight: 900, color: "#0F2A4A", marginTop: q.mode === "compare" ? 14 : 0, flexShrink: letterPlay ? 0 : undefined }}>{feedback}</div>
        </div>
      ) : null}
    </div>
  );
}
