# EDU-UI Walkthroughs — Figma Plugin

A Figma plugin that validates, annotates, and exports UI screens as a ZIP (PNGs + JSON) for rendering as animated UI walkthroughs. The ZIP is the shared input contract for both render paths:

| Render path | Repo | Requirements |
|---|---|---|
| **Headless (Playwright)** | [render-playwright](https://github.com/ramiroabelardodelgado-lyft/render-playwright) | Node 20+, ffmpeg — no Adobe license needed |
| **After Effects** | AE_Walkthroughs.jsx (separate) | After Effects |

The Playwright renderer covers the majority of walkthroughs and produces MP4s with no Adobe dependency. After Effects is available for cases that need manual timeline control.

---

## Installation

1. Clone or download this repository to a permanent location (not Downloads — deleting the folder breaks the plugin).
2. In Figma: right-click the canvas → **Plugins > Development > Import plugin from manifest…**
3. Select `manifest.json` from the cloned folder.
4. The plugin is now available via `⌘/` → type **EDU-UI Walkthroughs**, or right-click → **Plugins > Development**.

---

## Workflow

### 1. Select your frames
Select the Frames, Section, or Component containing your screens. The plugin panel opens automatically showing a pre-flight check.

### 2. Fix frame sizes (if needed)
The plugin flags any frame that isn't **393 px wide**. Use the per-frame **→ 393** button or **Scale all → 393** to resize. Scaling uses Figma's scale tool — contents scale proportionally, and height snaps to 852 if within ±4 px.

### 3. Annotate interactions
Select any element inside a screen frame and click an EDU component button to insert it at the correct position:

| Button | Inserts | Notes |
|---|---|---|
| **HL Button + Step + Click** | EDU-Highlight_Button + EDU-Step + EDU-click | Standard tappable button |
| **HL Area + Step + Click** | EDU-Highlight + EDU-Step + EDU-click | Squared/area tap target |
| **Highlight** | EDU-Highlight | Area highlight only |
| **HL Button** | EDU-Highlight_Button | Button highlight only |
| **Click** | EDU-click | Tap indicator (50×50 circle) |
| **Swipe** | EDU-swipe | Swipe gesture overlay |
| **Scroll** | EDU-scroll | 393×852 viewport outline — marks scroll boundary |
| **Drag** | EDU-drag | Drag gesture overlay |

**Padding** (default 2 px) controls how much the highlight extends beyond the selected element. Elements ≥ 380 px wide are capped at 380 px (no padding applied).

**Step** circles are positioned ¾ above the highlight top edge. **Click** circles are centered on the selected element.

### 4. Export
Click **Export**. The plugin will:
- Rename frames to `01`, `02`, `03`… (left-to-right by canvas position, EDU- nodes excluded)
- Set `clipsContent = true` on each frame
- Strip frame-level shadows, strokes, and corner radii
- Export each frame as a 1290 px wide PNG
- Bundle all PNGs + a `data.json` into a ZIP named after the current Figma page

Pass the ZIP directly to [render-playwright](https://github.com/ramiroabelardodelgado-lyft/render-playwright) (`npm run render -- export.zip`) or unzip and point **AE_Walkthroughs.jsx** at the folder.

---

## JSON output format

Each EDU component is recorded in the JSON alongside its parent frame:

```json
[
  {
    "name": "01",
    "o_width": 393,
    "o_height": 852,
    "data": [
      {
        "name": "EDU-Highlight_Button",
        "x": 10, "y": 200,
        "width": 373, "height": 52,
        "opacity": 1, "rotation": 0,
        "cornerRadius": 10,
        "parent": "01"
      }
    ]
  }
]
```

---

## EDU component naming reference

EDU components are identified by name prefix. Do not rename them — both the Playwright renderer and the AE script rely on these exact names.

| Prefix | Animation type |
|---|---|
| `EDU-Highlight` | Area highlight pulse |
| `EDU-Highlight_Button` | Button highlight pulse |
| `EDU-Step` | Step number indicator |
| `EDU-click` | Tap ripple |
| `EDU-swipe` | Swipe gesture |
| `EDU-scroll` | Scroll boundary outline |
| `EDU-drag` | Drag gesture |

---

## Changelog

### [v1.0.19] — May 2026
- Added **HL Area + Step + Click** combo button (EDU-Highlight variant for squared tap targets)
- `cornerRadius` now stored in JSON export for all EDU components

### [v1.0.18] — May 2026
- Wide element cap: highlights on elements ≥ 380 px wide max out at 380 px (no padding applied)

### [v1.0.17] — May 2026
- EDU-scroll fixed to 393×852 px, stroke-only (no fill), anchored at frame origin — marks scroll boundary

### [v1.0.16] — May 2026
- Applied Lyft Product Language (LPL) Core UI tokens throughout plugin panel (Rebel Sans VF, #820076 primary, #c81534 warn)

### [v1.0.15] — March 2026
- Added **HL Button + Step + Click** combo button
- Step indicator: 50×50 circle, ¾ above highlight top edge
- Click indicator: 50×50 circle centered on selected element
- Highlights default to `cornerRadius: 10`; default padding changed to 2 px

### [v1.0.14] — March 2026
- EDU component insertion panel: 7 component types inserted at correct position relative to selected element
- Live selection info in plugin panel
- `selectionchange` listener keeps frame list live without disrupting EDU component work

### [v1.0.13] — March 2026
- Pre-flight frame size check with red canvas overlay for non-393 px frames
- Per-frame **→ 393** button and **Scale all → 393** (uses `rescale()` — scales contents, not just bounds)
- Export and Close buttons replace auto-run on load
- Export cleanup: `clipsContent = true`, strips frame-level shadows, strokes, and corner radii
- Plugin stays open after export; Export button re-enables

### [v0.17] — November 2024
- Support for 393 px and 1290 px source frame widths

### [v0.16] — legacy
- H and V scroll support

### [v0.13] — legacy
- ZIP export
