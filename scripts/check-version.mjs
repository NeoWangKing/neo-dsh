#!/usr/bin/env node
// A tag must equal the version the build will print. 0.2.7 shipped artifacts named 0.2.5 because
// apps/desktop/package.json had been restored wholesale from an older tag and took its version
// with it — electron-builder names artifacts from that file, not from the git tag.
import { readFileSync } from 'node:fs'
const root = JSON.parse(readFileSync('package.json', 'utf8')).version
const desktop = JSON.parse(readFileSync('apps/desktop/package.json', 'utf8')).version
const tag = process.argv[2]?.replace(/^v/, '')
const ok = root === desktop && (!tag || tag === root)
console.log(ok ? `✓ version ${root} matches tag ${tag ?? '(none)'}` : `✗ root=${root} desktop=${desktop} tag=${tag}`)
process.exit(ok ? 0 : 1)
