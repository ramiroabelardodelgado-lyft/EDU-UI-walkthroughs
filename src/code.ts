
figma.showUI(__html__);
figma.ui.resize(300, 420);

// ── Utilities ──────────────────────────────────────────────────────────────────

function addPadding(number: string | number, digits: number) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
}

function opacity_Toggle(node, override = undefined) {
  if (override) {
    node.opacity = +Boolean(override);
    return node;
  }
  node.opacity = +!Boolean(node.opacity);
  return node;
}

// ── Locale suffix lookup ───────────────────────────────────────────────────────
// Update these strings if the source page name format ever changes.
const LOOKUP_LOCALE_SUFFIX_FR = "[French (Canada) [fr-CA] (fr-CA)]";
const LOOKUP_LOCALE_SUFFIX_ES = "[Spanish (United States) [es-US] (es-US)]";

function getLangSuffix(pageName: string): string {
  if (pageName.endsWith(LOOKUP_LOCALE_SUFFIX_FR)) return "_" + LOOKUP_LOCALE_SUFFIX_FR;
  if (pageName.endsWith(LOOKUP_LOCALE_SUFFIX_ES)) return "_" + LOOKUP_LOCALE_SUFFIX_ES;
  return "_EN";
}

// Returns the ZIP base name based on selection and toggle state.
// useSectionName=true + section selected → "{sectionName}{langSuffix}"
// otherwise → full page name (legacy behaviour, no suffix)
function getZipName(useSectionName: boolean): string {
  const pageName = figma.currentPage.name;
  if (!useSectionName) return pageName;

  const sel = figma.currentPage.selection;
  const sectionName = sel.length > 0 && sel[0].type === "SECTION" ? sel[0].name : null;
  if (!sectionName) return pageName;

  return sectionName + getLangSuffix(pageName);
}

function sendPagename(useSectionName: boolean) {
  figma.ui.postMessage({ function: "pageName", pageName: getZipName(useSectionName) });
}

function check_child(child) {
  if (child.name.indexOf("EDU-") >= 0) {
    return {
      name: child.name,
      x: child.x,
      y: child.y,
      width: child.width,
      height: child.height,
      opacity: child.opacity,
      parent: child.parent.name,
      rotation: child.rotation,
      cornerRadius: typeof child.cornerRadius === "number" ? child.cornerRadius : 0
    };
  }
  return undefined;
}

async function sendScripts() {}

async function sendJson(json) {
  figma.ui.postMessage({ function: "addJson", jsonData: json });
}

async function sendImage(frame) {
  const image = await frame.exportAsync({
    format: "PNG",
    constraint: { type: "WIDTH", value: 1290 }
  });
  figma.ui.postMessage({ function: "addImage", imageData: image, name: frame.name + ".png" });
}

// ── Warning overlay helpers ────────────────────────────────────────────────────

const WARNING_NAME = "⚠ SIZE-WARNING";

function addWarningOverlay(frame: FrameNode) {
  const rect = figma.createRectangle();
  rect.name = WARNING_NAME;
  rect.resize(frame.width, frame.height);
  rect.x = 0;
  rect.y = 0;
  rect.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, opacity: 0.5 }];
  rect.locked = true;
  frame.appendChild(rect);
}

function cleanWarningOverlay(frame) {
  const children = Array.from((frame as FrameNode).children || []);
  children.forEach((child: any) => {
    if (child.name === WARNING_NAME) child.remove();
  });
}

// ── Frame selection helpers ────────────────────────────────────────────────────

function getSelectionFrames(type: string) {
  // @ts-ignore
  var sel: readonly SceneNode[] = figma.currentPage.selection;
  if (type === "SECTION" || type === "COMPONENT") {
    // @ts-ignore
    sel = figma.currentPage.selection[0].children;
  }
  // @ts-ignore
  if (sel[0] && sel[0].type === "COMPONENT") {
    // @ts-ignore
    sel = sel[0].children;
  }
  return Array.from(sel)
    .filter(n => n.name.indexOf("EDU-") !== 0)
    .sort((a, b) => a.x - b.x);
}

function checkSelection() {
  return figma.currentPage.selection[0]?.type || "FRAME";
}

// ── Pre-flight check ───────────────────────────────────────────────────────────

function buildFrameInfos(type: string) {
  const frames = getSelectionFrames(type);
  return frames.map(f => ({
    name: f.name,
    width: Math.round(f.width),
    height: Math.round(f.height),
    ok: Math.round(f.width) === 393
  }));
}

function runPrecheck() {
  const type = checkSelection();
  const frames = getSelectionFrames(type);

  frames.forEach(f => cleanWarningOverlay(f as FrameNode));

  const frameInfos = frames.map(f => {
    const ok = Math.round(f.width) === 393;
    if (!ok) addWarningOverlay(f as FrameNode);
    return { name: f.name, width: Math.round(f.width), height: Math.round(f.height), ok };
  });

  const warningCount = frameInfos.filter(f => !f.ok).length;
  const uiHeight = Math.min(
    Math.max(420, 180 + 36 * frames.length + (warningCount > 0 ? 24 : 0)),
    600
  );
  figma.ui.resize(300, uiHeight);

  figma.ui.postMessage({ function: "frameCheck", frames: frameInfos });
}

// ── Scale a frame to 393 ───────────────────────────────────────────────────────

function scaleFrame(frameName: string) {
  const type = checkSelection();
  const frames = getSelectionFrames(type);
  const frame = frames.find(f => f.name === frameName) as FrameNode;
  if (!frame) return;

  const newWidth = 393;
  let newHeight = Math.round(frame.height * 393 / frame.width);
  if (Math.abs(newHeight - 852) <= 4) newHeight = 852;

  frame.rescale(newWidth / frame.width);
  // Snap height to exactly 852 if the proportional result is within ±4 px
  if (Math.abs(Math.round(frame.height) - 852) <= 4) frame.resize(newWidth, 852);
  cleanWarningOverlay(frame);

  const frameInfos = frames.map(f => ({
    name: f.name,
    width: Math.round(f.width),
    height: Math.round(f.height),
    ok: Math.round(f.width) === 393
  }));

  figma.ui.postMessage({ function: "frameCheck", frames: frameInfos });
}

// ── EDU component creation ─────────────────────────────────────────────────────

// Returns the top-level screen frame (direct child of page or section) containing the node.
function getScreenFrame(node: SceneNode): FrameNode | null {
  let current: BaseNode = node;
  while (current.parent) {
    const parent = current.parent;
    if (parent.type === "PAGE" || parent.type === "SECTION") {
      return (current.type === "FRAME" || current.type === "COMPONENT")
        ? current as FrameNode
        : null;
    }
    current = parent;
  }
  return null;
}

// Position of node relative to a given ancestor frame, accounting for nesting.
function getPositionInFrame(node: SceneNode, frame: FrameNode): { x: number; y: number } {
  const nt = node.absoluteTransform;
  const ft = frame.absoluteTransform;
  return { x: nt[0][2] - ft[0][2], y: nt[1][2] - ft[1][2] };
}

function eduFill(name: string): SolidPaint {
  if (name.indexOf("Highlight_Button") > -1) return { type: "SOLID", color: { r: 0.13, g: 0.59, b: 0.95 }, opacity: 0.2 };
  if (name.indexOf("Highlight")        > -1) return { type: "SOLID", color: { r: 0.53, g: 0.12, b: 0.93 }, opacity: 0.2 };
  if (name.indexOf("Step")             > -1) return { type: "SOLID", color: { r: 1.00, g: 0.60, b: 0.00 }, opacity: 0.85 };
  if (name.indexOf("click")            > -1) return { type: "SOLID", color: { r: 1.00, g: 0.24, b: 0.50 }, opacity: 0.3 };
  if (name.indexOf("swipe")            > -1) return { type: "SOLID", color: { r: 0.13, g: 0.78, b: 0.94 }, opacity: 0.3 };
  if (name.indexOf("scroll")           > -1) return { type: "SOLID", color: { r: 0.24, g: 0.85, b: 0.45 }, opacity: 0.2 };
  if (name.indexOf("drag")             > -1) return { type: "SOLID", color: { r: 1.00, g: 0.60, b: 0.00 }, opacity: 0.3 };
  return { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 }, opacity: 0.2 };
}

function createEduFrame(parent: FrameNode, name: string, x: number, y: number, w: number, h: number, radius = 0): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(Math.max(2, Math.round(w)), Math.max(2, Math.round(h)));
  frame.x = Math.round(x);
  frame.y = Math.round(y);
  frame.fills = [eduFill(name)];
  frame.clipsContent = false;
  frame.strokes = [];
  frame.effects = [];
  // @ts-ignore
  frame.cornerRadius = radius;
  parent.appendChild(frame);
  return frame;
}

function addEduComponents(type: string, padding: number) {
  const sel = figma.currentPage.selection;
  if (!sel.length) {
    figma.ui.postMessage({ function: "status", text: "Select an element first.", error: true });
    return;
  }

  const node = sel[0];
  const screenFrame = getScreenFrame(node);
  if (!screenFrame) {
    figma.ui.postMessage({ function: "status", text: "Select an element inside a screen frame.", error: true });
    return;
  }

  const pos = getPositionInFrame(node, screenFrame);
  const x = pos.x;
  const y = pos.y;
  const w = node.width;
  const h = node.height;

  // For wide elements (≥380px), skip horizontal padding and cap at 380px.
  const wideElement = w >= 380;
  const hlW = wideElement ? Math.min(w, 380) : w + padding * 2;
  const hlX = wideElement ? x + (w - hlW) / 2 : x - padding;

  const created: FrameNode[] = [];

  switch (type) {
    case "highlight":
      created.push(createEduFrame(screenFrame, "EDU-Highlight",
        hlX, y - padding, hlW, h + padding * 2, 10));
      break;

    case "highlight-button":
      created.push(createEduFrame(screenFrame, "EDU-Highlight_Button",
        hlX, y - padding, hlW, h + padding * 2, 10));
      break;

    case "step-click": {
      const hlTop = y - padding;
      created.push(createEduFrame(screenFrame, "EDU-Highlight_Button",
        hlX, hlTop, hlW, h + padding * 2, 10));
      created.push(createEduFrame(screenFrame, "EDU-Step",
        x + w / 2 - 25, hlTop - 37.5, 50, 50, 25));
      created.push(createEduFrame(screenFrame, "EDU-click",
        x + w / 2 - 25, y + h / 2 - 25, 50, 50, 25));
      break;
    }

    case "step-click-area": {
      const hlTop = y - padding;
      created.push(createEduFrame(screenFrame, "EDU-Highlight",
        hlX, hlTop, hlW, h + padding * 2, 10));
      created.push(createEduFrame(screenFrame, "EDU-Step",
        x + w / 2 - 25, hlTop - 37.5, 50, 50, 25));
      created.push(createEduFrame(screenFrame, "EDU-click",
        x + w / 2 - 25, y + h / 2 - 25, 50, 50, 25));
      break;
    }

    case "click":
      created.push(createEduFrame(screenFrame, "EDU-click",
        x + w / 2 - 25, y + h / 2 - 25, 50, 50, 25));
      break;

    case "swipe":
      created.push(createEduFrame(screenFrame, "EDU-swipe", x, y, w, h));
      break;

    case "scroll": {
      // Fixed 393×852 viewport outline anchored to screen frame origin
      const scrollFrame = createEduFrame(screenFrame, "EDU-scroll", 0, 0, 393, 852);
      scrollFrame.fills = [];
      scrollFrame.strokes = [{ type: "SOLID", color: { r: 0.24, g: 0.85, b: 0.45 }, opacity: 1 }];
      scrollFrame.strokeWeight = 6;
      // @ts-ignore
      scrollFrame.strokeAlign = "INSIDE";
      created.push(scrollFrame);
      break;
    }

    case "drag":
      created.push(createEduFrame(screenFrame, "EDU-drag", x, y, w, h));
      break;
  }

  if (created.length) {
    figma.currentPage.selection = created;
    figma.viewport.scrollAndZoomIntoView(created);
    figma.ui.postMessage({
      function: "status",
      text: `Added ${created.map(c => c.name).join(", ")} to ${screenFrame.name}`,
      error: false
    });
  }
}

// ── Scale all non-393 frames in current selection ─────────────────────────────

function scaleAllFrames() {
  function log(text: string, error = false) {
    console.log(`[scaleAll] ${text}`);
    figma.ui.postMessage({ function: "status", text, error });
  }

  const sel = figma.currentPage.selection;
  if (!sel.length) { log("Nothing selected.", true); return; }

  const type = sel[0].type;
  log(`selection type: ${type}, count: ${sel.length}`);

  let frames: readonly SceneNode[];
  try {
    frames = getSelectionFrames(type);
  } catch (e) {
    log(`getSelectionFrames failed: ${e}`, true); return;
  }

  if (!frames.length) { log("No child frames found.", true); return; }

  let scaled = 0;
  frames.forEach(f => {
    const w = Math.round(f.width);
    if (w === 393) { log(`${f.name} already 393 — skipped`); return; }
    try {
      const factor = 393 / f.width;
      (f as FrameNode).rescale(factor);
      if (Math.abs(Math.round(f.height) - 852) <= 4) (f as FrameNode).resize(393, 852);
      cleanWarningOverlay(f as FrameNode);
      scaled++;
      log(`${f.name} → 393 × ${Math.round(f.height)}`);
    } catch (e) {
      log(`resize failed for ${f.name}: ${e}`, true);
    }
  });

  if (scaled > 0) log(`Done — scaled ${scaled} frame(s).`);
  refreshFrameList();
}

// ── Live frame list refresh ────────────────────────────────────────────────────

// Returns true when the current selection root is a frame/section/component
// (i.e. a valid target for frame-size detection, not a child element).
function isValidFrameSelection(): boolean {
  const sel = figma.currentPage.selection;
  if (!sel.length) return false;
  const t = sel[0].type;
  return t === "FRAME" || t === "SECTION" || t === "COMPONENT";
}

function refreshFrameList() {
  if (!isValidFrameSelection()) return; // keep current list while working on child elements
  try {
    const type = checkSelection();
    const frames = getSelectionFrames(type);

    frames.forEach(f => cleanWarningOverlay(f as FrameNode));

    const frameInfos = frames.map(f => {
      const ok = Math.round(f.width) === 393;
      if (!ok) addWarningOverlay(f as FrameNode);
      return { name: f.name, width: Math.round(f.width), height: Math.round(f.height), ok };
    });

    figma.ui.resize(300, Math.min(Math.max(420, 180 + 36 * frames.length), 600));
    figma.ui.postMessage({ function: "frameCheck", frames: frameInfos });
  } catch (_) {
    figma.ui.postMessage({ function: "frameCheck", frames: [] });
  }
}

// ── Selection change listener ──────────────────────────────────────────────────

function sendSelectionInfo() {
  const sel = figma.currentPage.selection;
  if (!sel.length) {
    figma.ui.postMessage({ function: "selectionInfo", element: null });
    return;
  }
  const node = sel[0];
  const screenFrame = getScreenFrame(node);
  if (!screenFrame) {
    figma.ui.postMessage({ function: "selectionInfo", element: null });
    return;
  }
  figma.ui.postMessage({
    function: "selectionInfo",
    element: {
      name: node.name,
      width: Math.round(node.width),
      height: Math.round(node.height),
      isEdu: node.name.indexOf("EDU-") > -1,
      screenName: screenFrame.name
    }
  });
}

figma.on("selectionchange", () => {
  sendSelectionInfo();
  refreshFrameList();
});

// ── Main export ────────────────────────────────────────────────────────────────

async function getFrames(type: string) {
  const frames = getSelectionFrames(type);
  let i = 1;
  const jsonData = [];
  const toTop = [];

  for (const frame of frames) {
    const uiData = [];
    const jsonUI = [];
    frame.name = addPadding(i, 2);

    const f = frame as FrameNode;
    f.clipsContent = true;
    f.effects = [];
    f.strokes = [];
    // @ts-ignore
    f.cornerRadius = 0;
    f.topLeftRadius = 0;
    f.topRightRadius = 0;
    f.bottomRightRadius = 0;
    f.bottomLeftRadius = 0;

    // @ts-ignore
    frame.children.forEach(child => {
      const UI = check_child(child);
      if (UI) {
        uiData.push(child);
        jsonUI.push(UI);
        opacity_Toggle(child, false);
        if (child.name.indexOf("EDU-Step") > -1 || child.name.indexOf("EDU-swipe") > -1) {
          toTop.push(child);
        }
      }
    });

    await sendImage(frame).then(() => {
      uiData.forEach(el => opacity_Toggle(el, true));
    });

    reOrder_layers(toTop);
    i++;
    jsonData.push({ name: frame.name, data: jsonUI, o_width: frame.width, o_height: frame.height });
  }

  sendJson(JSON.stringify(jsonData));
  return frames;
}

function reOrder_layers(toTop) {
  toTop.forEach(element => {
    try { element.parent.appendChild(element); } catch (e) {}
  });
}

async function main(type: string, useSectionName: boolean) {
  sendScripts();
  await getFrames(type);
  sendPagename(useSectionName);
  sendDownload();
}

function sendDownload() {
  figma.ui.postMessage({ function: "startDownload" });
}

// ── Message handler ────────────────────────────────────────────────────────────

figma.ui.onmessage = async (message) => {
  if (!message) return;

  if (message === "Close Plugin" || message?.type === "closePlugin") {
    figma.closePlugin();
    return;
  }

  if (message?.type === "scaleFrame") {
    scaleFrame(message.frameName);
    return;
  }

  if (message?.type === "startExport") {
    const type = checkSelection();
    const useSectionName = message.useSectionName !== false; // default true
    getSelectionFrames(type).forEach(f => cleanWarningOverlay(f as FrameNode));
    figma.ui.postMessage({ function: "resetZip" });
    await main(type, useSectionName);
    return;
  }

  if (message?.type === "addEduComponent") {
    addEduComponents(message.componentType, message.padding ?? 8);
    return;
  }

  if (message?.type === "scaleAll") {
    scaleAllFrames();
    return;
  }
};

// ── Startup ────────────────────────────────────────────────────────────────────

runPrecheck();
sendSelectionInfo();
