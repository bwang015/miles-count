#!/usr/bin/env python3
"""Rebuild miles/Miles_Count_Game.html from miles/Miles_Vroom_Count.canvas.tsx:
canvas tsx -> standalone tsx (static theme + createRoot) -> esbuild IIFE -> spliced into the self-contained HTML shell."""
import subprocess, os
B = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(os.path.dirname(B), "miles")
src = open(os.path.join(M, "Miles_Vroom_Count.canvas.tsx")).read()
header = '''import React, { useState, useEffect, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";

type GrokTheme = { bg: { base: string; elevated: string }; text: { primary: string; secondary: string; onPrimary: string }; font: { family: string } };
const THEME: GrokTheme = {
  bg: { base: "#7EC8E3", elevated: "#FFFFFF" },
  text: { primary: "#1E3A5F", secondary: "#334155", onPrimary: "#FFFFFF" },
  font: { family: 'ui-rounded, "Nunito", "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif' },
};
function useGrokTheme(): GrokTheme {
  return THEME;
}
'''
lines = src.split("\n")
assert lines[0].startswith("import { useState") and lines[1].startswith("import type")
body = "\n".join(lines[2:])
sa = header + body + '\n\nconst rootEl = document.getElementById("root");\nif (rootEl) {\n  createRoot(rootEl).render(<App />);\n}\n'
open(os.path.join(B, "Miles_Count_Game.standalone.tsx"), "w").write(sa)
subprocess.run([os.path.join(B, "node_modules/.bin/esbuild"), "Miles_Count_Game.standalone.tsx", "--bundle", "--format=iife",
                "--minify", "--target=es2017", "--alias:react=./react-shim.js", "--alias:react-dom/client=./react-dom-client-shim.js",
                "--outfile=miles.app.iife.js"], cwd=B, check=True)
js = open(os.path.join(B, "miles.app.iife.js")).read()
shell = open(os.path.join(B, "Miles_Count_Game.prebatch.html")).read()
idx = shell.rfind("<script>")
end = shell.rfind("</script>")
html = shell[: idx + len("<script>")] + "\n" + js + "\n  " + shell[end:]
assert "<script src" not in html
open(os.path.join(M, "Miles_Count_Game.html"), "w").write(html)
# generator test bundle (pure functions only)
gen = body.split("export default function App()")[0]
gen = "const React = { createElement: (..._a: unknown[]) => null, Fragment: null };\ntype CSSProperties = { [k: string]: unknown };\n" + gen
gen += "\nexport { makeQ, parseSave, speechFor, promptFor, ITEMS, unlockedFor, lookAlikes, REX_ITEMS, REX_COST, CARS, REWARDS, EXTRAS, nextPrize, rewardsBetween, encodeSave, decodeCode, defaultSave, normalizeGarage, QUICK_FLASH_MS, LETTER_ORDER, letterPool, codeSummary, GARAGE_OPEN, GOLD_START, TROPHY_START, TROPHY_STEP };\n"
open("/tmp/miles_gen.tsx", "w").write(gen)
subprocess.run([os.path.join(B, "node_modules/.bin/esbuild"), "/tmp/miles_gen.tsx", "--format=esm", "--outfile=/tmp/miles_gen.mjs", "--log-level=warning"], cwd=B, check=True)
print("ok", len(html))
