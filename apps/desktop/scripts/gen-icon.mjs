/**
 * gen-icon — build the app icon from the official DeepSeek fish logo.
 *
 * Reads the fish path (the harness ships it at apps/web/public/favicon.svg),
 * centers it on a DeepSeek-blue rounded square, and writes assets/icon.svg.
 * Run: node scripts/gen-icon.mjs <path-to-favicon.svg>
 */

import { readFileSync, writeFileSync } from 'node:fs'

const favicon = process.argv[2]
const source = readFileSync(favicon, 'utf8')
const match = source.match(/<path[^>]*\bd="([^"]*)"/)
if (!match) throw new Error('no path found in favicon')
const d = match[1]

// Approximate bounding box: endpoints plus Bezier control points (a safe
// superset for fitting; the logo uses only M/C/L/Z).
const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)
let x = 0
let y = 0
let minX = Infinity
let minY = Infinity
let maxX = -Infinity
let maxY = -Infinity
const track = (px, py) => {
  minX = Math.min(minX, px)
  minY = Math.min(minY, py)
  maxX = Math.max(maxX, px)
  maxY = Math.max(maxY, py)
}
for (let i = 0; i < tokens.length; i += 1) {
  const t = tokens[i]
  if (/[a-zA-Z]/.test(t)) {
    const cmd = t
    let j = i + 1
    const num = () => {
      const v = Number(tokens[j])
      j += 1
      return v
    }
    if (cmd === 'M' || cmd === 'L') {
      while (j < tokens.length && !/[a-zA-Z]/.test(tokens[j])) {
        x = num()
        y = num()
        track(x, y)
      }
    } else if (cmd === 'C') {
      while (j < tokens.length && !/[a-zA-Z]/.test(tokens[j])) {
        const x1 = num(); const y1 = num()
        const x2 = num(); const y2 = num()
        const ex = num(); const ey = num()
        track(x1, y1); track(x2, y2); track(ex, ey)
        x = ex; y = ey
      }
    } else if (cmd === 'Z') {
      // nothing to track
    }
    i = j - 1
  }
}

const PAD = 64
const SIZE = 512
const w = maxX - minX
const h = maxY - minY
const scale = Math.min((SIZE - 2 * PAD) / w, (SIZE - 2 * PAD) / h)
const tx = (SIZE - w * scale) / 2 - minX * scale
const ty = (SIZE - h * scale) / 2 - minY * scale

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${SIZE * 0.22}" fill="#4D6BFE"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${d}" fill="#ffffff"/>
  </g>
</svg>
`
writeFileSync(new URL('../assets/icon.svg', import.meta.url), svg)
console.log(`bbox: ${minX.toFixed(2)},${minY.toFixed(2)} -> ${maxX.toFixed(2)},${maxY.toFixed(2)}; scale=${scale.toFixed(4)} translate=${tx.toFixed(2)},${ty.toFixed(2)}`)
