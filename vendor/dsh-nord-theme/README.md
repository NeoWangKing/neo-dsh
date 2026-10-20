# dsh-nord-theme

Nord (Polar Night / Snow Storm / Frost / Aurora) as a DeepSeek Harness theme.

Registers through the harness theme service — `ctx.theme.register({ id, colorScheme, tokens })` —
so no CSS hacks and no patched harness code. Pick it in the theme settings, or ship it as the
default theme.

## Why tokens, not CSS

The UI defines a `--dsw-static-*` palette and every semantic `--dsw-alias-*` token references it,
so remapping the static layer re-themes everything at once. The map here is generated from the
palette present in the build and ordered by lightness: shade 50 → Snow Storm (text), shade
950/1000 → Polar Night (surfaces).

## Install

```sh
dsh plugin --profile <name> add dsh-nord-theme
```
