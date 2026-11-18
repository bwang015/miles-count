import { useState, useEffect, useGrokTheme } from "grok/canvas";
import type { CSSProperties } from "grok/canvas";

type Mode = "count" | "add" | "take" | "compare" | "find" | "quick";
type Kind = "car" | "ball" | "penguin" | "truck" | "rocket";
type Slot = "head" | "face" | "back" | "hold";
type Screen = "home" | "dress" | "play";
type Layout = "row" | "rows5" | "scatter" | "tens" | "dice";
type Spot = { x: number; y: number };
type Ask = "more" | "fewer";
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
};
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
};
type Item = { id: string; slot: Slot; name: string; cost: number };
type BoomBit = { id: number; dx: number; dy: number; delay: number; color: string; shape: "star" | "circle" | "sq" };

const SAVE_KEY = "miles-vroom-count-v1";
const KINDS: Kind[] = ["car", "ball", "penguin", "truck", "rocket"];
const MODES: Mode[] = ["count", "add", "take", "compare", "find", "quick"];
const SLOTS: Slot[] = ["head", "face", "back", "hold"];
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
  compare: { title: "Bigger or Smaller", emoji: "⚖️", blurb: "Which pile has more?" },
  find: { title: "Find the Number", emoji: "🔎", blurb: "Yaya says a number. Find it!" },
  quick: { title: "Quick Look", emoji: "👀", blurb: "Peek fast! How many?" },
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
  return ["1 to 3, dice dots", "1 to 4, dice dots", "1 to 5, dice dots", "2 to 5, mixed up", "2 to 5, faster", "3 to 5, fastest"][L - 1];
}

function numChoices(answer: number, lo: number, hi: number, spread: number): number[] {
  const set: number[] = [answer];
  let guard = 0;
  while (set.length < 3 && guard < 300) {
    guard++;
    const d = rand(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    const n = answer + d;
    if (n >= lo && n <= hi && set.indexOf(n) < 0) set.push(n);
  }
  for (let n = lo; set.length < 3 && n <= hi; n++) if (set.indexOf(n) < 0) set.push(n);
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

function makeCompare(lv: number): Q {
  const q = blankQ("compare", lv);
  const cfg: number[][] = [[5, 3, 4], [6, 2, 5], [10, 3, 9], [10, 2, 4], [15, 2, 5], [20, 1, 3]];
  const c = cfg[clampLevel(lv) - 1];
  const minBig = [4, 3, 6, 6, 8, 11][clampLevel(lv) - 1];
  const big = rand(Math.max(minBig, 1 + c[1]), c[0]);
  const d = rand(c[1], Math.min(c[2], big - 1));
  const small = big - d;
  const leftBig = Math.random() < 0.5;
  q.a = leftBig ? big : small;
  q.b = leftBig ? small : big;
  q.ask = lv >= 5 && Math.random() < 0.4 ? "fewer" : "more";
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
  while (set.length < 3 && guard < 300) {
    guard++;
    const x = lv <= 2 ? rand(lo, hi) : n + rand(-4, 4);
    if (x >= lo && x <= hi && set.indexOf(x) < 0) set.push(x);
  }
  for (let x = lo; set.length < 3 && x <= hi; x++) if (set.indexOf(x) < 0) set.push(x);
  q.a = n;
  q.answer = n;
  q.choices = shuffle(set);
  return q;
}

function makeQuick(lv: number): Q {
  const q = blankQ("quick", lv);
  let n = 1, max = 3;
  if (lv <= 1) { n = rand(1, 3); max = 3; q.layout = "dice"; q.flashMs = 1500; }
  else if (lv === 2) { n = rand(1, 4); max = 4; q.layout = "dice"; q.flashMs = 1400; }
  else if (lv === 3) { n = rand(1, 5); max = 5; q.layout = "dice"; q.flashMs = 1300; }
  else if (lv === 4) { n = rand(2, 5); max = 5; q.layout = "scatter"; q.flashMs = 1300; }
  else if (lv === 5) { n = rand(2, 5); max = 5; q.layout = "scatter"; q.flashMs = 1200; }
  else { n = rand(3, 5); max = 5; q.layout = "scatter"; q.flashMs = 1000; }
  q.spots = q.layout === "dice" ? diceSpots(n) : scatterSpots(n, 3, 3);
  q.a = n;
  q.answer = n;
  const ch: number[] = [];
  for (let i = 1; i <= max; i++) ch.push(i);
  q.choices = ch;
  return q;
}

function makeQ(mode: Mode, level: number): Q {
  const lv = clampLevel(level);
  if (mode === "add") return makeAdd(lv);
  if (mode === "take") return makeTake(lv);
  if (mode === "compare") return makeCompare(lv);
  if (mode === "find") return makeFind(lv);
  if (mode === "quick") return makeQuick(lv);
  return makeCount(lv);
}

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
  return "Quick look! How many " + noun(k, 2) + "?";
}

function speechFor(q: Q): string {
  const k = q.kind;
  if (q.mode === "count") return "How many " + noun(k, 2) + "? Count them!";
  if (q.mode === "add") {
    return "Here " + (q.a === 1 ? "is " : "are ") + q.a + " " + noun(k, q.a) + ". And here " + (q.b === 1 ? "is " : "are ") + q.b + " more. How many " + noun(k, 2) + " in all?";
  }
  if (q.mode === "take") return q.a + " " + noun(k, q.a) + ". " + q.b + " " + leaveVerb(k, q.b) + ". How many are left?";
  if (q.mode === "compare") return "Which pile has " + (q.ask === "more" ? "more" : "fewer") + " " + noun(k, 2) + "? Tap it!";
  if (q.mode === "find") return "Tap " + q.answer + "!";
  return "Quick look! How many " + noun(k, 2) + " did you see?";
}

function defaultLevels(): Levels {
  return { count: 1, add: 1, take: 1, compare: 1, find: 1, quick: 1 };
}

function defaultSave(): Save {
  return { v: 2, stars: 0, levels: defaultLevels(), head: "none", face: "none", back: "none", hold: "none", unlocked: ["none"] };
}

function findItem(id: string): Item | null {
  for (let i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
  return null;
}

function itemName(id: string): string {
  const it = findItem(id);
  return it ? it.name : "";
}

function unlockedFor(stars: number): string[] {
  const out: string[] = ["none"];
  for (let i = 0; i < ITEMS.length; i++) if (ITEMS[i].cost <= stars) out.push(ITEMS[i].id);
  return out;
}

function slotPick(v: unknown, slot: Slot, unlocked: string[]): string {
  if (typeof v !== "string") return "none";
  const it = findItem(v);
  if (!it || it.slot !== slot || unlocked.indexOf(v) < 0) return "none";
  return v;
}

function parseSave(raw: string): { save: Save; migrated: boolean } {
  const base = defaultSave();
  let migrated = false;
  try {
    const v = JSON.parse(raw) as {
      v?: unknown; stars?: unknown; level?: unknown; levels?: unknown;
      head?: unknown; face?: unknown; back?: unknown; hold?: unknown; unlocked?: unknown;
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
    } else if (v.v !== 2) {
      migrated = true;
    }
    if (Array.isArray(v.unlocked)) {
      const u: string[] = ["none"];
      for (let i = 0; i < v.unlocked.length; i++) {
        const it = v.unlocked[i];
        if (typeof it === "string" && findItem(it) && u.indexOf(it) < 0) u.push(it);
      }
      base.unlocked = u;
    }
    const earned = unlockedFor(base.stars);
    for (let i = 0; i < earned.length; i++) if (base.unlocked.indexOf(earned[i]) < 0) base.unlocked.push(earned[i]);
    base.head = slotPick(v.head, "head", base.unlocked);
    base.face = slotPick(v.face, "face", base.unlocked);
    base.back = slotPick(v.back, "back", base.unlocked);
    base.hold = slotPick(v.hold, "hold", base.unlocked);
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

function say(text: string): void {
  try {
    const w = window as unknown as { speechSynthesis?: SpeechSynthesis };
    if (!w.speechSynthesis) return;
    w.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 1.15;
    w.speechSynthesis.speak(u);
  } catch (e) { /* no voice available */ }
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
  return "It's " + q.answer + ".";
}

export default function App() {
  const theme = useGrokTheme();
  const font = 'ui-rounded, "Nunito", "Segoe UI Rounded", ' + theme.font.family;
  const [boot] = useState<{ save: Save; migrated: boolean }>(() => loadSave());
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
  const [unlockNote, setUnlockNote] = useState<string>(() => {
    if (!boot.migrated || boot.save.unlocked.length <= 1) return "";
    const names = boot.save.unlocked.filter((id) => id !== "none").map(itemName);
    return "Yaya kept all " + boot.save.stars + " of your stars, and they unlocked Dress Up items: " + names.join(", ") + ". Tap Dress Up to try them on!";
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

  function newQuestion(m: Mode, lv: number): void {
    const nq = makeQ(m, lv);
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
    say(speechFor(nq));
  }

  function startMode(m: Mode): void {
    activeToken++;
    setMode(m);
    setStreak(0);
    setUnlockNote("");
    setScreen("play");
    newQuestion(m, save.levels[m]);
  }

  function goScreen(s: Screen): void {
    activeToken++;
    setScreen(s);
    setBoom(false);
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
    if (locked) return;
    if (q.mode === "take" && !gone) return;
    if (wrongs.indexOf(n) >= 0) return;
    const token = activeToken;
    if (n === q.answer) {
      setLocked(true);
      setPicked(n);
      setBoom(true);
      setBoomBits(makeBoomBits());
      setJoined(true);
      setHinting(false);
      const praise = ["BOOM! You got it!", "Vroom vroom, yes!", "Yaya is so proud!", "Super job, Miles!"][rand(0, 3)];
      const what = answerPhrase(q);
      let lv = save.levels[mode];
      let wait = 2600;
      if (!missed) {
        const s = streak + 1;
        setStreak(s);
        const up = s % 3 === 0 && lv < 6;
        if (up) lv = lv + 1;
        const stars = save.stars + 1;
        const earned = unlockedFor(stars);
        const unlocked = save.unlocked.slice();
        const names: string[] = [];
        for (let i = 0; i < earned.length; i++) {
          if (unlocked.indexOf(earned[i]) < 0) {
            unlocked.push(earned[i]);
            if (earned[i] !== "none") names.push(itemName(earned[i]));
          }
        }
        setSave({ ...save, stars, unlocked, levels: { ...save.levels, [mode]: lv } });
        let msg = praise + " ⭐ " + what;
        let speak = praise;
        if (up) {
          msg += " Level up! Now level " + lv + ".";
          speak += " Level up!";
        }
        if (names.length > 0) {
          setUnlockNote("New for Yaya: the " + names.join(" and the ") + "! Tap Dress Up to try it on.");
          speak += " You got the " + names.join(" and the ") + " for Yaya!";
          wait = 3400;
        } else if (!up) {
          wait = 2200;
        }
        setFeedback(msg);
        say(speak);
      } else {
        setStreak(0);
        setFeedback("You got it! " + what + " The next one is a star chance.");
        say("You got it! Next one is a star chance.");
      }
      const finalLv = lv;
      setTimeout(() => {
        if (token === activeToken) newQuestion(mode, finalLv);
      }, wait);
      return;
    }
    setWrongs((w) => w.concat([n]));
    setMissed(true);
    setStreak(0);
    let tip = "Almost! Let's count them together.";
    if (q.mode === "add") {
      tip = "Almost! Zoom them together and count them all.";
      setJoined(true);
      startHint();
    } else if (q.mode === "take") {
      tip = "Almost! Let's count the ones that stayed.";
      startHint();
    } else if (q.mode === "compare") {
      tip = "Hmm! Let's count each pile.";
      startHint();
    } else if (q.mode === "find") {
      tip = "Not that one. Look and listen again!";
      setReveal(true);
    } else if (q.mode === "quick") {
      tip = "Let's look again and count them.";
      startHint();
    } else {
      startHint();
    }
    setFeedback(tip);
    say(q.mode === "find" ? "Not that one. " + speechFor(q) : tip);
  }

  function tapItem(i: number): void {
    if (locked || hinting) return;
    setTaps((prev) => (prev.indexOf(i) >= 0 ? prev.filter((x) => x !== i) : prev.concat([i])));
  }

  function wear(slot: Slot, id: string): void {
    if (save.unlocked.indexOf(id) < 0) return;
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
            onClick={() => choose(side)}
            style={{
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 170, flexWrap: "wrap" }}>
          <Yaya mood={yayaMood} size={110} outfit={outfit} />
          <div style={{ background: "#FFFFFF", border: "5px solid #1E3A5F", borderRadius: 28, padding: "14px 26px", fontSize: 30, fontWeight: 900, color: "#0F2A4A", minWidth: 200, textAlign: "center" }}>
            {reveal || locked ? (
              <span>{"Tap "}<span style={{ fontSize: 72, lineHeight: "80px" }}>{q.answer}</span>{" !"}</span>
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

  const nextItem = ITEMS.filter((it) => save.unlocked.indexOf(it.id) < 0)[0];
  const lvNow = save.levels[mode];
  const inRow = streak % 3;
  const bigChoices = q.mode === "find";
  const choiceSize = bigChoices ? 150 : q.choices.length > 3 ? 104 : 124;

  return (
    <div style={{
      fontFamily: font,
      color: "#1E3A5F",
      background: "linear-gradient(#7EC8E3, #FDE68A 55%, #FDBA74)",
      padding: 18,
      maxWidth: 840,
      margin: "0 auto",
      minHeight: "100%",
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
        @keyframes miles-pop-in { 0% { transform: translate(-50%, -50%) scale(0.3); } 100% { transform: translate(-50%, -50%) scale(1); } }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Yaya mood={yayaMood} size={screen === "home" ? 92 : 70} outfit={outfit} />
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: "34px", color: "#0F2A4A" }}>Miles's Vroom Count</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {"⭐ " + save.stars}
              {screen === "play" ? (
                <span style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginLeft: 10 }}>
                  {MODE_META[mode].title + " · Level " + lvNow + " of 6"}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {screen !== "home" ? <button style={pillBtn(false)} onClick={() => goScreen("home")}>🗺️ Map</button> : null}
          <button style={pillBtn(screen === "dress")} onClick={() => goScreen("dress")}>👕 Dress Up</button>
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
          {nextItem ? (
            <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800, color: "#0F2A4A" }}>
              {"🎁 Next for Yaya: " + nextItem.name + " at " + nextItem.cost + " ⭐ (" + (nextItem.cost - save.stars) + " more)"}
            </div>
          ) : (
            <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800 }}>🏆 Yaya has every Dress Up item!</div>
          )}
          <div style={{ marginTop: 18, fontSize: 14, color: "#334155", lineHeight: "20px", background: "rgba(255,255,255,0.6)", borderRadius: 14, padding: "10px 12px" }}>
            For the grown-up: start with Count, then let Miles wander. Each road has levels 1 to 6 and moves up after 3 right in a row. A star comes only from a right answer on the first tap; after a miss he can still answer, and the help kicks in (items light up and count along, the Add groups zoom together, Quick Look shows them again). Add and Take Away are brand new ideas at 3, so it's fine to stay on their early levels for weeks: count each group with him, then count them all together. Yaya reads each question aloud (🔊 repeats it) and never says the answer. In Find the Number, 👀 Show me displays the number, with no star that time. Short sessions work best. Yaya unlocks a new Dress Up item about every 3 stars. Everything saves on this device.
          </div>
        </div>
      ) : null}

      {screen === "dress" ? (
        <div>
          <p style={{ fontSize: 22, fontWeight: 800, margin: "14px 0 6px" }}>Dress up Yaya! Tap to put it on. Tap again to take it off.</p>
          <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 14px" }}>
            <Yaya mood="idle" size={190} outfit={outfit} />
          </div>
          {SLOTS.map((slot) => (
            <div key={slot} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 900, margin: "4px 0 8px" }}>{SLOT_META[slot].emoji + "  " + SLOT_META[slot].title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {ITEMS.filter((it) => it.slot === slot).map((it) => {
                  const open = save.unlocked.indexOf(it.id) >= 0;
                  const on = save[slot] === it.id;
                  const preview: Outfit = { head: "none", face: "none", back: "none", hold: "none" };
                  preview[slot] = it.id;
                  return (
                    <button key={it.id} onClick={() => wear(slot, it.id)} disabled={!open} aria-pressed={on} aria-label={it.name} style={{
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
                        <Yaya mood="idle" size={64} outfit={preview} />
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

      {screen === "play" ? (
        <div data-mode={q.mode} data-answer={q.answer} data-level={q.level}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 10px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: "34px", color: "#0F2A4A" }}>{promptFor(q, gone)}</div>
              {q.mode === "compare" ? (
                <div style={{ display: "inline-block", marginTop: 6, fontSize: 30, fontWeight: 900, padding: "4px 16px", borderRadius: 16, background: "#FFFFFF", border: "4px solid #0F2A4A" }}>
                  {q.ask === "more" ? "⬆️ MORE" : "⬇️ FEWER"}
                </div>
              ) : null}
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: "#334155" }}>
                {"In a row: " + upTo(3).map((k) => (k < inRow ? "●" : "○")).join(" ") + "   ·   " + levelInfo(mode, lvNow)}
              </div>
            </div>
            <button style={{ ...pillBtn(false), minWidth: 70, minHeight: 70, fontSize: 32, padding: 8 }} onClick={() => say(speechFor(q))} aria-label="Read it to me">🔊</button>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{
              background: fieldBg(q.kind),
              borderRadius: 28,
              minHeight: 240,
              padding: 14,
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

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12, flexWrap: "wrap", minHeight: 8 }}>
            {q.mode === "add" && !joined && !locked ? (
              <button style={pillBtn(false)} onClick={() => { setJoined(true); setFeedback("Zoom! Now count them all."); say("Zoom! Now count them all."); }}>🧲 Zoom together</button>
            ) : null}
            {q.mode === "quick" && !locked && !hinting ? (
              <button style={pillBtn(false)} onClick={() => setPeekId((p) => p + 1)}>👀 Peek again</button>
            ) : null}
            {q.mode === "find" && !reveal && !locked ? (
              <button style={pillBtn(false)} onClick={() => { setReveal(true); setMissed(true); setStreak(0); setFeedback("Here it is! Find the one that looks just like it."); }}>👀 Show me</button>
            ) : null}
          </div>

          {q.mode !== "compare" ? (
            <div style={{ display: "flex", justifyContent: "center", gap: bigChoices ? 22 : 16, margin: "18px 0 10px", flexWrap: "wrap" }}>
              {q.choices.map((n) => {
                const right = picked === n;
                const wrong = wrongs.indexOf(n) >= 0;
                const waiting = q.mode === "take" && !gone;
                return (
                  <button key={n} onClick={() => choose(n)} aria-label={"Answer " + n} disabled={waiting} style={{
                    position: "relative",
                    width: choiceSize,
                    height: choiceSize,
                    borderRadius: 30,
                    fontSize: bigChoices ? 84 : 58,
                    fontWeight: 900,
                    cursor: "pointer",
                    fontFamily: font,
                    border: right ? "7px solid #15803D" : wrong ? "5px dashed #64748B" : "5px solid #1E3A5F",
                    background: right ? "#BBF7D0" : wrong ? "#E2E8F0" : "#FFFFFF",
                    color: wrong ? "#64748B" : "#0F172A",
                    opacity: waiting ? 0.5 : 1,
                    boxShadow: "0 6px 0 " + (right ? "#15803D" : "#64748B"),
                  }}>
                    {n}
                    {right || wrong ? (
                      <span style={{ position: "absolute", top: 4, right: 8, fontSize: 26, fontWeight: 900, color: "#0F172A" }}>{right ? "✓" : "✗"}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div style={{ textAlign: "center", fontSize: 24, minHeight: 36, fontWeight: 900, color: "#0F2A4A", marginTop: q.mode === "compare" ? 14 : 0 }}>{feedback}</div>
        </div>
      ) : null}
    </div>
  );
}
