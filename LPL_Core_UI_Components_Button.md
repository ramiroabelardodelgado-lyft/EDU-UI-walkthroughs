---
source: Lyft Product Language (LPL) — Core UI Components / Button (Figma)
retrieved: 2026-05-08
applies_to: plugin UI (dist/ui.html), any LPL-compliant HTML surface
---

# LPL Core UI Components — Button

## VARIANTS

### 1. Primary (Interactive)
```
role:        main CTA, single most important action per view
shape:       pill (border-radius: 100px)
bg:          #820076  (--c-interactive)
bg:hover:    #66035b  (--c-interactive-h)
bg:active:   #500050
bg:disabled: #c490bf  (--c-interactive-d)
text:        #ffffff  (--c-text-inv)
text:disabled: #ffffff
font-size:   11px (compact) / 10.5px (medium)
font-weight: 700
border:      none
padding:     7px 0  (full-width) | 8px 4px (block)
```
CSS class: `#btn-export`, `.edu-btn.full`

### 2. Secondary
```
role:        supporting action, low emphasis
shape:       pill (border-radius: 100px)
bg:          #e5e1db  (--c-sec)
bg:hover:    #dad5ce  (--c-sec-h)
bg:active:   #cec8c1
text:        #1d0c17  (--c-text)
font-size:   11px
font-weight: 600
border:      none
padding:     7px 16px (auto-width) | 7px 0 (full-width)
```
CSS class: `#btn-close`, `#btn-scale-all`

### 3. Secondary Card (edu-btn grid)
```
role:        grid of related secondary actions (2-col layout)
shape:       rounded rect (border-radius: 8px / --r-sm)
bg:          #e5e1db  (--c-sec)
bg:hover:    #dad5ce
bg:active:   #cec8c1
text:        #1d0c17
font-size:   10px
font-weight: 500
border:      none
padding:     6px 4px
```
Modifier `.full` → promotes to Primary pill style spanning full grid width.
CSS class: `.edu-btn`

### 4. Inline Outline (Negative/Warning)
```
role:        per-item action in a warn context (scale frame to 393)
shape:       pill
bg:          transparent
bg:hover:    rgba(200,21,52, 0.07)
bg:active:   rgba(152,18,44, 0.12)
border:      1.5px solid #c81534  (--c-negative)
text:        #c81534
font-size:   9.5px
font-weight: 600
padding:     2px 9px
```
CSS class: `.scale-btn`

---

## LAYOUT PATTERNS

### Full-width primary + secondary pair (footer)
```html
<div id="footer">  <!-- flex row, gap:8px, padding:8px 12px 10px -->
  <button id="btn-close">Close</button>   <!-- secondary, flex:0 0 auto -->
  <button id="btn-export">Export</button> <!-- primary,   flex:1 -->
</div>
```

### Full-width secondary standalone
```html
<button id="btn-scale-all">Scale all → 393</button>
<!-- wrapped in div padding:4px 12px 8px, button width:100% -->
```

### 2-col edu grid with promoted full-width primary
```html
<div id="edu-buttons">  <!-- grid 1fr 1fr, gap:5px, padding:0 12px 6px -->
  <button class="edu-btn full" data-type="step-click">…</button>  <!-- spans 2 cols, primary style -->
  <button class="edu-btn" data-type="highlight">…</button>
  <button class="edu-btn" data-type="highlight-button">…</button>
  <!-- … more 1-col buttons … -->
</div>
```

---

## STATE RULES
- `disabled` only applies to Primary; set via `btn.disabled = true` in JS.
- Disabled state: `cursor: not-allowed`, bg `#c490bf`, text stays `#ffffff`.
- Success/error feedback uses `#status-line` element, NOT button color changes.
- After async action completes, restore button: `btn.disabled = false; btn.textContent = "Export"`.

---

## TYPOGRAPHY SUMMARY
```
Primary btn:          font-weight:700  font-size:11px  letter-spacing:0.01em
Secondary btn:        font-weight:600  font-size:11px
Secondary card btn:   font-weight:500  font-size:10px
Full-width promo btn: font-weight:700  font-size:10.5px
Outline btn:          font-weight:600  font-size:9.5px
font-family: "Rebel Sans Text VF", "SF Pro Text", -apple-system, sans-serif
```

---

## NOTES FOR AI USE
- LPL "pill" = `border-radius: 100px` (not 50%, not 9999px — use `100px`).
- `border: none` on all variants — outlines use `border:1.5px solid <color>` only on the Negative/Warning variant.
- The `.edu-btn.full` class is a promotion modifier: it overrides the card style with full primary pill style via `grid-column: 1 / -1`.
- Do not use `background-color` shorthand if you need to set `opacity` separately — LPL buttons use solid fills (no alpha on the bg token itself).
- Hover/active states are CSS `:hover` / `:active` pseudo-classes; no JS state toggling needed.
