/**
 * gen-icon.mjs — rasterise the app icon from the hand-authored SVG.
 *
 * `assets/icon.svg` is the source of truth and is this project's own mark: an N
 * drawn as a node graph (the harness is a tree of plugins) with a spark for 灵.
 * It is deliberately NOT DeepSeek's logo, so a Neo DSH build is never mistaken
 * for an official one. Edit the SVG by hand; this script only renders it.
 *
 * Outputs:
 *   build/icon.png   1024px — what electron-builder turns into .icns / .ico / Linux PNG
 *   assets/icon.png   512px — what the Linux zip installer puts in the menu
 *
 * Usage: node scripts/gen-icon.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = dirname(dirname(fileURLToPath(import.meta.url)))
const SVG = join(APP, 'assets', 'icon.svg')

/** @returns the first available SVG rasteriser on this machine. */
function rasteriser() {
  const candidates = [
    ['rsvg-convert', (size, out) => ['-w', String(size), '-h', String(size), SVG, '-o', out]],
    ['magick', (size, out) => ['-background', 'none', '-resize', `${size}x${size}`, SVG, out]],
    ['convert', (size, out) => ['-background', 'none', '-resize', `${size}x${size}`, SVG, out]],
  ]
  for (const [bin, args] of candidates) {
    try {
      execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' })
      return { bin, args }
    } catch {
      continue
    }
  }
  throw new Error('gen-icon: needs rsvg-convert, ImageMagick (magick) or convert on PATH')
}

if (!existsSync(SVG)) throw new Error(`gen-icon: ${SVG} is missing`)
const { bin, args } = rasteriser()

for (const [out, size] of [
  [join(APP, 'build', 'icon.png'), 1024],
  [join(APP, 'assets', 'icon.png'), 512],
]) {
  mkdirSync(dirname(out), { recursive: true })
  execFileSync(bin, args(size, out), { stdio: 'inherit' })
  console.log(`gen-icon: ${out} (${size}px, via ${bin})`)
}
