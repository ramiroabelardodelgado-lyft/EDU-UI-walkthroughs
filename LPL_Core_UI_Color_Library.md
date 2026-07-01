---
source: Lyft Product Language (LPL) — Core UI Color Library (Figma)
retrieved: 2026-05-08
token_format: CSS_VAR | FIGMA_TOKEN_NAME | HEX | USAGE
---

# LPL Core UI Color Library

## SURFACE TOKENS

| CSS Var | Figma Token | Hex | Usage |
|---|---|---|---|
| `--c-interactive` | `CORE_UI_COLORS.surfaceInteractive` | `#820076` | Primary CTA bg, section label accent |
| `--c-interactive-h` | `LPL Pressed Surface Interactive` | `#66035b` | Primary btn hover |
| `--c-interactive-d` | *(derived ~50% lightened)* | `#c490bf` | Primary btn disabled bg |
| `--c-negative` | `CORE_UI_COLORS.surfaceNegative` | `#c81534` | Destructive btn bg, error/warn border, error dot |
| `--c-negative-h` | `LPL Pressed Surface Negative` | `#98122c` | Destructive btn hover |
| `--c-sec` | `CORE_UI_COLORS.surfaceSecondary` *(resolved rgba)* | `#e5e1db` | Secondary btn bg, edu-btn bg, scale-btn bg |
| `--c-sec-h` | *(pressed secondary)* | `#dad5ce` | Secondary btn hover |
| *(active secondary)* | — | `#cec8c1` | Secondary btn active/pressed |
| `--c-bg` | *(warm off-white page bg)* | `#f0ede9` | Page/body background, input bg |
| `--c-surface` | — | `#ffffff` | Card/panel surface, section bg, footer bg |
| `--c-border` | — | `#dbd6d1` | Dividers, input border |

## TEXT TOKENS

| CSS Var | Figma Token | Hex | Usage |
|---|---|---|---|
| `--c-text` | `CORE_UI_COLORS.textPrimary` | `#1d0c17` | Body text, header bg (near-black warm dark) |
| `--c-text-inv` | `CORE_UI_COLORS.textPrimaryInverse` | `#ffffff` | Text on interactive/negative surfaces |
| `--c-muted` | *(warm muted, derived)* | `#7a6470` | Dims, secondary labels, empty state text |

## SEMANTIC TOKENS

| CSS Var | Semantic | Hex | Usage |
|---|---|---|---|
| `--c-ok` | success/positive | `#00823c` | Ok dot, ok status text |

## SHAPE TOKENS

| CSS Var | Value | Usage |
|---|---|---|
| `--r-pill` | `100px` | All primary buttons, secondary pill buttons |
| `--r-sm` | `8px` | Input fields, edu-btn cards |

## FONT

```
font-family: "Rebel Sans Text VF", "SF Pro Text", -apple-system, sans-serif
```
- `"Rebel Sans Text VF"` is the LPL variable font; must be installed on system to render.
- Fallbacks: SF Pro Text → system sans.

## QUICK REFERENCE: state map

```
surface          rest      hover     pressed/active  disabled
interactive      #820076   #66035b   #500050         #c490bf (bg) / #fff (text)
negative         #c81534   #98122c   #98122c         —
secondary        #e5e1db   #dad5ce   #cec8c1         —
```

## NOTES FOR AI USE
- All tokens verified from Figma Core UI Components file via MCP `get_variable_defs`.
- `surfaceInteractive` is NOT Lyft pink (#FF00B7). The brand color changed; current interactive is dark velvet `#820076`.
- `#1d0c17` doubles as both `textPrimary` and the plugin header/nav background (intentional — near-black warm dark).
- `surfaceSecondary` is defined in Figma as an rgba token; `#e5e1db` is the resolved solid equivalent on `#f0ede9` bg.
- When in doubt about a color, prefer token name over hex — the hex values above match the resolved values at time of retrieval.
