import { canvasToBlob } from "./shared.js";
import {
  removeBackground,
  preload
} from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm";

const DOC_PRESETS = {
  square: { w: 1080, h: 1080 },
  landscape43: { w: 1440, h: 1080 },
  landscape169: { w: 1920, h: 1080 },
  landscape54: { w: 1350, h: 1080 },
  portrait34: { w: 1080, h: 1440 },
  portrait45: { w: 1080, h: 1350 },
  portrait916: { w: 1080, h: 1920 }
};
const LAYERS_VIEW_MAX_WIDTH = {
  square: 760,
  landscape43: 980,
  landscape169: 980,
  landscape54: 920,
  portrait34: 620,
  portrait45: 600,
  portrait916: 430
};
const CANVAS_DEFINITION_SCALES = {
  sd: 0.5,
  hd: 1,
  "4k": 2
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function truncateName(name = "layer") {
  const clean = name.trim() || "layer";
  return clean.length > 28 ? `${clean.slice(0, 25)}…` : clean;
}

const HEX_COLOR_RE = /^#([0-9a-f]{6})$/i;

function normalizeHexColor(value, fallback = "#ffffff") {
  const raw = String(value || "").trim();
  if (HEX_COLOR_RE.test(raw)) return raw.toLowerCase();
  const compact = raw.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(compact)) {
    return `#${compact.toLowerCase()}`;
  }
  if (/^[0-9a-f]{3}$/i.test(compact)) {
    const expanded = compact.split("").map(part => `${part}${part}`).join("");
    return `#${expanded.toLowerCase()}`;
  }
  return fallback;
}

const WB_LIMIT = 25;
const TINT_LIMIT = 25;
const BRIGHT_LIMIT = 30;
const SAT_LIMIT = 30;
const CONTRAST_LIMIT = 30;
const BLUR_LIMIT = 30;
const MAX_LAYERS = 5;
const MODEL_READY_KEY = "bgoneModelReady";
const RETRO_DEFAULT_INTENSITY = 50;
const RETRO_DEFAULT_GRAIN = 15;

function mix(a, b, t) {
  return a + (b - a) * t;
}

function hasLayerProcessingAdjust(layer) {
  return (
    Math.abs(layer.wbTemp || 0) > 0.001 ||
    Math.abs(layer.wbTint || 0) > 0.001 ||
    Math.abs(layer.wbBright || 0) > 0.001 ||
    Math.abs(layer.wbSat || 0) > 0.001 ||
    Math.abs(layer.wbContrast || 0) > 0.001 ||
    Math.abs(layer.wbBlur || 0) > 0.001 ||
    (layer.retroStyle && layer.retroStyle !== "none")
  );
}

function getLayerRenderSource(layer) {
  return layer.processedCanvas || layer.image;
}

function computeShadowMetrics(drawW, drawH) {
  const basis = Math.max(1, Math.min(drawW, drawH));
  const blur = clamp(Math.round(basis * 0.018), 6, 24);
  const offsetY = clamp(Math.round(basis * 0.025), 4, 26);
  const opacity = 0.34;
  return { blur, offsetY, opacity };
}

async function imageLikeToPngBlob(imageLike) {
  const source = imageLike;
  if (!source) throw new Error("Missing image source.");
  const width = Math.max(1, Number(source.naturalWidth || source.width || 0));
  const height = Math.max(1, Number(source.naturalHeight || source.height || 0));
  const work = document.createElement("canvas");
  work.width = width;
  work.height = height;
  const wctx = work.getContext("2d");
  wctx.imageSmoothingEnabled = true;
  wctx.imageSmoothingQuality = "high";
  wctx.drawImage(source, 0, 0, width, height);
  return canvasToBlob(work, "image/png");
}

const PARALLAX_MAX_SCALE = 0.16;
const PARALLAX_PAN_X = 0.085;
const PARALLAX_PAN_Y = 0.07;

const PARALLAX_QUALITY_PRESETS = {
  100: { scale: 1.0, quality: 7 },
  50: { scale: 0.72, quality: 10 },
  30: { scale: 0.56, quality: 13 }
};

const PARALLAX_WATERMARK_SRC = "./assets/images/blizlab_logo_white.png";
let parallaxWatermarkPromise = null;
const LAYERS_HORIZONTAL_UI_QUERY = "(max-width: 1120px)";

function loadParallaxWatermark() {
  if (parallaxWatermarkPromise) return parallaxWatermarkPromise;
  parallaxWatermarkPromise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = PARALLAX_WATERMARK_SRC;
  });
  return parallaxWatermarkPromise;
}

function markModelReady() {
  localStorage.setItem(MODEL_READY_KEY, "1");
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function chromaStrength(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const sat = max <= 0 ? 0 : delta / max;
  const greenBias = clamp01((g - Math.max(r, b) - 6) / 96);

  let hue = 0;
  if (delta > 0.000001) {
    if (max === rn) {
      hue = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      hue = (bn - rn) / delta + 2;
    } else {
      hue = (rn - gn) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const hueDist = Math.abs(hue - 120);
  const circularDist = Math.min(hueDist, 360 - hueDist);
  const hueFactor = clamp01(1 - circularDist / 70);
  const satFactor = clamp01((sat - 0.08) / 0.55);
  const brightFactor = clamp01((max - 0.08) / 0.9);
  const soft = greenBias * (0.35 + satFactor * 0.4 + hueFactor * 0.25) * brightFactor;
  const hard = greenBias * hueFactor;
  return clamp01(Math.max(soft, hard));
}

export function createLayersTool(opts) {
  const {
    canvas,
    canvasWrap,
    listEl,
    overlayEl,
    ratioButtons,
    onStatus,
    onChange
  } = opts;

  const ctx = canvas.getContext("2d");
  const state = {
    ratio: "landscape43",
    canvasDefinition: "hd",
    layers: [],
    activeLayerId: null,
    canvasBackground: null
  };

  const interaction = {
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startLayerX: 0,
    startLayerY: 0
  };

  let layerSeed = 0;
  let modelWarmPromise = null;
  let soloLayerId = null;
  let soloPrevVisibility = null;
  let bgEditor = null;

  function normalizeCanvasBackground(background) {
    if (!background || background.type !== "solid") return null;
    const color = normalizeHexColor(background.color, "");
    if (!color) return null;
    return {
      type: "solid",
      color
    };
  }

  function getCanvasBackground() {
    return state.canvasBackground ? { ...state.canvasBackground } : null;
  }

  function setCanvasBackground(background, options = {}) {
    const next = normalizeCanvasBackground(background);
    const prev = state.canvasBackground;
    const unchanged = (!prev && !next)
      || (prev && next && prev.type === next.type && prev.color === next.color);
    if (unchanged) return false;
    state.canvasBackground = next;
    if (!options.silent) {
      render();
      onChange?.();
    }
    return true;
  }

  function paintCanvasBackground(targetCtx) {
    if (state.canvasBackground?.type !== "solid") return;
    targetCtx.save();
    targetCtx.fillStyle = state.canvasBackground.color;
    targetCtx.fillRect(0, 0, canvas.width, canvas.height);
    targetCtx.restore();
  }

  function clearSolo(restore = true) {
    if (!soloLayerId) return;
    if (restore && Array.isArray(soloPrevVisibility)) {
      const prevMap = new Map(soloPrevVisibility.map(entry => [entry.id, entry.visible]));
      state.layers.forEach(layer => {
        if (prevMap.has(layer.id)) {
          layer.visible = !!prevMap.get(layer.id);
        }
      });
    }
    soloLayerId = null;
    soloPrevVisibility = null;
  }

  function toggleSolo(layerId) {
    if (!layerId) return;
    if (soloLayerId === layerId) {
      clearSolo(true);
      return;
    }
    if (soloLayerId) clearSolo(true);
    soloPrevVisibility = state.layers.map(layer => ({ id: layer.id, visible: !!layer.visible }));
    soloLayerId = layerId;
    state.layers.forEach(layer => {
      layer.visible = layer.id === layerId;
    });
  }

  function warmModel() {
    if (!modelWarmPromise) {
      modelWarmPromise = preload({ debug: true }).then(() => {
        markModelReady();
      });
    }
    return modelWarmPromise;
  }

  function ensureBackgroundEditor() {
    if (bgEditor) return bgEditor;

    const overlay = document.createElement("div");
    overlay.className = "layer-bg-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="layer-bg-modal" role="dialog" aria-modal="true" aria-label="Layer brush editor">
        <div class="layer-bg-head">
          <div class="menu-title-bar layer-bg-title-bar">
            <div class="sidebar-section-title menu-title">Cutting board</div>
          </div>
          <div class="layer-bg-controls-row">
            <div class="pill-toggle layer-bg-brush-toggle" role="tablist" aria-label="Brush type">
              <button type="button" data-bg-brush-mode="erase" class="active" title="Erase" aria-label="Erase"><img src="./svg/eraser_line.svg" alt=""><span class="mode-label">Erase</span></button>
              <button type="button" data-bg-brush-mode="restore" title="Restore" aria-label="Restore"><img src="./svg/paint_brush_line.svg" alt=""><span class="mode-label">Restore</span></button>
            </div>
            <label class="layer-bg-brush-size">
              <span>Size</span>
              <input type="range" min="4" max="140" value="50" data-bg-brush-size>
              <span data-bg-brush-size-value>50</span>
            </label>
            <div class="pill-toggle layer-bg-edit-toggle" role="tablist" aria-label="Edit mode">
              <button type="button" data-bg-edit-mode="brush" class="active" title="Brush" aria-label="Brush"><img src="./svg/paint_brush_line.svg" alt=""><span class="mode-label">Brush</span></button>
              <button type="button" data-bg-edit-mode="move" title="Move" aria-label="Move"><img src="./svg/hand_line.svg" alt=""><span class="mode-label">Move</span></button>
            </div>
          </div>
        </div>
        <div class="layer-bg-canvas-wrap" data-bg-canvas-wrap>
          <canvas data-bg-canvas></canvas>
          <div class="layer-bg-brush-preview" data-bg-brush-preview></div>
        </div>
        <div class="layer-bg-foot">
          <div class="layer-bg-meta layer-bg-view-left">
            <div class="layer-bg-view">
              <button type="button" class="cutout-bg-btn active" data-editor-bg="checker" title="Checker background"></button>
              <button type="button" class="cutout-bg-btn" data-editor-bg="white" title="White background"></button>
              <button type="button" class="cutout-bg-btn" data-editor-bg="black" title="Black background"></button>
            </div>
          </div>
          <div class="layer-bg-actions layer-bg-actions-center">
            <button type="button" class="secondary-btn" data-bg-cutout title="Cutout" aria-label="Cutout"><img src="./svg/eraser_ai_line.svg" alt=""><span class="btn-label">Cutout</span></button>
            <button type="button" class="secondary-btn" data-bg-chroma title="Color" aria-label="Color"><img src="./svg/color_picker_line.svg" alt=""><span class="btn-label">Color</span></button>
            <button type="button" class="secondary-btn" data-bg-reset title="Reset image" aria-label="Reset image"><img src="./svg/history_anticlockwise_line.svg" alt=""><span class="btn-label">Reset image</span></button>
          </div>
          <div class="layer-bg-actions layer-bg-actions-right">
            <button type="button" class="secondary-btn" data-bg-cancel>Cancel</button>
            <button type="button" class="secondary-btn" data-bg-apply>Apply</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const canvasWrapEl = overlay.querySelector("[data-bg-canvas-wrap]");
    const canvasEl = overlay.querySelector("[data-bg-canvas]");
    const brushPreviewEl = overlay.querySelector("[data-bg-brush-preview]");
    const brushSizeEl = overlay.querySelector("[data-bg-brush-size]");
    const brushSizeValueEl = overlay.querySelector("[data-bg-brush-size-value]");
    const editModeButtons = Array.from(overlay.querySelectorAll("[data-bg-edit-mode]"));
    const brushModeButtons = Array.from(overlay.querySelectorAll("[data-bg-brush-mode]"));
    const editorBgButtons = Array.from(overlay.querySelectorAll("[data-editor-bg]"));
    const btnCutout = overlay.querySelector("[data-bg-cutout]");
    const btnChroma = overlay.querySelector("[data-bg-chroma]");
    const btnReset = overlay.querySelector("[data-bg-reset]");
    const btnCancel = overlay.querySelector("[data-bg-cancel]");
    const btnApply = overlay.querySelector("[data-bg-apply]");
    [btnCutout, btnChroma, btnReset].forEach(btn => {
      if (!btn) return;
      btn.dataset.labelHtml = btn.innerHTML;
    });

    const sourceCanvas = document.createElement("canvas");
    const sourceCtx = sourceCanvas.getContext("2d");
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");
    const compCanvas = document.createElement("canvas");
    const compCtx = compCanvas.getContext("2d");
    const drawCtx = canvasEl.getContext("2d");

    bgEditor = {
      overlay,
      canvasWrapEl,
      canvasEl,
      brushSizeEl,
      brushSizeValueEl,
      brushPreviewEl,
      editModeButtons,
      brushModeButtons,
      editorBgButtons,
      btnCutout,
      btnChroma,
      btnReset,
      btnCancel,
      btnApply,
      sourceCanvas,
      sourceCtx,
      maskCanvas,
      maskCtx,
      compCanvas,
      compCtx,
      drawCtx,
      layerId: null,
      originalImage: null,
      zoom: 100,
      editMode: "brush",
      brushMode: "erase",
      brushSize: Number(brushSizeEl.value || 50),
      colorPickMode: false,
      colorPickBusy: false,
      painting: false,
      panning: false,
      pointerId: null,
      lastPoint: null,
      baseScale: 1,
      panX: 0,
      panY: 0,
      panStartX: 0,
      panStartY: 0,
      startPanX: 0,
      startPanY: 0,
      applyZoom: null,
      handleColorPick: null,
      outsidePickHandler: null,
      viewportSyncHandler: null,
      viewportResizeObserver: null,
      updateModeButtons: null
    };

    function isMoveActive() {
      return bgEditor.editMode === "move";
    }

    function updateModeButtons() {
      if (bgEditor.colorPickMode || bgEditor.colorPickBusy) {
        canvasWrapEl.classList.add("is-color-pick");
        canvasWrapEl.style.cursor = "crosshair";
        canvasEl.style.cursor = "crosshair";
        if (brushPreviewEl) brushPreviewEl.style.display = "none";
        return;
      }
      canvasWrapEl.classList.remove("is-color-pick");
      const moveActive = isMoveActive();
      const isBrush = !moveActive;
      editModeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.bgEditMode === bgEditor.editMode));
      brushModeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.bgBrushMode === bgEditor.brushMode));
      const nextCursor = isBrush ? "none" : (bgEditor.panning ? "grabbing" : "grab");
      canvasWrapEl.style.cursor = nextCursor;
      canvasEl.style.cursor = nextCursor;
      if (!isBrush && brushPreviewEl) {
        brushPreviewEl.style.display = "none";
      }
    }

    function getScale() {
      return Math.max(0.0001, bgEditor.baseScale * (bgEditor.zoom / 100));
    }

    function applyTransform() {
      const scale = getScale();
      canvasEl.style.transformOrigin = "top left";
      canvasEl.style.transform = `translate(${bgEditor.panX}px, ${bgEditor.panY}px) scale(${scale})`;
    }

    function fitToViewport({ preserveView = false } = {}) {
      const rect = canvasWrapEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const prevScale = getScale();
      let focusX = canvasEl.width / 2;
      let focusY = canvasEl.height / 2;
      if (preserveView && prevScale > 0.0001) {
        focusX = (rect.width * 0.5 - bgEditor.panX) / prevScale;
        focusY = (rect.height * 0.5 - bgEditor.panY) / prevScale;
      }
      const pad = 18;
      const fitX = (rect.width - pad * 2) / Math.max(1, canvasEl.width);
      const fitY = (rect.height - pad * 2) / Math.max(1, canvasEl.height);
      bgEditor.baseScale = clamp(Math.min(fitX, fitY, 1), 0.05, 1);
      const scale = getScale();
      if (preserveView) {
        bgEditor.panX = rect.width * 0.5 - focusX * scale;
        bgEditor.panY = rect.height * 0.5 - focusY * scale;
      } else {
        bgEditor.panX = (rect.width - canvasEl.width * scale) / 2;
        bgEditor.panY = (rect.height - canvasEl.height * scale) / 2;
      }
      applyTransform();
    }

    function applyZoom(nextZoom, clientX = null, clientY = null) {
      const prevScale = getScale();
      const rect = canvasWrapEl.getBoundingClientRect();
      const anchorX = clientX == null ? rect.width / 2 : (clientX - rect.left);
      const anchorY = clientY == null ? rect.height / 2 : (clientY - rect.top);
      const imageX = (anchorX - bgEditor.panX) / prevScale;
      const imageY = (anchorY - bgEditor.panY) / prevScale;
      bgEditor.zoom = clamp(nextZoom, 25, 400);
      const nextScale = getScale();
      bgEditor.panX = anchorX - imageX * nextScale;
      bgEditor.panY = anchorY - imageY * nextScale;
      applyTransform();
    }

    function renderEditor() {
      const w = canvasEl.width;
      const h = canvasEl.height;
      compCtx.clearRect(0, 0, w, h);
      compCtx.globalCompositeOperation = "source-over";
      compCtx.drawImage(sourceCanvas, 0, 0, w, h);
      compCtx.globalCompositeOperation = "destination-in";
      compCtx.drawImage(maskCanvas, 0, 0, w, h);
      compCtx.globalCompositeOperation = "source-over";

      drawCtx.clearRect(0, 0, w, h);
      drawCtx.drawImage(compCanvas, 0, 0, w, h);
    }

    function toCanvasPoint(evt) {
      const rect = canvasWrapEl.getBoundingClientRect();
      const scale = getScale();
      const localX = evt.clientX - rect.left;
      const localY = evt.clientY - rect.top;
      return {
        x: clamp((localX - bgEditor.panX) / scale, 0, canvasEl.width),
        y: clamp((localY - bgEditor.panY) / scale, 0, canvasEl.height)
      };
    }

    function updateBrushPreview(evt) {
      if (!brushPreviewEl || isMoveActive()) return;
      const wrapRect = canvasWrapEl.getBoundingClientRect();
      const radius = Math.max(1, Number(bgEditor.brushSize) || 1);
      const size = radius * 2 * getScale();
      brushPreviewEl.style.width = `${size}px`;
      brushPreviewEl.style.height = `${size}px`;
      brushPreviewEl.style.left = `${evt.clientX - wrapRect.left}px`;
      brushPreviewEl.style.top = `${evt.clientY - wrapRect.top}px`;
      brushPreviewEl.classList.toggle("restore", bgEditor.brushMode === "restore");
      brushPreviewEl.style.display = "block";
    }

    function drawStroke(from, to) {
      const radius = Math.max(1, Number(bgEditor.brushSize) || 1);
      const mode = bgEditor.brushMode === "erase" ? "destination-out" : "source-over";
      maskCtx.save();
      maskCtx.globalCompositeOperation = mode;
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";
      maskCtx.lineWidth = radius * 2;
      maskCtx.strokeStyle = "#fff";
      maskCtx.beginPath();
      maskCtx.moveTo(from.x, from.y);
      maskCtx.lineTo(to.x, to.y);
      maskCtx.stroke();
      maskCtx.restore();
    }

    canvasWrapEl.addEventListener("pointerdown", (evt) => {
      if (bgEditor.colorPickMode) {
        bgEditor.painting = false;
        bgEditor.panning = false;
        bgEditor.pointerId = null;
        bgEditor.lastPoint = null;
        if (brushPreviewEl) brushPreviewEl.style.display = "none";
        const p = toCanvasPoint(evt);
        bgEditor.handleColorPick?.(p);
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      if (bgEditor.colorPickBusy) {
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      if (isMoveActive()) {
        bgEditor.panning = true;
        bgEditor.pointerId = evt.pointerId;
        bgEditor.panStartX = evt.clientX;
        bgEditor.panStartY = evt.clientY;
        bgEditor.startPanX = bgEditor.panX;
        bgEditor.startPanY = bgEditor.panY;
        updateModeButtons();
        evt.preventDefault();
        return;
      }

      bgEditor.painting = true;
      bgEditor.pointerId = evt.pointerId;
      const p = toCanvasPoint(evt);
      bgEditor.lastPoint = p;
      drawStroke(p, p);
      renderEditor();
      updateBrushPreview(evt);
      evt.preventDefault();
    }, { passive: false });

    canvasWrapEl.addEventListener("pointermove", (evt) => {
      if (bgEditor.colorPickMode) {
        if (brushPreviewEl) brushPreviewEl.style.display = "none";
        return;
      }
      if (bgEditor.pointerId != null && evt.pointerId !== bgEditor.pointerId) return;
      if (isMoveActive()) {
        if (!bgEditor.panning) return;
        const dx = evt.clientX - bgEditor.panStartX;
        const dy = evt.clientY - bgEditor.panStartY;
        bgEditor.panX = bgEditor.startPanX + dx;
        bgEditor.panY = bgEditor.startPanY + dy;
        applyTransform();
        evt.preventDefault();
        return;
      }
      updateBrushPreview(evt);
      if (!bgEditor.painting) return;
      const events = evt.getCoalescedEvents ? evt.getCoalescedEvents() : [evt];
      for (const sample of events) {
        const p = toCanvasPoint(sample);
        drawStroke(bgEditor.lastPoint || p, p);
        bgEditor.lastPoint = p;
      }
      renderEditor();
      evt.preventDefault();
    }, { passive: false });

    function endPointer(evt) {
      if (bgEditor.pointerId != null && evt && evt.pointerId != null && evt.pointerId !== bgEditor.pointerId) return;
      if (bgEditor.panning) {
        bgEditor.panning = false;
        updateModeButtons();
      }
      bgEditor.pointerId = null;
      bgEditor.painting = false;
      bgEditor.lastPoint = null;
      if (brushPreviewEl) brushPreviewEl.style.display = "none";
    }

    canvasWrapEl.addEventListener("pointerup", endPointer, { passive: false });
    canvasWrapEl.addEventListener("pointercancel", endPointer, { passive: false });
    canvasWrapEl.addEventListener("pointerleave", endPointer, { passive: false });
    window.addEventListener("pointerup", endPointer, { passive: true });
    window.addEventListener("pointercancel", endPointer, { passive: true });

    canvasWrapEl.addEventListener("pointermove", (evt) => {
      if (bgEditor.colorPickMode) return;
      if (isMoveActive()) return;
      updateBrushPreview(evt);
    }, { passive: true });
    canvasWrapEl.addEventListener("pointerenter", (evt) => {
      if (bgEditor.colorPickMode) return;
      if (isMoveActive()) return;
      updateBrushPreview(evt);
    }, { passive: true });
    canvasWrapEl.addEventListener("pointerleave", () => {
      if (brushPreviewEl) brushPreviewEl.style.display = "none";
    }, { passive: true });

    canvasWrapEl.addEventListener("wheel", (evt) => {
      if (!isMoveActive()) return;
      evt.preventDefault();
      const factor = evt.deltaY < 0 ? 1.12 : 1 / 1.12;
      applyZoom(bgEditor.zoom * factor, evt.clientX, evt.clientY);
    }, { passive: false });

    editModeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const nextMode = btn.dataset.bgEditMode === "move" ? "move" : "brush";
        if (bgEditor.editMode === nextMode) return;
        bgEditor.editMode = nextMode;
        bgEditor.panning = false;
        bgEditor.painting = false;
        bgEditor.pointerId = null;
        bgEditor.lastPoint = null;
        if (brushPreviewEl) brushPreviewEl.style.display = "none";
        updateModeButtons();
      });
    });

    brushModeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        bgEditor.brushMode = btn.dataset.bgBrushMode === "restore" ? "restore" : "erase";
        updateModeButtons();
        if (brushPreviewEl) brushPreviewEl.classList.toggle("restore", bgEditor.brushMode === "restore");
      });
    });

    editorBgButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.editorBg;
        if (!mode) return;
        canvasWrapEl.dataset.bgMode = mode;
        editorBgButtons.forEach(entry => entry.classList.toggle("active", entry === btn));
      });
    });

    brushSizeEl.addEventListener("input", () => {
      bgEditor.brushSize = Number(brushSizeEl.value || 50);
      if (brushSizeValueEl) brushSizeValueEl.textContent = String(Math.round(bgEditor.brushSize));
    });

    window.addEventListener("blur", () => {
      if (!bgEditor.panning && !bgEditor.painting) return;
      bgEditor.panning = false;
      bgEditor.pointerId = null;
      bgEditor.painting = false;
      bgEditor.lastPoint = null;
      if (brushPreviewEl) brushPreviewEl.style.display = "none";
      updateModeButtons();
    });

    bgEditor.applyZoom = applyZoom;
    bgEditor.fitToViewport = fitToViewport;
    bgEditor.updateModeButtons = updateModeButtons;

    const syncViewport = () => {
      if (!bgEditor || bgEditor.overlay.hidden) return;
      if (bgEditor.painting || bgEditor.panning) return;
      fitToViewport({ preserveView: true });
    };
    bgEditor.viewportSyncHandler = syncViewport;
    window.addEventListener("resize", syncViewport, { passive: true });
    if (window.visualViewport?.addEventListener) {
      window.visualViewport.addEventListener("resize", syncViewport, { passive: true });
    }
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => syncViewport());
      observer.observe(canvasWrapEl);
      bgEditor.viewportResizeObserver = observer;
    }

    return bgEditor;
  }

  async function openLayerBrushEditor(layer) {
    const editor = ensureBackgroundEditor();
    const image = layer?.image;
    const renderedSource = layer ? getLayerRenderSource(layer) : null;
    if (!image || !renderedSource) return;

    editor.layerId = layer.id;
    editor.originalImage = layer.originalImage || image;
    editor.overlay.hidden = false;
    editor.editMode = "brush";
    editor.brushMode = "erase";
    editor.brushSize = Number(editor.brushSizeEl.value || 50);
    editor.zoom = 100;
    editor.sourceCanvas.width = renderedSource.width;
    editor.sourceCanvas.height = renderedSource.height;
    editor.maskCanvas.width = renderedSource.width;
    editor.maskCanvas.height = renderedSource.height;
    editor.compCanvas.width = renderedSource.width;
    editor.compCanvas.height = renderedSource.height;
    editor.canvasEl.width = renderedSource.width;
    editor.canvasEl.height = renderedSource.height;

    editor.sourceCtx.clearRect(0, 0, renderedSource.width, renderedSource.height);
    editor.sourceCtx.drawImage(renderedSource, 0, 0);
    editor.maskCtx.clearRect(0, 0, renderedSource.width, renderedSource.height);
    editor.maskCtx.fillStyle = "#fff";
    editor.maskCtx.fillRect(0, 0, renderedSource.width, renderedSource.height);

    editor.fitToViewport();
    editor.canvasWrapEl.dataset.bgMode = "checker";
    editor.canvasWrapEl.classList.remove("is-color-pick");
    editor.editorBgButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.editorBg === "checker"));
    editor.brushSizeValueEl.textContent = String(Math.round(editor.brushSize));
    editor.brushModeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.bgBrushMode === "erase"));
    editor.colorPickMode = false;
    editor.colorPickBusy = false;
    editor.btnChroma.classList.remove("is-active");
    editor.canvasWrapEl.style.cursor = "none";
    editor.canvasEl.style.cursor = "none";
    if (editor.brushPreviewEl) {
      editor.brushPreviewEl.style.display = "none";
      editor.brushPreviewEl.classList.remove("restore");
    }

    const applyHandler = async () => {
      const target = layerById(editor.layerId);
      if (!target) {
        editor.overlay.hidden = true;
        return;
      }
      const composed = document.createElement("canvas");
      composed.width = editor.sourceCanvas.width;
      composed.height = editor.sourceCanvas.height;
      const cctx = composed.getContext("2d");
      cctx.drawImage(editor.sourceCanvas, 0, 0);
      cctx.globalCompositeOperation = "destination-in";
      cctx.drawImage(editor.maskCanvas, 0, 0);
      cctx.globalCompositeOperation = "source-over";

      const blob = await canvasToBlob(composed, "image/png");
      const nextImage = await loadImageFromBlob(blob);
      target.image = nextImage;
      // The brush editor starts from rendered/tuned pixels, so clear WB tuning to avoid double-applying it.
      target.wbTemp = 0;
      target.wbTint = 0;
      target.wbBright = 0;
      target.wbSat = 0;
      target.wbContrast = 0;
      target.wbBlur = 0;
      target.retroStyle = "none";
      target.retroIntensity = RETRO_DEFAULT_INTENSITY;
      target.retroGrain = RETRO_DEFAULT_GRAIN;
      target.thumbDataUrl = makeThumbDataUrl(nextImage);
      target.processedCanvas = null;
      rebuildLayerProcessed(target);
      refreshWarnings(target);
      editor.overlay.hidden = true;
      refreshList();
      render();
      onStatus?.("Layer brush edit applied.");
    };

    function renderFromSource() {
      const w = editor.canvasEl.width;
      const h = editor.canvasEl.height;
      editor.compCtx.clearRect(0, 0, w, h);
      editor.compCtx.globalCompositeOperation = "source-over";
      editor.compCtx.drawImage(editor.sourceCanvas, 0, 0, w, h);
      editor.compCtx.globalCompositeOperation = "destination-in";
      editor.compCtx.drawImage(editor.maskCanvas, 0, 0, w, h);
      editor.compCtx.globalCompositeOperation = "source-over";
      editor.drawCtx.clearRect(0, 0, w, h);
      editor.drawCtx.drawImage(editor.compCanvas, 0, 0, w, h);
    }

    function buildComposedSourceCanvas() {
      const composed = document.createElement("canvas");
      composed.width = editor.sourceCanvas.width;
      composed.height = editor.sourceCanvas.height;
      const cctx = composed.getContext("2d");
      cctx.drawImage(editor.sourceCanvas, 0, 0);
      cctx.globalCompositeOperation = "destination-in";
      cctx.drawImage(editor.maskCanvas, 0, 0);
      cctx.globalCompositeOperation = "source-over";
      return composed;
    }

    function intersectMask(nextMaskCanvas) {
      editor.maskCtx.save();
      editor.maskCtx.globalCompositeOperation = "destination-in";
      editor.maskCtx.drawImage(nextMaskCanvas, 0, 0);
      editor.maskCtx.restore();
    }

    function setBusyButton(button, label, busy) {
      if (!button) return;
      if (busy) {
        button.classList.add("is-loading");
        button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span class="btn-label">${label}</span>`;
      } else {
        button.classList.remove("is-loading");
        button.innerHTML = button.dataset.labelHtml || label;
      }
    }

    function setEditorBusy(flag) {
      const disabled = !!flag;
      editor.btnCutout.disabled = disabled;
      editor.btnChroma.disabled = disabled;
      editor.btnReset.disabled = disabled;
      editor.btnCancel.disabled = disabled;
      editor.btnApply.disabled = disabled;
      editor.brushSizeEl.disabled = disabled;
      editor.editModeButtons.forEach(btn => { btn.disabled = disabled; });
      editor.brushModeButtons.forEach(btn => { btn.disabled = disabled; });
      editor.canvasWrapEl.style.pointerEvents = disabled ? "none" : "auto";
      editor.canvasWrapEl.style.opacity = disabled ? "0.85" : "1";
      setBusyButton(editor.btnCutout, "Cutout", false);
      setBusyButton(editor.btnChroma, "Color", false);
    }

    function setColorBusy(flag) {
      const disabled = !!flag;
      editor.btnChroma.disabled = disabled;
      setBusyButton(editor.btnChroma, disabled ? "Working..." : "Color", disabled);
    }

    const closeHandler = () => {
      if (editor.brushPreviewEl) editor.brushPreviewEl.style.display = "none";
      editor.colorPickMode = false;
      editor.colorPickBusy = false;
      editor.btnChroma.classList.remove("is-active");
      editor.canvasWrapEl.classList.remove("is-color-pick");
      editor.panning = false;
      editor.pointerId = null;
      editor.canvasWrapEl.style.cursor = "default";
      editor.canvasEl.style.cursor = "default";
      editor.overlay.hidden = true;
    };

    if (editor.outsidePickHandler) {
      window.removeEventListener("pointerdown", editor.outsidePickHandler, true);
    }
    editor.outsidePickHandler = (evt) => {
      if (!editor.colorPickMode) return;
      const target = evt.target;
      if (editor.canvasWrapEl.contains(target) || editor.btnChroma.contains(target)) return;
      editor.colorPickMode = false;
      editor.colorPickBusy = false;
      editor.btnChroma.classList.remove("is-active");
      editor.canvasWrapEl.classList.remove("is-color-pick");
      editor.updateModeButtons();
      onStatus?.("Color picker cancelled.");
    };
    window.addEventListener("pointerdown", editor.outsidePickHandler, true);

    editor.btnApply.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      applyHandler().catch((error) => {
        console.error(error);
        onStatus?.("Could not apply layer brush edit.");
      });
    };
    editor.btnCutout.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        setEditorBusy(true);
        setBusyButton(editor.btnCutout, "Working...", true);
        onStatus?.("Preparing quick cutout...");
        const composedSource = buildComposedSourceCanvas();
        const sourceBlob = await canvasToBlob(composedSource, "image/png");
        const sourceImage = await loadImageFromBlob(sourceBlob);
        const sourceCanvas = makeCanvasFromImage(sourceImage);
        const nextImage = await buildAiCutoutImageFromCanvas(sourceCanvas);
        const aiMask = alphaToMaskCanvas(nextImage);
        intersectMask(aiMask);
        renderFromSource();
        onStatus?.("Quick cutout done.");
      } catch (error) {
        console.error(error);
        onStatus?.("Quick cutout failed.");
      } finally {
        setEditorBusy(false);
      }
    };
    editor.handleColorPick = async (point) => {
      try {
        editor.colorPickBusy = true;
        editor.colorPickMode = false;
        editor.btnChroma.classList.remove("is-active");
        editor.updateModeButtons();
        setColorBusy(true);
        onStatus?.("Applying picked color...");
        const sx = clamp(Math.round(point.x), 0, Math.max(0, editor.sourceCanvas.width - 1));
        const sy = clamp(Math.round(point.y), 0, Math.max(0, editor.sourceCanvas.height - 1));
        const pixel = editor.sourceCtx.getImageData(sx, sy, 1, 1).data;
        const composedSource = buildComposedSourceCanvas();
        const sourceBlob = await canvasToBlob(composedSource, "image/png");
        const sourceImage = await loadImageFromBlob(sourceBlob);
        const sourceCanvas = makeCanvasFromImage(sourceImage);
        const nextMask = buildSampledColorKeyCanvas(sourceCanvas, {
          r: pixel[0],
          g: pixel[1],
          b: pixel[2]
        });
        intersectMask(nextMask);
        renderFromSource();
        onStatus?.("Color removal applied.");
      } catch (error) {
        console.error(error);
        onStatus?.("Color removal failed.");
      } finally {
        setColorBusy(false);
        editor.colorPickBusy = false;
        editor.updateModeButtons();
      }
    };
    editor.btnChroma.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      editor.colorPickMode = !editor.colorPickMode;
      editor.painting = false;
      editor.panning = false;
      editor.pointerId = null;
      editor.lastPoint = null;
      editor.btnChroma.classList.toggle("is-active", editor.colorPickMode);
      if (editor.colorPickMode) {
        onStatus?.("Pick a color on canvas. Click outside to cancel.");
      } else {
        onStatus?.("Color picker cancelled.");
      }
      editor.updateModeButtons();
    };
    editor.btnReset.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const target = layerById(editor.layerId);
      const resetImage = target?.originalImage || editor.originalImage || image;
      if (!resetImage) return;
      editor.sourceCanvas.width = resetImage.width;
      editor.sourceCanvas.height = resetImage.height;
      editor.maskCanvas.width = resetImage.width;
      editor.maskCanvas.height = resetImage.height;
      editor.compCanvas.width = resetImage.width;
      editor.compCanvas.height = resetImage.height;
      editor.canvasEl.width = resetImage.width;
      editor.canvasEl.height = resetImage.height;
      editor.sourceCtx.clearRect(0, 0, resetImage.width, resetImage.height);
      editor.sourceCtx.drawImage(resetImage, 0, 0);
      editor.maskCtx.clearRect(0, 0, resetImage.width, resetImage.height);
      editor.maskCtx.fillStyle = "#fff";
      editor.maskCtx.fillRect(0, 0, resetImage.width, resetImage.height);
      editor.zoom = 100;
      editor.editMode = "brush";
      editor.fitToViewport();
      editor.brushMode = "erase";
      editor.brushModeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.bgBrushMode === "erase"));
      if (editor.brushPreviewEl) {
        editor.brushPreviewEl.style.display = "none";
        editor.brushPreviewEl.classList.remove("restore");
      }
      editor.updateModeButtons();
      renderFromSource();
      onStatus?.("Layer brush editor reset to original.");
    };
    editor.btnCancel.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeHandler();
    };
    editor.btnReset.onpointerdown = event => event.stopPropagation();
    editor.btnCutout.onpointerdown = event => event.stopPropagation();
    editor.btnChroma.onpointerdown = event => event.stopPropagation();
    editor.btnApply.onpointerdown = event => event.stopPropagation();
    editor.btnCancel.onpointerdown = event => event.stopPropagation();
    editor.overlay.onclick = null;

    // initial render
    const w = editor.canvasEl.width;
    const h = editor.canvasEl.height;
    editor.compCtx.clearRect(0, 0, w, h);
    editor.compCtx.globalCompositeOperation = "source-over";
    editor.compCtx.drawImage(editor.sourceCanvas, 0, 0, w, h);
    editor.compCtx.globalCompositeOperation = "destination-in";
    editor.compCtx.drawImage(editor.maskCanvas, 0, 0, w, h);
    editor.compCtx.globalCompositeOperation = "source-over";
    editor.drawCtx.clearRect(0, 0, w, h);
    editor.drawCtx.drawImage(editor.compCanvas, 0, 0, w, h);
    editor.updateModeButtons();
  }

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load cutout image."));
      };
      image.src = url;
    });
  }

  function setChipActive(buttons, predicate) {
    buttons.forEach(button => button.classList.toggle("active", predicate(button)));
  }

  function getDefinitionScale() {
    return CANVAS_DEFINITION_SCALES[state.canvasDefinition] || CANVAS_DEFINITION_SCALES.hd;
  }

  function getDims(ratio) {
    const base = DOC_PRESETS[ratio] || DOC_PRESETS.landscape43;
    const scale = getDefinitionScale();
    return {
      w: Math.max(2, Math.round(base.w * scale)),
      h: Math.max(2, Math.round(base.h * scale))
    };
  }

  function activeLayer() {
    return state.layers.find(layer => layer.id === state.activeLayerId) || null;
  }

  function hasLayers() {
    return state.layers.length > 0;
  }

  function canAddLayer() {
    return state.layers.length < MAX_LAYERS;
  }

  function getMaxLayers() {
    return MAX_LAYERS;
  }

  function getLayerCount() {
    return state.layers.length;
  }

  function getVisibleLayerCount() {
    return state.layers.reduce((count, layer) => count + (layer.visible ? 1 : 0), 0);
  }

  function duplicateLayer(layerId) {
    const source = layerById(layerId);
    if (!source) return false;
    if (!canAddLayer()) {
      onStatus?.(`Layer limit reached (${MAX_LAYERS}). Delete one to add another.`);
      return false;
    }

    const sourceIndex = state.layers.findIndex(entry => entry.id === layerId);
    if (sourceIndex < 0) return false;

    layerSeed += 1;
    const copy = {
      ...source,
      id: `layer-${layerSeed}`,
      name: truncateName(`${source.name} copy`),
      tuningOpen: false,
      processing: false,
      visible: soloLayerId ? false : source.visible
    };

    state.layers.splice(sourceIndex + 1, 0, copy);
    state.activeLayerId = copy.id;
    refreshWarnings(copy);
    refreshList();
    render();
    onStatus?.(`Layer duplicated: ${copy.name}`);
    return true;
  }

  function getRatio() {
    return state.ratio;
  }

  function getCanvasSize() {
    return {
      width: canvas.width,
      height: canvas.height
    };
  }

  function updateOverlay() {
    if (!overlayEl) return;
    overlayEl.style.display = hasLayers() ? "none" : "grid";
  }

  function refreshWarnings(layer) {
    layer.lowResolution = layer.scale > 1.02;
  }

  function rebuildLayerProcessed(layer) {
    const needsProcessing = hasLayerProcessingAdjust(layer);
    if (!needsProcessing) {
      layer.processedCanvas = null;
      return;
    }
    const source = layer.image;
    const work = document.createElement("canvas");
    work.width = source.width;
    work.height = source.height;
    const wctx = work.getContext("2d");
    wctx.drawImage(source, 0, 0);
    const imgData = wctx.getImageData(0, 0, work.width, work.height);
    const data = imgData.data;

    const retroStyle = layer.retroStyle || "none";
    const applyRetro = retroStyle !== "none";
    const styleIntensity = clamp(Number(layer.retroIntensity || RETRO_DEFAULT_INTENSITY), 0, 100) / 100;
    const grainAmount = applyRetro
      ? clamp(Number(layer.retroGrain || RETRO_DEFAULT_GRAIN), 0, 100) / 100
      : 0;

    const temp = clamp(layer.wbTemp || 0, -WB_LIMIT, WB_LIMIT) / 100;
    const tint = clamp(layer.wbTint || 0, -TINT_LIMIT, TINT_LIMIT) / 100;
    const bright = clamp(layer.wbBright || 0, -BRIGHT_LIMIT, BRIGHT_LIMIT) / 100;
    const sat = clamp(layer.wbSat || 0, -SAT_LIMIT, SAT_LIMIT) / 100;
    const contrast = clamp(layer.wbContrast || 0, -CONTRAST_LIMIT, CONTRAST_LIMIT) / 100;
    const blur = clamp(layer.wbBlur || 0, 0, BLUR_LIMIT);
    const tempShift = temp * 42;
    const brightShift = bright * 255;
    const satFactor = 1 + sat;
    const contrastFactor = 1 + contrast * 1.5;
    const tintShift = tint * 30;

    for (let i = 0; i < data.length; i += 4) {
      let rr = data[i];
      let gg = data[i + 1];
      let bb = data[i + 2];

      if (applyRetro) {
        if (retroStyle === "bw") {
          let gray = 0.3 * rr + 0.59 * gg + 0.11 * bb;
          const minF = 0.44;
          const maxF = 1.84;
          const factor = minF + styleIntensity * (maxF - minF);
          gray = ((gray - 128) * factor) + 128;
          rr = gg = bb = clamp(gray, 0, 255);
        } else if (retroStyle === "sepia") {
          const sr = 0.393 * rr + 0.769 * gg + 0.189 * bb;
          const sg = 0.349 * rr + 0.686 * gg + 0.168 * bb;
          const sb = 0.272 * rr + 0.534 * gg + 0.131 * bb;

          rr = clamp(mix(rr, sr, 0.4 + 0.6 * styleIntensity), 0, 255);
          gg = clamp(mix(gg, sg, 0.4 + 0.6 * styleIntensity), 0, 255);
          bb = clamp(mix(bb, sb, 0.4 + 0.6 * styleIntensity), 0, 255);

          const fade = 8 + 15 * styleIntensity;
          rr = clamp(rr + fade * 0.9, 0, 255);
          gg = clamp(gg + fade * 0.7, 0, 255);
          bb = clamp(bb + fade * 0.4, 0, 255);
        } else if (retroStyle === "postal") {
          const gray = (rr + gg + bb) / 3;
          const satBlend = 0.45;
          let pr = gray * (1 - satBlend) + rr * satBlend;
          let pg = gray * (1 - satBlend) + gg * satBlend;
          let pb = gray * (1 - satBlend) + bb * satBlend;

          const lift = 18 + 20 * styleIntensity;
          pr = clamp(pr + lift, 0, 255);
          pg = clamp(pg + lift, 0, 255);
          pb = clamp(pb + lift, 0, 255);

          const tone = 12 + 18 * styleIntensity;
          pr = clamp(pr + tone * 0.2, 0, 255);
          pg = clamp(pg + tone * 0.5, 0, 255);
          pb = clamp(pb - tone * 0.1, 0, 255);

          rr = pr;
          gg = pg;
          bb = pb;
        }
      }

      rr = rr + tempShift + tintShift * 0.5;
      gg = gg - tintShift;
      bb = bb - tempShift + tintShift * 0.5;

      if (Math.abs(sat) > 0.0001) {
        const gray = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
        rr = gray + (rr - gray) * satFactor;
        gg = gray + (gg - gray) * satFactor;
        bb = gray + (bb - gray) * satFactor;
      }

      rr += brightShift;
      gg += brightShift;
      bb += brightShift;

      if (Math.abs(contrast) > 0.0001) {
        rr = (rr - 128) * contrastFactor + 128;
        gg = (gg - 128) * contrastFactor + 128;
        bb = (bb - 128) * contrastFactor + 128;
      }

      if (grainAmount > 0) {
        const amp = 35 * grainAmount;
        const n = (Math.random() - 0.5) * 2 * amp;
        rr += n;
        gg += n;
        bb += n;
      }

      data[i] = clamp(Math.round(rr), 0, 255);
      data[i + 1] = clamp(Math.round(gg), 0, 255);
      data[i + 2] = clamp(Math.round(bb), 0, 255);
    }

    wctx.putImageData(imgData, 0, 0);
    if (blur > 0.001) {
      const blurred = document.createElement("canvas");
      blurred.width = work.width;
      blurred.height = work.height;
      const bctx = blurred.getContext("2d");
      bctx.filter = `blur(${blur}px)`;
      bctx.drawImage(work, 0, 0);
      bctx.filter = "none";
      layer.processedCanvas = blurred;
    } else {
      layer.processedCanvas = work;
    }
  }

  function makeCanvasFromImage(image) {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = image.width;
    canvasEl.height = image.height;
    const canvasCtx = canvasEl.getContext("2d");
    canvasCtx.drawImage(image, 0, 0);
    return canvasEl;
  }

  async function buildAiCutoutImageFromCanvas(sourceCanvas) {
    await warmModel();
    const srcBlob = await canvasToBlob(sourceCanvas, "image/png");
    const outBlob = await removeBackground(srcBlob, { debug: true });
    const nextImage = await loadImageFromBlob(outBlob);
    markModelReady();
    return nextImage;
  }

  function rgbToHsv(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    if (delta > 0.000001) {
      if (max === rn) {
        h = ((gn - bn) / delta) % 6;
      } else if (max === gn) {
        h = (bn - rn) / delta + 2;
      } else {
        h = (rn - gn) / delta + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max <= 0 ? 0 : delta / max;
    const v = max;
    return { h, s, v };
  }

  function buildSampledColorKeyCanvas(sourceCanvas, sample) {
    const work = document.createElement("canvas");
    work.width = sourceCanvas.width;
    work.height = sourceCanvas.height;
    const wctx = work.getContext("2d");
    wctx.drawImage(sourceCanvas, 0, 0);
    const imageData = wctx.getImageData(0, 0, work.width, work.height);
    const data = imageData.data;
    const sampleHsv = rgbToHsv(sample.r, sample.g, sample.b);
    const sampleSatLow = sampleHsv.s < 0.12;
    const satFloor = sampleSatLow ? 0 : Math.max(0.12, sampleHsv.s * 0.5);
    const valueFloor = sampleSatLow ? 0 : Math.max(0.28, sampleHsv.v - 0.22);
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = sourceCanvas.width;
    maskCanvas.height = sourceCanvas.height;
    const mctx = maskCanvas.getContext("2d");
    const maskImage = mctx.createImageData(maskCanvas.width, maskCanvas.height);
    const maskData = maskImage.data;

    for (let i = 0; i < data.length; i += 4) {
      maskData[i] = 255;
      maskData[i + 1] = 255;
      maskData[i + 2] = 255;
      maskData[i + 3] = 255;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dr = r - sample.r;
      const dg = g - sample.g;
      const db = b - sample.b;
      const rgbDist = Math.sqrt(dr * dr + dg * dg + db * db) / 441.67295593;
      const hsv = rgbToHsv(r, g, b);
      const hueDiff = Math.min(Math.abs(hsv.h - sampleHsv.h), 360 - Math.abs(hsv.h - sampleHsv.h)) / 180;
      const satDiff = Math.abs(hsv.s - sampleHsv.s);
      const valDiff = Math.abs(hsv.v - sampleHsv.v);

      let keyStrength;
      if (sampleSatLow) {
        keyStrength = clamp01((0.2 - rgbDist) / 0.2);
      } else {
        const colorScore = (1 - hueDiff) * 0.58 + (1 - satDiff) * 0.24 + (1 - valDiff) * 0.18;
        const hueGate = hueDiff < 0.18 ? 1 : clamp01((0.28 - hueDiff) / 0.1);
        const scoreBased = clamp01((colorScore - 0.67) / 0.33) * hueGate;
        const rgbBased = clamp01((0.14 - rgbDist) / 0.14);
        keyStrength = Math.max(scoreBased, rgbBased * 0.92);
        if (hsv.s < satFloor) keyStrength *= 0.12;
        if (hsv.v < valueFloor) keyStrength *= 0.3;
        if (hueDiff > 0.2 && hsv.s < sampleHsv.s * 0.75) keyStrength *= 0.1;
      }
      if (keyStrength <= 0.1) continue;
      let alpha = Math.round(255 * (1 - Math.pow(keyStrength, 0.86)));
      if (keyStrength >= 0.5) alpha = Math.min(alpha, 28);
      if (keyStrength >= 0.65) alpha = 0;
      maskData[i + 3] = alpha;
    }

    mctx.putImageData(maskImage, 0, 0);
    return maskCanvas;
  }

  function alphaToMaskCanvas(alphaSource) {
    const mask = document.createElement("canvas");
    mask.width = alphaSource.width;
    mask.height = alphaSource.height;
    const mctx = mask.getContext("2d");
    mctx.drawImage(alphaSource, 0, 0);
    const imageData = mctx.getImageData(0, 0, mask.width, mask.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = a;
    }
    mctx.putImageData(imageData, 0, 0);
    return mask;
  }

  function updateCanvasSize(ratio) {
    const prevW = canvas.width || 1;
    const prevH = canvas.height || 1;
    const { w, h } = getDims(ratio);
    const sx = w / prevW;
    const sy = h / prevH;
    state.layers.forEach(layer => {
      layer.x *= sx;
      layer.y *= sy;
      const geometric = Math.sqrt((sx * sx + sy * sy) / 2);
      layer.scale *= geometric;
      layer.baseScale *= geometric;
      refreshWarnings(layer);
    });
    canvas.width = w;
    canvas.height = h;
    const ratioValue = w / h;
    const designMaxWidth = LAYERS_VIEW_MAX_WIDTH[ratio] || LAYERS_VIEW_MAX_WIDTH.landscape43;
    const canvasAreaEl = canvasWrap?.closest?.(".canvas-area");
    const canvasStackEl = canvasWrap?.closest?.(".canvas-stack");
    const inLayersLayout = !!canvasAreaEl?.classList?.contains("is-layers");
    const stackRect = canvasStackEl?.getBoundingClientRect?.();
    const widthBudget = Math.max(220, Math.floor((stackRect?.width || window.innerWidth) - 2));
    let viewportHeightBudget = Math.max(280, window.innerHeight - 190);
    if (inLayersLayout && canvasAreaEl) {
      const areaRect = canvasAreaEl.getBoundingClientRect();
      if (areaRect.top < window.innerHeight) {
        const areaStyles = window.getComputedStyle(canvasAreaEl);
        const padTop = parseFloat(areaStyles.paddingTop || "0") || 0;
        const padBottom = parseFloat(areaStyles.paddingBottom || "0") || 0;
        const topInset = Math.max(0, areaRect.top + padTop);
        const bottomInset = Math.max(0, padBottom + 12);
        viewportHeightBudget = Math.max(280, Math.floor(window.innerHeight - topInset - bottomInset));
      }
    }
    const heightLimitedWidth = Math.floor(viewportHeightBudget * ratioValue);
    const widthCap = inLayersLayout ? widthBudget : Math.min(designMaxWidth, widthBudget);
    const nextMaxWidth = Math.max(220, Math.min(widthCap, heightLimitedWidth));
    canvasWrap.style.width = `${nextMaxWidth}px`;
    canvasWrap.style.maxWidth = "100%";
    canvasWrap.style.aspectRatio = `${w} / ${h}`;
  }

  function refreshCanvasLayout() {
    updateCanvasSize(state.ratio);
    render();
    const openLayer = state.layers.find(layer => layer.tuningOpen);
    if (openLayer) positionOpenTuningPanel(openLayer.id);
  }

  function render() {
    drawLayers(ctx, 0, false);
  }

  function drawLayers(targetCtx, progress = 0, parallaxEnabled = false, motionType = "zoom", intensity = 1, lockTopLayer = false, includeBackground = true) {
    targetCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (includeBackground) {
      paintCanvasBackground(targetCtx);
    }
    const total = Math.max(1, state.layers.length);
    let topVisibleIndex = -1;
    if (parallaxEnabled && lockTopLayer) {
      for (let i = state.layers.length - 1; i >= 0; i -= 1) {
        if (state.layers[i].visible) {
          topVisibleIndex = i;
          break;
        }
      }
    }
    state.layers.forEach((layer, index) => {
      if (!layer.visible) return;
      const layerLocked = parallaxEnabled && lockTopLayer && index === topVisibleIndex;
      const source = getLayerRenderSource(layer);
      const depth = (index + 1) / total;
      const strength = clamp(Number(intensity) || 1, 0.25, 1);
      const signed = progress * 2 - 1;
      const parallaxScale = !layerLocked && parallaxEnabled && motionType === "zoom"
        ? (1 + PARALLAX_MAX_SCALE * strength * depth * progress)
        : 1;
      const drawW = source.width * layer.scale * parallaxScale;
      const drawH = source.height * layer.scale * parallaxScale;
      const panX = !layerLocked && parallaxEnabled && motionType === "panx"
        ? -signed * canvas.width * PARALLAX_PAN_X * strength * depth
        : 0;
      const panY = !layerLocked && parallaxEnabled && motionType === "pany"
        ? signed * canvas.height * PARALLAX_PAN_Y * strength * depth
        : 0;
      const cx = canvas.width / 2 + layer.x + panX;
      const cy = canvas.height / 2 + layer.y + panY;
      const angle = (layer.rotationDeg || 0) * Math.PI / 180;

      if (layer.shadowEnabled) {
        const shadow = computeShadowMetrics(drawW, drawH);
        targetCtx.save();
        targetCtx.translate(cx, cy + shadow.offsetY);
        targetCtx.rotate(angle);
        targetCtx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
        targetCtx.globalAlpha = shadow.opacity;
        targetCtx.filter = `brightness(0) saturate(0) blur(${shadow.blur}px)`;
        targetCtx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
        targetCtx.filter = "none";
        targetCtx.globalAlpha = 1;
        targetCtx.restore();
      }

      targetCtx.save();
      targetCtx.translate(cx, cy);
      targetCtx.rotate(angle);
      targetCtx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
      targetCtx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
      targetCtx.restore();
    });
  }

  function refreshList() {
    if (!listEl) return;
    listEl.innerHTML = "";
    const useHorizontalMoveArrows = !!window.matchMedia?.(LAYERS_HORIZONTAL_UI_QUERY).matches;
    const moveBackLabel = useHorizontalMoveArrows ? "←" : "↑";
    const moveForwardLabel = useHorizontalMoveArrows ? "→" : "↓";
    const moveBackTitle = useHorizontalMoveArrows ? "Move left" : "Move up";
    const moveForwardTitle = useHorizontalMoveArrows ? "Move right" : "Move down";
    const entries = [...state.layers].reverse();
    entries.forEach(layer => {
      const el = document.createElement("div");
      el.className = `layer-item${layer.id === state.activeLayerId ? " active" : ""}`;
      el.dataset.layerId = layer.id;
      const warn = layer.lowResolution
        ? '<span class="warn" title="Low resolution image at current size">⚠</span>'
        : "";
      el.innerHTML = `
        <img class="layer-thumb" src="${layer.thumbDataUrl}" alt="">
        <div class="layer-meta">
          <div class="layer-name">${layer.name}</div>
          <div class="layer-hint">${warn}<span>${layer.processing ? "Processing..." : (layer.visible ? "Visible" : "Hidden")}</span></div>
        </div>
        <div class="layer-actions">
          <button class="layer-btn up" type="button" title="${moveBackTitle}" aria-label="${moveBackTitle}">${moveBackLabel}</button>
          <button class="layer-btn down" type="button" title="${moveForwardTitle}" aria-label="${moveForwardTitle}">${moveForwardLabel}</button>
          <button class="layer-btn hide ${layer.visible ? "" : "active"}" type="button" title="${layer.visible ? "Mute layer" : "Unmute layer"}">M</button>
          <button class="layer-btn solo ${soloLayerId === layer.id ? "active" : ""}" type="button" title="${soloLayerId === layer.id ? "Exit solo mode" : "Solo this layer"}">S</button>
          <button class="layer-btn duplicate" type="button" title="Duplicate layer"><img src="./svg/copy_2_line.svg" alt=""></button>
        </div>
        <div class="layer-tools">
          <button class="layer-tool-btn fill" type="button" title="Fill canvas"><img src="./svg/fullscreen_2_line.svg" alt=""></button>
          <button class="layer-tool-btn flipx" type="button" title="Flip horizontally"><img src="./svg/flip_vertical_line.svg" alt=""></button>
          <button class="layer-tool-btn flipy" type="button" title="Flip vertically"><img src="./svg/flip_horizontal_line.svg" alt=""></button>
          <button class="layer-tool-btn shadow ${layer.shadowEnabled ? "active" : ""}" type="button" title="Toggle shadow"><img src="./svg/background_line.svg" alt=""></button>
          <button class="layer-tool-btn cutout" type="button" title="Background tools"><img src="./svg/scissors_line.svg" alt=""></button>
          <button class="layer-tool-btn adjust ${layer.tuningOpen ? "active" : ""}" type="button" title="Adjust layer"><img src="./svg/settings_6_line.svg" alt=""></button>
          <button class="layer-tool-btn reset" type="button" title="Reset image"><img src="./svg/history_anticlockwise_line.svg" alt=""></button>
          <button class="layer-tool-btn delete" type="button" title="Delete layer"><img src="./svg/delete_fill.svg" alt=""></button>
          <div class="layer-more"${layer.tuningOpen ? "" : " hidden"}>
            <div class="menu-title-bar layer-more-title-bar">
              <div class="sidebar-section-title menu-title">Tuning</div>
            </div>
            <div class="layer-wb">
            <div class="layer-retro-row">
              <button class="layer-retro-btn ${layer.retroStyle === "bw" ? "active" : ""}" type="button" data-style="bw" title="B&W preset">B&amp;W</button>
              <button class="layer-retro-btn ${layer.retroStyle === "sepia" ? "active" : ""}" type="button" data-style="sepia" title="Sepia preset">Sepia</button>
              <button class="layer-retro-btn ${layer.retroStyle === "postal" ? "active" : ""}" type="button" data-style="postal" title="Postcard preset">Card</button>
            </div>
            <label class="layer-wb-row">
              <span>Rotate</span>
              <input class="layer-wb-slider" data-kind="rotate" type="range" min="-30" max="30" value="${Math.round(layer.rotationDeg || 0)}">
            </label>
            <label class="layer-wb-row">
              <span>Bright</span>
              <input class="layer-wb-slider" data-kind="bright" type="range" min="-30" max="30" value="${Math.round(layer.wbBright || 0)}">
            </label>
            <label class="layer-wb-row">
              <span>Contrast</span>
              <input class="layer-wb-slider" data-kind="contrast" type="range" min="-30" max="30" value="${Math.round(layer.wbContrast || 0)}">
            </label>
            <label class="layer-wb-row">
              <span>Saturation</span>
              <input class="layer-wb-slider" data-kind="sat" type="range" min="-30" max="30" value="${Math.round(layer.wbSat || 0)}">
            </label>
            <label class="layer-wb-row">
              <span>Temp</span>
              <input class="layer-wb-slider" data-kind="temp" type="range" min="-25" max="25" value="${Math.round(layer.wbTemp || 0)}">
            </label>
            <label class="layer-wb-row">
              <span>Tint</span>
              <input class="layer-wb-slider" data-kind="tint" type="range" min="-25" max="25" value="${Math.round(layer.wbTint || 0)}">
            </label>
            <label class="layer-wb-row">
              <span>Blur</span>
              <input class="layer-wb-slider" data-kind="blur" type="range" min="0" max="${BLUR_LIMIT}" value="${Math.round(layer.wbBlur || 0)}">
            </label>
            </div>
          </div>
        </div>
      `;
      listEl.appendChild(el);
    });
    updateOverlay();
    onChange?.();
    const openLayer = state.layers.find(layer => layer.tuningOpen);
    if (openLayer) {
      requestAnimationFrame(() => {
        positionOpenTuningPanel(openLayer.id);
      });
    }
  }

  function makeThumbDataUrl(image) {
    const thumb = document.createElement("canvas");
    thumb.width = 96;
    thumb.height = 72;
    const tctx = thumb.getContext("2d");
    tctx.fillStyle = "#fff";
    tctx.fillRect(0, 0, thumb.width, thumb.height);
    const ratio = Math.min(thumb.width / image.width, thumb.height / image.height);
    const w = image.width * ratio;
    const h = image.height * ratio;
    tctx.drawImage(image, (thumb.width - w) / 2, (thumb.height - h) / 2, w, h);
    return thumb.toDataURL("image/png");
  }

  function closeAllTuningPanels({ refresh = true } = {}) {
    let changed = false;
    state.layers.forEach(layer => {
      if (layer.tuningOpen) {
        layer.tuningOpen = false;
        changed = true;
      }
    });
    if (changed && refresh) {
      refreshList();
      render();
    }
    return changed;
  }

  function positionOpenTuningPanel(layerId) {
    const row = listEl?.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
    if (!row) return;
    const adjustBtn = row.querySelector(".layer-tool-btn.adjust");
    const panel = row.querySelector(".layer-more:not([hidden])");
    if (!adjustBtn || !panel) return;

    const margin = 8;
    const btnRect = adjustBtn.getBoundingClientRect();
    const panelWidth = panel.offsetWidth || 244;
    const panelHeight = panel.offsetHeight || 260;

    let left = btnRect.left + btnRect.width / 2 - panelWidth / 2;
    left = clamp(left, margin, window.innerWidth - panelWidth - margin);

    let top = btnRect.bottom + 8;
    if (top + panelHeight > window.innerHeight - margin) {
      top = btnRect.top - panelHeight - 8;
    }
    top = Math.max(margin, top);

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

  function selectLayer(layerId) {
    state.activeLayerId = layerId;
    state.layers.forEach(layer => { layer.tuningOpen = false; });
    refreshList();
    render();
  }

  function layerById(layerId) {
    return state.layers.find(layer => layer.id === layerId) || null;
  }

  function addLayerFromImage(image, name = "Layer", options = {}) {
    if (!canAddLayer()) {
      onStatus?.(`Layer limit reached (${MAX_LAYERS}). Delete one to add another.`);
      return false;
    }
    const insertAt = options?.at === "bottom" ? "bottom" : "top";
    const fillScale = Math.max(canvas.width / image.width, canvas.height / image.height);
    layerSeed += 1;
    const layer = {
      id: `layer-${layerSeed}`,
      name: truncateName(name),
      image,
      originalImage: image,
      thumbDataUrl: makeThumbDataUrl(image),
      processedCanvas: null,
      wbTemp: 0,
      wbTint: 0,
      wbBright: 0,
      wbSat: 0,
      wbContrast: 0,
      wbBlur: 0,
      retroStyle: "none",
      retroIntensity: RETRO_DEFAULT_INTENSITY,
      retroGrain: RETRO_DEFAULT_GRAIN,
      rotationDeg: 0,
      processing: false,
      tuningOpen: false,
      visible: soloLayerId ? false : true,
      shadowEnabled: false,
      x: 0,
      y: 0,
      scale: fillScale,
      baseScale: fillScale,
      flipX: false,
      flipY: false,
      lowResolution: false
    };
    refreshWarnings(layer);
    if (insertAt === "bottom") {
      state.layers.unshift(layer);
    } else {
      state.layers.push(layer);
    }
    state.activeLayerId = layer.id;
    refreshList();
    render();
    onStatus?.(`Layer added: ${layer.name}`);
    return true;
  }

  async function mergeVisibleLayers(name = "Merged") {
    if (!hasLayers()) {
      return { merged: false, mergedCount: 0, reason: "no_layers" };
    }
    const visibleLayers = state.layers.filter(layer => layer.visible);
    if (visibleLayers.length < 2) {
      return { merged: false, mergedCount: visibleLayers.length, reason: "not_enough_visible" };
    }

    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = canvas.width;
    mergedCanvas.height = canvas.height;
    const mctx = mergedCanvas.getContext("2d");
    mctx.imageSmoothingEnabled = true;
    mctx.imageSmoothingQuality = "high";
    drawLayers(mctx, 0, false, "zoom", 1, false, false);

    const mergedBlob = await canvasToBlob(mergedCanvas, "image/png");
    const mergedImage = await loadImageFromBlob(mergedBlob);
    const visibleIds = new Set(visibleLayers.map(layer => layer.id));

    closeAllTuningPanels({ refresh: false });
    state.layers = state.layers.filter(layer => !visibleIds.has(layer.id));

    const fillScale = Math.max(canvas.width / mergedImage.width, canvas.height / mergedImage.height);
    layerSeed += 1;
    const mergedLayer = {
      id: `layer-${layerSeed}`,
      name: truncateName(name || "Merged"),
      image: mergedImage,
      originalImage: mergedImage,
      thumbDataUrl: makeThumbDataUrl(mergedImage),
      processedCanvas: null,
      wbTemp: 0,
      wbTint: 0,
      wbBright: 0,
      wbSat: 0,
      wbContrast: 0,
      wbBlur: 0,
      retroStyle: "none",
      retroIntensity: RETRO_DEFAULT_INTENSITY,
      retroGrain: RETRO_DEFAULT_GRAIN,
      rotationDeg: 0,
      processing: false,
      tuningOpen: false,
      visible: true,
      shadowEnabled: false,
      x: 0,
      y: 0,
      scale: fillScale,
      baseScale: fillScale,
      flipX: false,
      flipY: false,
      lowResolution: false
    };
    refreshWarnings(mergedLayer);
    state.layers.push(mergedLayer);
    state.activeLayerId = mergedLayer.id;
    refreshList();
    render();
    return { merged: true, mergedCount: visibleLayers.length, layerName: mergedLayer.name };
  }

  function hideAllLayers() {
    if (!hasLayers()) return false;
    clearSolo(false);
    let changed = false;
    state.layers.forEach((layer) => {
      if (!layer.visible) return;
      layer.visible = false;
      changed = true;
    });
    refreshList();
    render();
    return changed;
  }

  function allLayersHidden() {
    return hasLayers() && state.layers.every(layer => !layer.visible);
  }

  function toggleAllLayersVisibility() {
    if (!hasLayers()) return { changed: false, hiddenAll: false };
    clearSolo(false);
    const hideAll = !allLayersHidden();
    let changed = false;
    state.layers.forEach((layer) => {
      const nextVisible = !hideAll;
      if (layer.visible === nextVisible) return;
      layer.visible = nextVisible;
      changed = true;
    });
    refreshList();
    render();
    return { changed, hiddenAll: hideAll };
  }

  function setRatio(ratio) {
    if (!DOC_PRESETS[ratio]) return;
    state.ratio = ratio;
    updateCanvasSize(state.ratio);
    setChipActive(ratioButtons, button => button.dataset.ratio === ratio);
    render();
    refreshList();
  }

  function setCanvasDefinition(definition = "hd") {
    const normalized = CANVAS_DEFINITION_SCALES[definition] ? definition : "hd";
    if (state.canvasDefinition === normalized) return;
    state.canvasDefinition = normalized;
    updateCanvasSize(state.ratio);
    render();
    refreshList();
  }

  function exportPngBlob() {
    if (!hasLayers()) throw new Error("No layers to export.");
    render();
    return canvasToBlob(canvas, "image/png");
  }

  function fillSelectedLayer() {
    const layer = activeLayer();
    if (!layer) return false;
    const source = getLayerRenderSource(layer);
    const angle = (layer.rotationDeg || 0) * Math.PI / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const coverScaleX = (canvas.width * cos + canvas.height * sin) / Math.max(1, source.width);
    const coverScaleY = (canvas.width * sin + canvas.height * cos) / Math.max(1, source.height);
    const overscan = 1.01;
    const fill = Math.max(coverScaleX, coverScaleY) * overscan;
    layer.scale = fill;
    layer.x = 0;
    layer.y = 0;
    refreshWarnings(layer);
    refreshList();
    render();
    return true;
  }

  function resetSelectedLayer() {
    const layer = activeLayer();
    if (!layer) return false;
    const original = layer.originalImage || layer.image;
    layer.image = original;
    layer.thumbDataUrl = makeThumbDataUrl(original);
    layer.processedCanvas = null;
    layer.wbTemp = 0;
    layer.wbTint = 0;
    layer.wbBright = 0;
    layer.wbSat = 0;
    layer.wbContrast = 0;
    layer.wbBlur = 0;
    layer.retroStyle = "none";
    layer.retroIntensity = RETRO_DEFAULT_INTENSITY;
    layer.retroGrain = RETRO_DEFAULT_GRAIN;
    layer.rotationDeg = 0;
    layer.flipX = false;
    layer.flipY = false;
    layer.shadowEnabled = false;
    const resetScale = Math.max(canvas.width / original.width, canvas.height / original.height);
    layer.baseScale = resetScale;
    layer.scale = resetScale;
    layer.x = 0;
    layer.y = 0;
    refreshWarnings(layer);
    refreshList();
    render();
    return true;
  }

  function getHasSelectedLayer() {
    return !!activeLayer();
  }

  function getSelectedLayer() {
    const layer = activeLayer();
    if (!layer) return null;
    return {
      name: layer.name,
      image: layer.image
    };
  }

  function clearAllLayers() {
    clearSolo(false);
    state.layers = [];
    state.activeLayerId = null;
    refreshList();
    render();
  }

  async function exportProjectState() {
    const activeLayerIndex = state.layers.findIndex(layer => layer.id === state.activeLayerId);
    const layerEntries = [];
    const assets = [];

    for (let index = 0; index < state.layers.length; index += 1) {
      const layer = state.layers[index];
      const serial = String(index + 1).padStart(2, "0");
      const currentPath = `assets/layers/${serial}-current.png`;
      const originalPath = `assets/layers/${serial}-original.png`;
      layerEntries.push({
        name: layer.name,
        visible: !!layer.visible,
        x: Number(layer.x) || 0,
        y: Number(layer.y) || 0,
        scale: Number(layer.scale) || 1,
        baseScale: Number(layer.baseScale) || 1,
        rotationDeg: Number(layer.rotationDeg) || 0,
        flipX: !!layer.flipX,
        flipY: !!layer.flipY,
        shadowEnabled: !!layer.shadowEnabled,
        wbTemp: Number(layer.wbTemp) || 0,
        wbTint: Number(layer.wbTint) || 0,
        wbBright: Number(layer.wbBright) || 0,
        wbSat: Number(layer.wbSat) || 0,
        wbContrast: Number(layer.wbContrast) || 0,
        wbBlur: Number(layer.wbBlur) || 0,
        retroStyle: layer.retroStyle || "none",
        retroIntensity: Number(layer.retroIntensity) || RETRO_DEFAULT_INTENSITY,
        retroGrain: Number(layer.retroGrain) || RETRO_DEFAULT_GRAIN,
        currentImage: currentPath,
        originalImage: originalPath
      });
      assets.push({
        path: currentPath,
        blob: await imageLikeToPngBlob(layer.image)
      });
      assets.push({
        path: originalPath,
        blob: await imageLikeToPngBlob(layer.originalImage || layer.image)
      });
    }

    return {
      ratio: state.ratio,
      canvasDefinition: state.canvasDefinition,
      background: state.canvasBackground ? { ...state.canvasBackground } : null,
      activeLayerIndex: activeLayerIndex < 0 ? null : activeLayerIndex,
      layers: layerEntries,
      assets
    };
  }

  function importProjectState(projectState = {}) {
    clearSolo(false);
    state.layers = [];
    state.activeLayerId = null;

    const nextRatio = DOC_PRESETS[projectState.ratio] ? projectState.ratio : "landscape43";
    const nextDefinition = CANVAS_DEFINITION_SCALES[projectState.canvasDefinition]
      ? projectState.canvasDefinition
      : "hd";
    state.ratio = nextRatio;
    state.canvasDefinition = nextDefinition;
    state.canvasBackground = normalizeCanvasBackground(projectState.background || projectState.canvasBackground || null);
    updateCanvasSize(state.ratio);
    setChipActive(ratioButtons, button => button.dataset.ratio === state.ratio);

    layerSeed = 0;
    const incomingLayers = Array.isArray(projectState.layers) ? projectState.layers : [];
    incomingLayers.forEach((entry, index) => {
      if (!entry?.currentImage) return;
      const currentImage = entry.currentImage;
      const originalImage = entry.originalImage || currentImage;
      const defaultFill = Math.max(canvas.width / currentImage.width, canvas.height / currentImage.height);
      layerSeed += 1;
      const layer = {
        id: `layer-${layerSeed}`,
        name: truncateName(entry.name || `Layer ${index + 1}`),
        image: currentImage,
        originalImage,
        thumbDataUrl: makeThumbDataUrl(currentImage),
        processedCanvas: null,
        wbTemp: clamp(Number(entry.wbTemp) || 0, -WB_LIMIT, WB_LIMIT),
        wbTint: clamp(Number(entry.wbTint) || 0, -TINT_LIMIT, TINT_LIMIT),
        wbBright: clamp(Number(entry.wbBright) || 0, -BRIGHT_LIMIT, BRIGHT_LIMIT),
        wbSat: clamp(Number(entry.wbSat) || 0, -SAT_LIMIT, SAT_LIMIT),
        wbContrast: clamp(Number(entry.wbContrast) || 0, -CONTRAST_LIMIT, CONTRAST_LIMIT),
        wbBlur: clamp(Number(entry.wbBlur) || 0, 0, BLUR_LIMIT),
        retroStyle: ["none", "bw", "sepia", "postal"].includes(entry.retroStyle) ? entry.retroStyle : "none",
        retroIntensity: clamp(Number(entry.retroIntensity) || RETRO_DEFAULT_INTENSITY, 0, 100),
        retroGrain: clamp(Number(entry.retroGrain) || RETRO_DEFAULT_GRAIN, 0, 100),
        rotationDeg: clamp(Number(entry.rotationDeg) || 0, -30, 30),
        processing: false,
        tuningOpen: false,
        visible: entry.visible !== false,
        shadowEnabled: !!entry.shadowEnabled,
        x: Number.isFinite(Number(entry.x)) ? Number(entry.x) : 0,
        y: Number.isFinite(Number(entry.y)) ? Number(entry.y) : 0,
        scale: Number.isFinite(Number(entry.scale)) && Number(entry.scale) > 0.01 ? Number(entry.scale) : defaultFill,
        baseScale: Number.isFinite(Number(entry.baseScale)) && Number(entry.baseScale) > 0.01 ? Number(entry.baseScale) : defaultFill,
        flipX: !!entry.flipX,
        flipY: !!entry.flipY,
        lowResolution: false
      };
      rebuildLayerProcessed(layer);
      refreshWarnings(layer);
      state.layers.push(layer);
    });

    const rawActiveIndex = Number(projectState.activeLayerIndex);
    const normalizedActiveIndex = Number.isFinite(rawActiveIndex)
      ? clamp(Math.round(rawActiveIndex), 0, Math.max(0, state.layers.length - 1))
      : state.layers.length - 1;
    state.activeLayerId = state.layers[normalizedActiveIndex]?.id || null;
    refreshList();
    render();
  }

  async function exportLayersZipBlob() {
    if (!hasLayers()) throw new Error("No layers to export.");
    const ZipCtor = globalThis.JSZip;
    if (!ZipCtor) throw new Error("ZIP library not loaded.");

    const zip = new ZipCtor();
    const ordered = [...state.layers].reverse();
    for (let index = 0; index < ordered.length; index += 1) {
      const layer = ordered[index];
      const layerCanvas = document.createElement("canvas");
      layerCanvas.width = canvas.width;
      layerCanvas.height = canvas.height;
      const lctx = layerCanvas.getContext("2d");
      lctx.imageSmoothingEnabled = true;
      lctx.imageSmoothingQuality = "high";
      const source = getLayerRenderSource(layer);
      const drawW = source.width * layer.scale;
      const drawH = source.height * layer.scale;
      const cx = layerCanvas.width / 2 + layer.x;
      const cy = layerCanvas.height / 2 + layer.y;
      const angle = (layer.rotationDeg || 0) * Math.PI / 180;

      if (layer.shadowEnabled) {
        const shadow = computeShadowMetrics(drawW, drawH);
        lctx.save();
        lctx.translate(cx, cy + shadow.offsetY);
        lctx.rotate(angle);
        lctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
        lctx.globalAlpha = shadow.opacity;
        lctx.filter = `brightness(0) saturate(0) blur(${shadow.blur}px)`;
        lctx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
        lctx.filter = "none";
        lctx.globalAlpha = 1;
        lctx.restore();
      }

      lctx.save();
      lctx.translate(cx, cy);
      lctx.rotate(angle);
      lctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
      lctx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
      lctx.restore();
      const blob = await canvasToBlob(layerCanvas, "image/png");
      const arr = await blob.arrayBuffer();
      const serial = String(index + 1).padStart(2, "0");
      const name = `${serial}_blizlab_layer.png`;
      zip.file(name, arr);
    }
    return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  }

  async function exportParallaxGifBlob(options = {}) {
    if (!hasLayers()) throw new Error("No layers to export.");
    const GifCtor = globalThis.GIF;
    if (!GifCtor) throw new Error("GIF encoder is not loaded.");
    const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;

    const durationSec = clamp(Number(options.durationSec) || 3, 1, 5);
    const intensity = clamp(Number(options.intensity) || 1, 0.25, 1);
    const qualityPreset = [100, 50, 30].includes(Number(options.qualityPreset))
      ? Number(options.qualityPreset)
      : 50;
    const qualityConfig = PARALLAX_QUALITY_PRESETS[qualityPreset];
    const fps = [10, 15, 24].includes(Number(options.fps)) ? Number(options.fps) : 15;
    const lockTopLayer = !!options.lockTopLayer;
    const loopMode = options.loopMode === "linear" ? "linear" : "pingpong";
    const motionType = ["zoom", "panx", "pany"].includes(options.motionType) ? options.motionType : "zoom";
    const frameCount = Math.max(2, Math.round(durationSec * fps));
    const delay = Math.round(1000 / fps);

    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = Math.max(2, Math.round(canvas.width * qualityConfig.scale));
    frameCanvas.height = Math.max(2, Math.round(canvas.height * qualityConfig.scale));
    const frameCtx = frameCanvas.getContext("2d");
    frameCtx.imageSmoothingEnabled = true;
    frameCtx.imageSmoothingQuality = "high";
    const watermarkImage = await loadParallaxWatermark();

    const gif = new GifCtor({
      workers: 2,
      quality: qualityConfig.quality,
      width: frameCanvas.width,
      height: frameCanvas.height,
      repeat: 0,
      workerScript: "./gif.worker.proxy.js"
    });

    for (let i = 0; i < frameCount; i += 1) {
      const t = frameCount <= 1 ? 0 : i / (frameCount - 1);
      const progress = loopMode === "pingpong"
        ? (t <= 0.5 ? t * 2 : (1 - t) * 2)
        : t;
      frameCtx.save();
      frameCtx.scale(qualityConfig.scale, qualityConfig.scale);
      drawLayers(frameCtx, progress, true, motionType, intensity, lockTopLayer);
      frameCtx.restore();
      if (watermarkImage) {
        const markW = clamp(Math.round(frameCanvas.width * 0.13), 54, 128);
        const markH = Math.round(markW * (watermarkImage.height / Math.max(1, watermarkImage.width)));
        const pad = clamp(Math.round(frameCanvas.width * 0.01), 6, 12);
        const x = frameCanvas.width - markW - pad;
        const y = frameCanvas.height - markH - pad;
        frameCtx.save();
        frameCtx.globalAlpha = 0.62;
        frameCtx.drawImage(watermarkImage, x, y, markW, markH);
        frameCtx.restore();
      }
      gif.addFrame(frameCanvas, { copy: true, delay });
      onProgress?.({ stage: "render", progress: (i + 1) / frameCount });
    }

    drawLayers(ctx, 0, false);

    return new Promise((resolve, reject) => {
      gif.on("progress", percent => {
        onProgress?.({ stage: "encode", progress: clamp(percent, 0, 1) });
      });
      gif.on("finished", blob => resolve(blob));
      gif.on("abort", () => reject(new Error("GIF render was aborted.")));
      gif.render();
    });
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function pickTopLayerAt(point) {
    for (let index = state.layers.length - 1; index >= 0; index -= 1) {
      const layer = state.layers[index];
      if (!layer.visible) continue;
      const source = getLayerRenderSource(layer);
      const drawW = source.width * layer.scale;
      const drawH = source.height * layer.scale;
      const left = canvas.width / 2 + layer.x - drawW / 2;
      const top = canvas.height / 2 + layer.y - drawH / 2;
      const right = left + drawW;
      const bottom = top + drawH;
      if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) return layer;
    }
    return activeLayer();
  }

  function pointerDown(event) {
    if (!hasLayers()) return;
    const point = getCanvasPoint(event);
    let picked = activeLayer();
    if (!picked) {
      picked = pickTopLayerAt(point);
    }
    if (!picked) return;
    interaction.dragging = true;
    interaction.pointerId = event.pointerId;
    interaction.startX = point.x;
    interaction.startY = point.y;
    interaction.startLayerX = picked.x;
    interaction.startLayerY = picked.y;
    state.activeLayerId = picked.id;
    canvas.setPointerCapture(event.pointerId);
    refreshList();
    render();
    event.preventDefault();
  }

  function pointerMove(event) {
    if (!interaction.dragging) return;
    const layer = activeLayer();
    if (!layer) return;
    const point = getCanvasPoint(event);
    const dx = point.x - interaction.startX;
    const dy = point.y - interaction.startY;
    layer.x = interaction.startLayerX + dx;
    layer.y = interaction.startLayerY + dy;
    render();
    event.preventDefault();
  }

  function pointerEnd(event) {
    if (!interaction.dragging) return;
    interaction.dragging = false;
    if (interaction.pointerId !== null) {
      canvas.releasePointerCapture(interaction.pointerId);
    }
    interaction.pointerId = null;
    refreshList();
    render();
    event.preventDefault();
  }

  function onWheel(event) {
    const layer = activeLayer();
    if (!layer) return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    layer.scale = clamp(layer.scale * factor, 0.04, 12);
    refreshWarnings(layer);
    refreshList();
    render();
  }

  canvas.addEventListener("pointerdown", pointerDown, { passive: false });
  canvas.addEventListener("pointermove", pointerMove, { passive: false });
  canvas.addEventListener("pointerup", pointerEnd, { passive: false });
  canvas.addEventListener("pointercancel", pointerEnd, { passive: false });
  canvas.addEventListener("wheel", onWheel, { passive: false });

  listEl.addEventListener("click", async event => {
    const item = event.target.closest(".layer-item");
    if (!item) return;
    const layerId = item.dataset.layerId;
    const layer = layerById(layerId);
    if (!layer) return;

    if (event.target.closest(".layer-retro-btn")) {
      const button = event.target.closest(".layer-retro-btn");
      const nextStyle = button.dataset.style || "none";
      state.activeLayerId = layerId;
      layer.retroStyle = layer.retroStyle === nextStyle ? "none" : nextStyle;
      layer.retroIntensity = RETRO_DEFAULT_INTENSITY;
      layer.retroGrain = RETRO_DEFAULT_GRAIN;
      rebuildLayerProcessed(layer);
      refreshList();
      render();
      return;
    }

    if (event.target.closest(".layer-tool-btn")) {
      const button = event.target.closest(".layer-tool-btn");
      state.activeLayerId = layerId;
      if (button.classList.contains("fill")) {
        fillSelectedLayer();
        onStatus?.("Layer filled.");
      } else if (button.classList.contains("reset")) {
        if (resetSelectedLayer()) {
          onStatus?.("Selected layer reset.");
        }
        return;
      } else if (button.classList.contains("delete")) {
        closeAllTuningPanels({ refresh: false });
        if (layer.id === soloLayerId) clearSolo(true);
        state.layers = state.layers.filter(entry => entry.id !== layerId);
        if (state.activeLayerId === layerId) {
          state.activeLayerId = state.layers[state.layers.length - 1]?.id || null;
        }
        refreshList();
        render();
        return;
      } else if (button.classList.contains("flipx")) {
        layer.flipX = !layer.flipX;
      } else if (button.classList.contains("flipy")) {
        layer.flipY = !layer.flipY;
      } else if (button.classList.contains("shadow")) {
        layer.shadowEnabled = !layer.shadowEnabled;
      } else if (button.classList.contains("adjust")) {
        const next = !layer.tuningOpen;
        state.layers.forEach(entry => {
          entry.tuningOpen = entry.id === layerId ? next : false;
        });
        refreshList();
        render();
        return;
      } else if (button.classList.contains("cutout")) {
        openLayerBrushEditor(layer).catch((error) => {
          console.error(error);
          onStatus?.("Could not open layer brush editor.");
        });
        return;
      }
      refreshList();
      render();
      return;
    }

    if (event.target.closest(".layer-btn")) {
      const button = event.target.closest(".layer-btn");
      const index = state.layers.findIndex(entry => entry.id === layerId);
      if (button.classList.contains("up") && index < state.layers.length - 1) {
        const swap = state.layers[index + 1];
        state.layers[index + 1] = layer;
        state.layers[index] = swap;
      } else if (button.classList.contains("down") && index > 0) {
        const swap = state.layers[index - 1];
        state.layers[index - 1] = layer;
        state.layers[index] = swap;
      } else if (button.classList.contains("hide")) {
        if (soloLayerId) clearSolo(true);
        layer.visible = !layer.visible;
      } else if (button.classList.contains("solo")) {
        toggleSolo(layerId);
      } else if (button.classList.contains("duplicate")) {
        closeAllTuningPanels({ refresh: false });
        duplicateLayer(layerId);
        return;
      }
      refreshList();
      render();
      return;
    }

    if (event.target.closest(".layer-more")) {
      return;
    }

    selectLayer(layerId);
  });

  listEl.addEventListener("input", event => {
    const slider = event.target.closest(".layer-wb-slider");
    if (!slider) return;
    const item = event.target.closest(".layer-item");
    if (!item) return;
    const layer = layerById(item.dataset.layerId);
    if (!layer) return;

    if (slider.dataset.kind === "temp") {
      layer.wbTemp = clamp(Number(slider.value) || 0, -WB_LIMIT, WB_LIMIT);
      rebuildLayerProcessed(layer);
    } else if (slider.dataset.kind === "tint") {
      layer.wbTint = clamp(Number(slider.value) || 0, -TINT_LIMIT, TINT_LIMIT);
      rebuildLayerProcessed(layer);
    } else if (slider.dataset.kind === "bright") {
      layer.wbBright = clamp(Number(slider.value) || 0, -BRIGHT_LIMIT, BRIGHT_LIMIT);
      rebuildLayerProcessed(layer);
    } else if (slider.dataset.kind === "sat") {
      layer.wbSat = clamp(Number(slider.value) || 0, -SAT_LIMIT, SAT_LIMIT);
      rebuildLayerProcessed(layer);
    } else if (slider.dataset.kind === "contrast") {
      layer.wbContrast = clamp(Number(slider.value) || 0, -CONTRAST_LIMIT, CONTRAST_LIMIT);
      rebuildLayerProcessed(layer);
    } else if (slider.dataset.kind === "blur") {
      layer.wbBlur = clamp(Number(slider.value) || 0, 0, BLUR_LIMIT);
      rebuildLayerProcessed(layer);
    } else if (slider.dataset.kind === "rotate") {
      layer.rotationDeg = clamp(Number(slider.value) || 0, -30, 30);
    }
    render();
  });

  document.addEventListener("click", event => {
    if (!state.layers.some(layer => layer.tuningOpen)) return;
    if (event.target.closest(".layer-more")) return;
    if (event.target.closest(".layer-tool-btn.adjust")) return;
    closeAllTuningPanels();
  });

  window.addEventListener("resize", () => {
    refreshCanvasLayout();
    refreshList();
  });

  listEl.addEventListener("scroll", () => {
    const openLayer = state.layers.find(layer => layer.tuningOpen);
    if (openLayer) positionOpenTuningPanel(openLayer.id);
  });

  ratioButtons.forEach(button => {
    button.addEventListener("click", () => setRatio(button.dataset.ratio));
  });

  updateCanvasSize(state.ratio);
  setChipActive(ratioButtons, button => button.dataset.ratio === state.ratio);
  refreshList();
  render();

  return {
    addLayerFromImage,
    clearAllLayers,
    exportPngBlob,
    exportLayersZipBlob,
    exportProjectState,
    exportParallaxGifBlob,
    importProjectState,
    fillSelectedLayer,
    resetSelectedLayer,
    getSelectedLayer,
    getHasLayers: hasLayers,
    getLayerCount,
    getVisibleLayerCount,
    getRatio,
    getCanvasSize,
    getHasSelectedLayer,
    getCanAddLayer: canAddLayer,
    getMaxLayers,
    getCanvasBackground,
    allLayersHidden,
    hideAllLayers,
    mergeVisibleLayers,
    toggleAllLayersVisibility,
    setCanvasBackground,
    setRatio,
    setCanvasDefinition,
    refreshLayout: refreshCanvasLayout
  };
}
