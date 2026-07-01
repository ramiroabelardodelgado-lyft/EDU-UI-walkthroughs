import JSZip from '../node_modules/jszip/dist/jszip.min.js';
import { saveAs } from 'file-saver';

var vers = '1.0.19';
console.log(`Loaded ui.ts v. ${vers}`);

let zip = new JSZip();
let zippedStuff: { name: string; data: any }[] = [];
let zipName = '';

// ── On load: wire up buttons ───────────────────────────────────────────────────

window.addEventListener('load', () => {
  const versionEl = document.getElementById("version");
  if (versionEl) versionEl.innerHTML = `v. ${vers}`;

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

  // ── Trigger ZIP download ────────────────────────────────────────────────────
  if (msg.function === "startDownload") {
    zip.generateAsync({ type: "blob" }).then(content => {
      saveAs(content, `${zipName}.zip`);
      // Restore export button — plugin stays open
      const btn = document.getElementById("btn-export") as HTMLButtonElement;
      btn.disabled = false;
      btn.textContent = "Export";
      showStatus(`Exported ${zipName}.zip`, false);
    });
    return;
  }
}, false);

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

// ── Status line ────────────────────────────────────────────────────────────────

function showStatus(text: string, error: boolean) {
  const el = document.getElementById("status-line")!;
  el.textContent = text;
  el.className   = error ? "error" : "ok";
  // Errors stay until next action; success messages clear after 6 s
  if (!error) setTimeout(() => { if (el.textContent === text) el.textContent = ""; }, 6000);
}
