import JSZip from '../node_modules/jszip/dist/jszip.min.js';
import { saveAs } from 'file-saver';

var vers = '1.0.19';
console.log(`Loaded ui.ts v. ${vers}`);

let zip = new JSZip();
let zippedStuff: { name: string; data: any }[] = [];
let zipName = '';

// ── Render server state ────────────────────────────────────────────────────────
type RenderMode = 'export' | 'render-full' | 'render-compressed';
let renderMode: RenderMode = 'export';
const RENDER_SERVER = 'http://localhost:4444';
let serverOnline = false;
let currentPreviewUrl: string | null = null;
let lastMp4Blob: Blob | null = null;
let lastMp4Name = 'walkthrough.mp4';

// ── On load: wire up buttons ───────────────────────────────────────────────────

window.addEventListener('load', () => {
  const versionEl = document.getElementById("version");
  if (versionEl) versionEl.innerHTML = `v. ${vers}`;
  reportHeight();

  document.getElementById("btn-close")!.addEventListener("click", () => {
    parent.postMessage({ pluginMessage: { type: "closePlugin" } }, "*");
  });

  document.getElementById("btn-export")!.addEventListener("click", () => {
    const btn = document.getElementById("btn-export") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Exporting…";
    // Reset zip for a fresh export
    zip = new JSZip();
    zippedStuff = [];
    const useSectionName = (document.getElementById("chk-section-name") as HTMLInputElement).checked;
    parent.postMessage({ pluginMessage: { type: "startExport", useSectionName } }, "*");
  });

  document.getElementById("btn-scale-all")!.addEventListener("click", () => {
    parent.postMessage({ pluginMessage: { type: "scaleAll" } }, "*");
  });

  // EDU component buttons
  document.querySelectorAll<HTMLButtonElement>(".edu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const type    = btn.dataset.type!;
      const padding = parseInt((document.getElementById("padding-input") as HTMLInputElement).value, 10) || 8;
      parent.postMessage({ pluginMessage: { type: "addEduComponent", componentType: type, padding } }, "*");
    });
  });

  // Render server buttons
  document.getElementById("btn-render-full")!.addEventListener("click", () => startRender(false));
  document.getElementById("btn-render-compressed")!.addEventListener("click", () => startRender(true));
  document.getElementById("btn-save-mp4")!.addEventListener("click", saveMp4);

  // Accordion — clicking a collapsed group expands it AND collapses the other.
  // Clicking the already-expanded group is a no-op (one group is always open).
  document.querySelectorAll<HTMLButtonElement>(".group-header").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.closest(".group") as HTMLElement | null;
      if (!target || !target.classList.contains("collapsed")) return;
      document.querySelectorAll<HTMLElement>(".group").forEach(g => {
        if (g === target) g.classList.remove("collapsed");
        else g.classList.add("collapsed");
      });
      reportHeight();
    });
  });

  // Poll /health immediately and every 5s
  pingHealth();
  setInterval(pingHealth, 5000);
});

// ── Zip helpers ────────────────────────────────────────────────────────────────

function addFiles(name: string, data: any) {
  zip.file(name, data, { base64: true });
  zippedStuff.push({ name, data });
}

function addJson(name: string, data: any) {
  zip.file(name, data);
  zippedStuff.push({ name, data });
}

// ── Plugin message handler ─────────────────────────────────────────────────────

window.addEventListener("message", (event) => {
  if (!event.data.pluginMessage) return;
  const msg = event.data.pluginMessage;
  console.log(`message - ${msg.function}`);

  // ── Frame pre-flight check ──────────────────────────────────────────────────
  if (msg.function === "frameCheck") {
    renderFrameList(msg.frames);
    return;
  }

  // ── Selection changed ───────────────────────────────────────────────────────
  if (msg.function === "selectionInfo") {
    renderSelectionInfo(msg.element);
    return;
  }

  // ── Status message from plugin ──────────────────────────────────────────────
  if (msg.function === "status") {
    showStatus(msg.text, msg.error);
    return;
  }

  // ── Reset zip (called before export starts) ─────────────────────────────────
  if (msg.function === "resetZip") {
    zip = new JSZip();
    zippedStuff = [];
    return;
  }

  // ── Page name for zip file ──────────────────────────────────────────────────
  if (msg.function === "pageName") {
    zipName = msg.pageName;
    return;
  }

  // ── Add JSON data to zip ────────────────────────────────────────────────────
  if (msg.function === "addJson") {
    zip.file("test.json", msg.jsonData);
    return;
  }

  // ── Add frame PNG to zip ────────────────────────────────────────────────────
  if (msg.function === "addImage") {
    const imgData = new Blob([msg.imageData.buffer], { type: "image/png" });
    console.log(`${msg.name} sent to zip`);
    addFiles(msg.name, imgData);
    return;
  }

  // ── Trigger ZIP download OR server render ───────────────────────────────────
  if (msg.function === "startDownload") {
    zip.generateAsync({ type: "blob" }).then(async (content) => {
      if (renderMode === "export") {
        // Classic ZIP download (unchanged — used for AE workflow / manual renders)
        saveAs(content, `${zipName}.zip`);
        const btn = document.getElementById("btn-export") as HTMLButtonElement;
        btn.disabled = false;
        btn.textContent = "Export";
        showStatus(`Exported ${zipName}.zip`, false);
        return;
      }

      // Render-server path: POST the zip and preview the returned MP4.
      const compress = renderMode === "render-compressed";
      setRenderStatus(`Rendering ${compress ? "480p" : "MP4"}… this can take 30–60s`, false);
      try {
        const mp4 = await postZipToServer(content, compress);
        // Filename intentionally does NOT distinguish full-res vs 480p — the
        // locale suffix from zipName (e.g. SectionName_EN / _FR / _ES) is the
        // organizing key. Users render one variant per locale at a time.
        const mp4Name = `${zipName}.mp4`;
        showPreview(mp4, mp4Name);
        setRenderStatus(`✔ ${mp4Name} · ${(mp4.size / 1_048_576).toFixed(1)} MB`, false);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setRenderStatus(`Render failed: ${errMsg}`, true);
      } finally {
        renderMode = "export";
        (document.getElementById("btn-export") as HTMLButtonElement).disabled = false;
        (document.getElementById("btn-export") as HTMLButtonElement).textContent = "Export";
        // pingHealth() will refresh render buttons based on latest server state;
        // kick one off now so users don't wait 5s for the next tick.
        pingHealth();
      }
    });
    return;
  }
}, false);

// ── Render server helpers ──────────────────────────────────────────────────────

async function pingHealth() {
  try {
    const r = await fetch(`${RENDER_SERVER}/health`, { method: "GET" });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    setServerState(true, !!j.busy);
  } catch {
    setServerState(false, false);
  }
}

function setServerState(online: boolean, busy: boolean) {
  const prevOnline = serverOnline;
  serverOnline = online;
  const dot  = document.getElementById("server-status-dot")!;
  const txt  = document.getElementById("server-status-text")!;
  const hint = document.getElementById("render-hint")!;
  const btnFull = document.getElementById("btn-render-full") as HTMLButtonElement;
  const btnComp = document.getElementById("btn-render-compressed") as HTMLButtonElement;

  if (online) {
    dot.classList.add("online");
    txt.classList.add("online");
    txt.textContent = busy ? "busy…" : "connected";
    hint.style.display = "none";
    // Only touch the buttons when we're NOT mid-render — otherwise we'd
    // fight the render flow that already disabled them.
    if (renderMode === "export") {
      btnFull.disabled = busy;
      btnComp.disabled = busy;
    }
  } else {
    dot.classList.remove("online");
    txt.classList.remove("online");
    txt.textContent = "not connected";
    hint.style.display = "block";
    if (renderMode === "export") {
      btnFull.disabled = true;
      btnComp.disabled = true;
    }
  }

  // Height changes when the hint appears/disappears
  if (prevOnline !== online) reportHeight();
}

function startRender(compress: boolean) {
  if (!serverOnline) return;
  if (renderMode !== "export") return; // already running
  renderMode = compress ? "render-compressed" : "render-full";

  resetPreview();
  (document.getElementById("btn-render-full") as HTMLButtonElement).disabled = true;
  (document.getElementById("btn-render-compressed") as HTMLButtonElement).disabled = true;
  const btnExport = document.getElementById("btn-export") as HTMLButtonElement;
  btnExport.disabled = true;
  btnExport.textContent = "Exporting…";

  // Fresh zip for this run
  zip = new JSZip();
  zippedStuff = [];

  setRenderStatus("Exporting frames…", false);
  const useSectionName = (document.getElementById("chk-section-name") as HTMLInputElement).checked;
  parent.postMessage({ pluginMessage: { type: "startExport", useSectionName } }, "*");
}

async function postZipToServer(zipBlob: Blob, compress: boolean): Promise<Blob> {
  const url = `${RENDER_SERVER}/render${compress ? "?compress=1" : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/zip" },
    body: zipBlob,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j && j.error) msg = j.error;
    } catch { /* keep default msg */ }
    throw new Error(msg);
  }
  return await res.blob();
}

function setRenderStatus(text: string, error: boolean) {
  const el = document.getElementById("render-status")!;
  el.textContent = text;
  el.className = error ? "error" : (text ? "ok" : "");
  reportHeight();
}

function showPreview(mp4: Blob, filename: string) {
  const area = document.getElementById("preview-area")!;
  const vid  = document.getElementById("preview-video") as HTMLVideoElement;
  const meta = document.getElementById("preview-meta")!;
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = URL.createObjectURL(mp4);
  vid.src = currentPreviewUrl;
  lastMp4Blob = mp4;
  lastMp4Name = filename;
  meta.textContent = `${filename}  ·  ${(mp4.size / 1_048_576).toFixed(1)} MB`;
  area.hidden = false;
  reportHeight();
}

function resetPreview() {
  const area = document.getElementById("preview-area")!;
  const vid  = document.getElementById("preview-video") as HTMLVideoElement;
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = null;
  vid.removeAttribute("src");
  vid.load();
  lastMp4Blob = null;
  area.hidden = true;
  reportHeight();
}

function saveMp4() {
  if (!lastMp4Blob) return;
  saveAs(lastMp4Blob, lastMp4Name);
}

// ── Render frame list ──────────────────────────────────────────────────────────

function renderFrameList(frames: Array<{ name: string; width: number; height: number; ok: boolean }>) {
  const list    = document.getElementById("frame-list")!;
  const hint    = document.getElementById("hint")!;
  const summary = document.getElementById("error-summary")!;
  list.innerHTML = "";

  if (!frames || frames.length === 0) {
    list.innerHTML = '<div style="padding:4px 12px;font-size:11px;color:#aaa">No frames detected</div>';
    hint.style.display = "none";
    summary.style.display = "none";
    return;
  }

  const badCount = frames.filter(f => !f.ok).length;
  hint.style.display    = badCount > 0 ? "block" : "none";
  summary.style.display = badCount > 0 ? "block" : "none";
  summary.textContent   = badCount > 0
    ? `⚠ ${badCount} frame${badCount > 1 ? "s" : ""} need${badCount === 1 ? "s" : ""} resizing to 393 px`
    : "";

  frames.forEach(f => {
    const row = document.createElement("div");
    row.className = `frame-row ${f.ok ? "ok" : "warn"}`;

    const dot = document.createElement("span");
    dot.className = "dot";
    dot.textContent = "●";

    const name = document.createElement("span");
    name.className = "frame-name";
    name.textContent = f.name;

    const dims = document.createElement("span");
    dims.className = "frame-dims";
    dims.textContent = `${f.width} × ${f.height}`;

    row.appendChild(dot);
    row.appendChild(name);
    row.appendChild(dims);

    if (!f.ok) {
      const btn = document.createElement("button");
      btn.className = "scale-btn";
      btn.textContent = "→ 393";
      btn.addEventListener("click", () => {
        parent.postMessage({ pluginMessage: { type: "scaleFrame", frameName: f.name } }, "*");
      });
      row.appendChild(btn);
    }

    list.appendChild(row);
  });
  reportHeight();
}

// ── Render selection info ──────────────────────────────────────────────────────

function renderSelectionInfo(element: { name: string; width: number; height: number; isEdu: boolean; screenName: string } | null) {
  const el = document.getElementById("selection-info")!;

  if (!element) {
    el.className = "empty";
    el.textContent = "No element selected";
    return;
  }

  if (element.isEdu) {
    el.className = "edu";
    el.textContent = `${element.name} (EDU — select a design element)`;
    return;
  }

  el.className = "";
  el.textContent = `${element.name}  ·  ${element.width} × ${element.height}  in ${element.screenName}`;
}

// ── Auto-resize ────────────────────────────────────────────────────────────────

function reportHeight() {
  // Wait one frame so the DOM has finished painting before measuring
  requestAnimationFrame(() => {
    const h = Math.ceil(document.documentElement.scrollHeight);
    parent.postMessage({ pluginMessage: { type: "uiResize", height: h } }, "*");
  });
}

// ── Status line ────────────────────────────────────────────────────────────────

function showStatus(text: string, error: boolean) {
  const el = document.getElementById("status-line")!;
  el.textContent = text;
  el.className   = error ? "error" : "ok";
  // Errors stay until next action; success messages clear after 6 s
  if (!error) setTimeout(() => { if (el.textContent === text) el.textContent = ""; }, 6000);
}
