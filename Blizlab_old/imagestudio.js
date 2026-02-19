import { createEditor } from "./modules/editor.js";
import { createCutoutTool } from "./modules/cutout.js";
import { createLayersTool } from "./modules/layers.js";
import { canvasToBlob, constrainImageLongSide, downloadBlob, loadImageFromBlob, loadImageFromFile } from "./modules/shared.js";

const statusPill = document.getElementById("statusPill");

// Shared image controls
const fileInput = document.getElementById("fileInput");
const pasteImageBtn = document.getElementById("pasteImageBtn");
const fileNameText = document.getElementById("fileNameText");
const exportMenuWrap = document.getElementById("exportMenuWrap");
const downloadEditorBtn = document.getElementById("downloadEditorBtn");
const sidePanel = document.getElementById("sidePanel");
const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
const btnQuickUpload = document.getElementById("btnQuickUpload");
const btnQuickPaste = document.getElementById("btnQuickPaste");
const btnQuickDownload = document.getElementById("btnQuickDownload");
const btnQuickAddComposition = document.getElementById("btnQuickAddComposition");
const btnQuickParallax = document.getElementById("btnQuickParallax");
const canvasFormatButtons = Array.from(document.querySelectorAll("#canvasFormatChips .chip-btn"));
const canvasOrientationButtons = Array.from(document.querySelectorAll("#canvasOrientationChips .chip-btn"));
const definitionButtons = Array.from(document.querySelectorAll("#definitionChips .chip-btn"));
const upscaleLowResToggle = document.getElementById("upscaleLowResToggle");
const aboutPanel = document.getElementById("appAboutPanel");
const aboutToggleBtn = document.getElementById("aboutToggleBtn");
const aboutStartBtn = document.getElementById("aboutStartBtn");
const moreToggleBtn = document.getElementById("moreToggleBtn");
const moreMenu = document.getElementById("moreMenu");
const logoBoltBtn = document.getElementById("logoBoltBtn");
const logoSparks = document.getElementById("logoSparks");

// Mode UI
const modeTabs = Array.from(document.querySelectorAll(".mode-tab"));
const editPanel = document.getElementById("editPanel");
const cutoutPanel = document.getElementById("cutoutPanel");
const layersPanel = document.getElementById("layersPanel");
const editorDropZone = document.getElementById("editorDropZone");
const cutoutWrap = document.getElementById("cutoutWrap");
const layersWrap = document.getElementById("layersWrap");
const canvasStack = document.querySelector(".canvas-stack");
const modelBarCanvas = document.getElementById("modelBarCanvas");
const canvasArea = document.querySelector(".canvas-area");

// Editor DOM
const editorCanvas = document.getElementById("editorCanvas");
const styleButtons = Array.from(document.querySelectorAll("#styleChips .chip-btn"));
const intensitySlider = document.getElementById("intensity");
const intensityValue = document.getElementById("intensityValue");
const roundnessSlider = document.getElementById("roundness");
const roundnessValue = document.getElementById("roundnessValue");
const noiseSlider = document.getElementById("noise");
const noiseValue = document.getElementById("noiseValue");
const fillBtn = document.getElementById("fillBtn");
const resetEditBtn = document.getElementById("resetEditBtn");
const sendToLayersBtn = document.getElementById("sendToLayersBtn");
const btnImportLayersComposition = document.getElementById("btnImportLayersComposition");

// Cutout DOM
const cutoutCanvas = document.getElementById("cutoutCanvas");
const overlayMsg = document.getElementById("overlayMsg");
const brushPreview = document.getElementById("brushPreview");
const cutoutBgButtons = Array.from(document.querySelectorAll("[data-cutout-bg]"));
const modelNoteEl = document.getElementById("modelNote");
const btnReloadModel = document.getElementById("btnReloadModel");
const modelDot = document.getElementById("modelDot");
const btnRemove = document.getElementById("btnRemove");
const btnRemoveChroma = document.getElementById("btnRemoveChroma");
const btnUndo = document.getElementById("btnUndo");
const btnRedo = document.getElementById("btnRedo");
const brushValueEl = document.getElementById("brushValue");
const brushSizeEl = document.getElementById("brushSize");
const aiStrengthEl = document.getElementById("aiStrength");
const aiStrengthValueEl = document.getElementById("aiStrengthValue");
const modeEraseBtn = document.getElementById("modeErase");
const modeRestoreBtn = document.getElementById("modeRestore");
const viewModeBrushBtn = document.getElementById("viewModeBrush");
const viewModeMoveBtn = document.getElementById("viewModeMove");
const btnApplyCutout = document.getElementById("btnApplyCutout");
const btnSendCutoutToLayers = document.getElementById("btnSendCutoutToLayers");
const btnResetCutout = document.getElementById("btnResetCutout");
const exportModeButtons = Array.from(document.querySelectorAll("[data-export-mode]"));

// Layers DOM
const layersCanvas = document.getElementById("layersCanvas");
const layersCanvasWrap = document.getElementById("layersCanvasWrap");
const layersList = document.getElementById("layersList");
const layersOverlayMsg = document.getElementById("layersOverlayMsg");
const btnLayersHideAll = document.getElementById("btnLayersHideAll");
const btnLayersAdd = document.getElementById("btnLayersAdd");
const btnLayersAddBottom = document.getElementById("btnLayersAddBottom");
const layersCountText = document.getElementById("layersCountText");
const btnAddCompositionLayer = document.getElementById("btnAddCompositionLayer");
const btnDownloadLayersZip = document.getElementById("btnDownloadLayersZip");
const btnParallaxToggle = document.getElementById("btnParallaxToggle");
const parallaxPanelBody = document.getElementById("parallaxPanelBody");
const parallaxDuration = document.getElementById("parallaxDuration");
const parallaxDurationValue = document.getElementById("parallaxDurationValue");
const parallaxIntensity = document.getElementById("parallaxIntensity");
const parallaxIntensityValue = document.getElementById("parallaxIntensityValue");
const parallaxQualityPreset = document.getElementById("parallaxQualityPreset");
const parallaxFps = document.getElementById("parallaxFps");
const parallaxLoopMode = document.getElementById("parallaxLoopMode");
const parallaxMotionType = document.getElementById("parallaxMotionType");
const parallaxLockTop = document.getElementById("parallaxLockTop");
const btnExportParallaxGif = document.getElementById("btnExportParallaxGif");
const parallaxActionLabel = document.getElementById("parallaxActionLabel");
const parallaxPreviewOverlay = document.getElementById("parallaxPreviewOverlay");
const parallaxPreviewImage = document.getElementById("parallaxPreviewImage");
const btnSaveParallaxGif = document.getElementById("btnSaveParallaxGif");
const btnCloseParallaxPreview = document.getElementById("btnCloseParallaxPreview");

let currentMode = "layers";
let sourceFileName = "";
let sourceImage = null;
let cutoutImage = null;
let layers = null;
let isParallaxExporting = false;
let cutoutHasContext = false;
let cutoutBgMode = "checker";
const PARALLAX_EXPORT_LABEL = "Create Parallax Animation";
const CANVAS_DEFINITION_KEY = "retrocutCanvasDefinition";
const UPSCALE_LOW_RES_KEY = "retrocutUpscaleLowRes";
const ABOUT_SEEN_KEY = "retrocutAboutSeen";
const CANVAS_DEFINITION_SET = new Set(["sd", "hd", "4k"]);
const MAX_IMPORT_LONG_SIDE = 4096;
const BOLT_SPARK_VECTORS = [
  { dx: -20, dy: -10, rot: -156 },
  { dx: -22, dy: 0, rot: 180 },
  { dx: -18, dy: 11, rot: 148 },
  { dx: -8, dy: -16, rot: -112 },
  { dx: 8, dy: -16, rot: -68 },
  { dx: 18, dy: -10, rot: -24 },
  { dx: 22, dy: 0, rot: 0 },
  { dx: 18, dy: 11, rot: 28 },
  { dx: 8, dy: 16, rot: 68 },
  { dx: -8, dy: 16, rot: 112 }
];
let parallaxPreviewBlob = null;
let parallaxPreviewUrl = "";
let lockedRetroOrientation = null;
let canvasDefinition = "sd";
let canvasFormat = "43";
let canvasOrientation = "horizontal";
let upscaleLowResEnabled = false;
let pendingLayersInsertAt = "top";

function setStatus(text) {
  if (statusPill) statusPill.textContent = text;
}

function triggerLogoBoltSparks() {
  if (!logoSparks) return;
  logoSparks.textContent = "";
  BOLT_SPARK_VECTORS.forEach((spark, index) => {
    const sparkEl = document.createElement("span");
    sparkEl.className = "logo-spark";
    sparkEl.style.setProperty("--dx", `${spark.dx}px`);
    sparkEl.style.setProperty("--dy", `${spark.dy}px`);
    sparkEl.style.setProperty("--rot", `${spark.rot}deg`);
    sparkEl.style.animationDelay = `${index * 10}ms`;
    logoSparks.appendChild(sparkEl);
    window.setTimeout(() => sparkEl.remove(), 440 + index * 10);
  });
}

function readCanvasDefinition() {
  const stored = localStorage.getItem(CANVAS_DEFINITION_KEY);
  return CANVAS_DEFINITION_SET.has(stored) ? stored : "sd";
}

function syncDefinitionUI() {
  definitionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.definition === canvasDefinition);
  });
}

function applyCanvasDefinition(nextDefinition, { persist = true } = {}) {
  canvasDefinition = CANVAS_DEFINITION_SET.has(nextDefinition) ? nextDefinition : "sd";
  if (persist) {
    localStorage.setItem(CANVAS_DEFINITION_KEY, canvasDefinition);
  }
  syncDefinitionUI();
  editor.setCanvasDefinition(canvasDefinition);
  layers?.setCanvasDefinition?.(canvasDefinition);
}

function setSidebarCollapsed(collapsed) {
  if (!sidePanel || !sidebarCollapseBtn) return;
  sidePanel.classList.toggle("is-collapsed", !!collapsed);
  sidebarCollapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function setAboutPanelOpen(open, { markSeen = false } = {}) {
  if (!aboutPanel || !aboutToggleBtn) return;
  const isOpen = !!open;
  aboutPanel.hidden = !isOpen;
  document.body.classList.toggle("about-closed", !isOpen);
  aboutToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  if (markSeen) {
    localStorage.setItem(ABOUT_SEEN_KEY, "1");
  }
}

function setMoreMenuOpen(open) {
  if (!moreToggleBtn || !moreMenu) return;
  const isOpen = !!open;
  moreMenu.hidden = !isOpen;
  moreToggleBtn.classList.toggle("is-open", isOpen);
  moreToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function syncParallaxDurationLabel() {
  if (parallaxDuration && parallaxDurationValue) {
    parallaxDurationValue.textContent = `${parallaxDuration.value}s`;
  }
}

function syncParallaxIntensityLabel() {
  if (parallaxIntensity && parallaxIntensityValue) {
    parallaxIntensityValue.textContent = `${parallaxIntensity.value}%`;
  }
}

function setParallaxDefaults() {
  if (parallaxDuration) parallaxDuration.value = "3";
  if (parallaxIntensity) parallaxIntensity.value = "50";
  if (parallaxQualityPreset) parallaxQualityPreset.value = "50";
  if (parallaxFps) parallaxFps.value = "15";
  if (parallaxLockTop) parallaxLockTop.checked = false;
  if (parallaxLoopMode) parallaxLoopMode.value = "pingpong";
  if (parallaxMotionType) parallaxMotionType.value = "zoom";
  syncParallaxDurationLabel();
  syncParallaxIntensityLabel();
}

async function upscaleImageToTargetIfNeeded(image, targetSize) {
  if (!upscaleLowResEnabled || !targetSize) {
    return { image, upscaled: false, width: image.width, height: image.height };
  }
  const targetW = Math.max(1, Math.round(Number(targetSize.width) || 1));
  const targetH = Math.max(1, Math.round(Number(targetSize.height) || 1));
  const sourceW = Math.max(1, image.naturalWidth || image.width);
  const sourceH = Math.max(1, image.naturalHeight || image.height);
  const scaleFactor = Math.max(targetW / sourceW, targetH / sourceH);
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 1) {
    return { image, upscaled: false, width: sourceW, height: sourceH };
  }

  const outW = Math.max(1, Math.round(sourceW * scaleFactor));
  const outH = Math.max(1, Math.round(sourceH * scaleFactor));
  const work = document.createElement("canvas");
  work.width = outW;
  work.height = outH;
  const wctx = work.getContext("2d");
  wctx.imageSmoothingEnabled = false;
  wctx.drawImage(image, 0, 0, outW, outH);
  const blob = await canvasToBlob(work, "image/png");
  const stretched = await loadImageFromBlob(blob);
  return { image: stretched, upscaled: true, width: outW, height: outH };
}

function editorPresetFromCanvasSelection(format, orientation) {
  if (format === "11") return "square11";
  if (format === "45") return orientation === "vertical" ? "portrait45" : "landscape54";
  if (format === "169") return orientation === "vertical" ? "portrait916" : "landscape169";
  return orientation === "vertical" ? "portrait34" : "landscape43";
}

function canvasSelectionFromEditorPreset(preset) {
  if (preset === "square11") return { format: "11", orientation: "horizontal" };
  if (preset === "landscape54") return { format: "45", orientation: "horizontal" };
  if (preset === "portrait45") return { format: "45", orientation: "vertical" };
  if (preset === "landscape169") return { format: "169", orientation: "horizontal" };
  if (preset === "portrait916") return { format: "169", orientation: "vertical" };
  if (preset === "portrait34") return { format: "43", orientation: "vertical" };
  return { format: "43", orientation: "horizontal" };
}

function layersRatioFromEditorPreset(preset) {
  return preset === "square11" ? "square" : preset;
}

function editorPresetFromLayersRatio(ratio) {
  return ratio === "square" ? "square11" : ratio;
}

function syncCanvasSettingsUI() {
  canvasFormatButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.canvasFormat === canvasFormat);
  });
  const locked = !!lockedRetroOrientation;
  const squareFormat = canvasFormat === "11";
  canvasOrientationButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.canvasOrientation === canvasOrientation);
    button.disabled = locked || squareFormat;
    button.title = locked
      ? "Aspect ratio locked to imported Layers composition."
      : (squareFormat ? "Orientation is fixed for 1:1 format." : "");
  });
  canvasFormatButtons.forEach((button) => {
    button.disabled = locked;
    button.title = locked ? "Aspect ratio locked to imported Layers composition." : "";
  });
}

function applyCanvasAspectFromSettings() {
  const editorPreset = editorPresetFromCanvasSelection(canvasFormat, canvasOrientation);
  editor.setOrientation(editorPreset);
  layers?.setRatio?.(layersRatioFromEditorPreset(editorPreset));
  syncCanvasSettingsUI();
}

function setCanvasAspectPreset(editorPreset) {
  const next = canvasSelectionFromEditorPreset(editorPreset);
  canvasFormat = next.format;
  canvasOrientation = next.orientation;
  applyCanvasAspectFromSettings();
}

function setRetroOrientationLock(orientationOrNull) {
  lockedRetroOrientation = orientationOrNull || null;
  if (lockedRetroOrientation) {
    setCanvasAspectPreset(lockedRetroOrientation);
  } else {
    syncCanvasSettingsUI();
  }
}

function setCutoutPreviewBackground(mode) {
  if (!cutoutWrap) return;
  if (mode === "context" && !cutoutHasContext) mode = "checker";
  cutoutBgMode = mode;
  cutoutWrap.dataset.bg = mode;
  cutoutBgButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.cutoutBg === mode);
  });
  cutout.setReferenceVisible(mode === "context" && cutoutHasContext);
}

function setCutoutContextAvailability(enabled) {
  cutoutHasContext = !!enabled;
  const contextBtn = cutoutBgButtons.find((btn) => btn.dataset.cutoutBg === "context");
  if (contextBtn) contextBtn.hidden = !cutoutHasContext;
  if (!cutoutHasContext && cutoutBgMode === "context") {
    setCutoutPreviewBackground("checker");
    return;
  }
  setCutoutPreviewBackground(cutoutBgMode);
}

function setMode(mode) {
  currentMode = mode;
  const inEdit = mode === "edit";
  const inCutout = mode === "cutout";
  const inLayers = mode === "layers";

  modeTabs.forEach(btn => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  editPanel.hidden = !inEdit;
  cutoutPanel.hidden = !inCutout;
  layersPanel.hidden = !inLayers;
  if (exportMenuWrap) exportMenuWrap.hidden = inLayers;
  editorDropZone.hidden = !inEdit;
  cutoutWrap.hidden = !inCutout;
  layersWrap.hidden = !inLayers;
  if (modelBarCanvas) modelBarCanvas.hidden = !inCutout;
  editorDropZone.setAttribute("aria-hidden", inEdit ? "false" : "true");
  cutoutWrap.setAttribute("aria-hidden", inCutout ? "false" : "true");
  layersWrap.setAttribute("aria-hidden", inLayers ? "false" : "true");
  if (canvasArea) {
    canvasArea.classList.toggle("is-edit", inEdit);
    canvasArea.classList.toggle("is-cutout", inCutout);
    canvasArea.classList.toggle("is-layers", inLayers);
  }

  if (canvasStack) {
    canvasStack.classList.toggle("is-edit", inEdit);
    canvasStack.classList.toggle("is-cutout", inCutout);
    canvasStack.classList.toggle("is-layers", inLayers);
  }

  if (exportModeButtons.length > 0) {
    exportModeButtons.forEach((button) => {
      const targetMode = button.dataset.exportMode;
      button.hidden = targetMode !== mode;
    });
  }

  if (inEdit) {
    setStatus("Retro mode: tweak style + export PNG.");
  } else if (inCutout) {
    setStatus("BGone mode: remove + refine cutout.");
  } else {
    setStatus("Layers mode: build composites and export in video-friendly sizes.");
  }
  syncDownloadButton();
  syncLayersActionButtons();
}

const editor = createEditor({
  canvas: editorCanvas,
  dropZone: editorDropZone,
  orientationButtons: [],
  styleButtons,
  intensitySlider,
  intensityValue,
  roundnessSlider,
  roundnessValue,
  noiseSlider,
  noiseValue,
  fillBtn
});

const cutout = createCutoutTool({
  canvas: cutoutCanvas,
  canvasWrap: cutoutWrap,
  overlayMsg,
  brushPreview,
  modelNoteEl,
  btnReloadModel,
  modelDot,
  btnRemove,
  btnRemoveChroma,
  btnUndo,
  btnRedo,
  brushValueEl,
  brushSizeEl,
  aiStrengthEl,
  aiStrengthValueEl,
  modeEraseBtn,
  modeRestoreBtn,
  viewModeBrushBtn,
  viewModeMoveBtn,
  onStatus: setStatus
});

layers = createLayersTool({
  canvas: layersCanvas,
  canvasWrap: layersCanvasWrap,
  listEl: layersList,
  overlayEl: layersOverlayMsg,
  ratioButtons: [],
  onStatus: setStatus,
  onSendLayerToCutout: async ({ subjectBlob, contextBlob, layerName }) => {
    const subjectImage = await loadImageFromBlob(subjectBlob);
    await cutout.setImage(subjectImage, `${layerName || "layer"}-bgone.png`);
    sourceImage = subjectImage;
    sourceFileName = `${layerName || "layer"}-bgone.png`;
    fileNameText.textContent = sourceFileName;
    cutoutImage = null;

    if (contextBlob) {
      const contextImage = await loadImageFromBlob(contextBlob);
      cutout.setReferenceBackground(contextImage);
      setCutoutContextAvailability(true);
      setCutoutPreviewBackground("context");
    } else {
      cutout.setReferenceBackground(null);
      setCutoutContextAvailability(false);
      setCutoutPreviewBackground("checker");
    }

    setButtonsForImageLoaded(true);
    setMode("cutout");
    setStatus("Layer sent to BGone with context preview.");
  },
  onChange: () => {
    if (!layers) return;
    syncDownloadButton();
    syncLayersActionButtons();
  }
});

function syncDownloadButton() {
  if (currentMode === "layers") {
    downloadEditorBtn.disabled = !layers.getHasLayers();
  } else {
    downloadEditorBtn.disabled = !editor.getHasImage();
  }
  if (btnQuickDownload) btnQuickDownload.disabled = downloadEditorBtn.disabled;
}

function syncLayersActionButtons() {
  if (!layers) return;
  const hasLayers = layers.getHasLayers();
  const allHidden = hasLayers && !!layers.allLayersHidden?.();
  const layerCount = layers.getLayerCount();
  const maxLayers = layers.getMaxLayers?.() || 10;
  const canParallax = layerCount >= 2;
  const canAddLayer = layers.getCanAddLayer();
  if (layersCountText) layersCountText.textContent = `${layerCount}/${maxLayers}`;
  if (btnAddCompositionLayer) btnAddCompositionLayer.disabled = !hasLayers || !canAddLayer;
  if (btnImportLayersComposition) btnImportLayersComposition.disabled = !hasLayers;
  btnDownloadLayersZip.disabled = !hasLayers;
  if (btnExportParallaxGif) {
    btnExportParallaxGif.disabled = isParallaxExporting || !canParallax;
    btnExportParallaxGif.title = canParallax
      ? "Export layered parallax GIF"
      : "Parallax needs at least 2 layers";
  }
  if (parallaxDuration) parallaxDuration.disabled = !canParallax;
  if (parallaxIntensity) parallaxIntensity.disabled = !canParallax;
  if (parallaxQualityPreset) parallaxQualityPreset.disabled = !canParallax;
  if (parallaxFps) parallaxFps.disabled = !canParallax;
  if (parallaxLoopMode) parallaxLoopMode.disabled = !canParallax;
  if (parallaxMotionType) parallaxMotionType.disabled = !canParallax;
  if (parallaxLockTop) parallaxLockTop.disabled = !canParallax;
  if (btnLayersAdd) btnLayersAdd.disabled = !canAddLayer;
  if (btnLayersAddBottom) btnLayersAddBottom.disabled = !canAddLayer;
  if (btnLayersHideAll) {
    btnLayersHideAll.disabled = !hasLayers;
    btnLayersHideAll.textContent = allHidden ? "M-" : "M+";
    btnLayersHideAll.title = allHidden ? "Show all layers" : "Hide all layers";
    btnLayersHideAll.setAttribute("aria-label", allHidden ? "Show all layers" : "Hide all layers");
    btnLayersHideAll.classList.toggle("is-active", allHidden);
  }
  if (btnQuickDownload) btnQuickDownload.disabled = !!downloadEditorBtn.disabled;
  if (btnQuickAddComposition) btnQuickAddComposition.disabled = !!btnAddCompositionLayer?.disabled;
  if (btnQuickParallax) btnQuickParallax.disabled = isParallaxExporting || !canParallax;
  if (currentMode === "edit" && sendToLayersBtn) {
    sendToLayersBtn.disabled = !editor.getHasImage() || !canAddLayer;
  }
  if (currentMode === "cutout" && btnSendCutoutToLayers) {
    btnSendCutoutToLayers.disabled = !sourceImage || !canAddLayer;
  }
}

function showLayerLimitPopup() {
  const max = layers?.getMaxLayers?.() || 6;
  window.alert(`Maximum layers reached (${max}). Delete a layer before adding more.`);
}

function setParallaxActionLabel(text) {
  if (parallaxActionLabel) {
    parallaxActionLabel.textContent = text;
  } else if (btnExportParallaxGif) {
    btnExportParallaxGif.textContent = text;
  }
}

function setParallaxPanelOpen(open) {
  if (!btnParallaxToggle || !parallaxPanelBody) return;
  btnParallaxToggle.classList.toggle("is-open", open);
  btnParallaxToggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    parallaxPanelBody.hidden = false;
    requestAnimationFrame(() => parallaxPanelBody.classList.add("is-open"));
  } else {
    parallaxPanelBody.classList.remove("is-open");
    setTimeout(() => {
      if (!parallaxPanelBody.classList.contains("is-open")) parallaxPanelBody.hidden = true;
    }, 220);
  }
}

btnParallaxToggle?.addEventListener("click", () => {
  const nextOpen = !parallaxPanelBody || parallaxPanelBody.hidden;
  setParallaxPanelOpen(nextOpen);
});

function closeParallaxPreview() {
  if (!parallaxPreviewOverlay) return;
  parallaxPreviewOverlay.hidden = true;
  if (parallaxPreviewImage) parallaxPreviewImage.removeAttribute("src");
  if (parallaxPreviewUrl) URL.revokeObjectURL(parallaxPreviewUrl);
  parallaxPreviewUrl = "";
  parallaxPreviewBlob = null;
}

function openParallaxPreview(blob) {
  if (!parallaxPreviewOverlay || !parallaxPreviewImage) return;
  if (parallaxPreviewUrl) URL.revokeObjectURL(parallaxPreviewUrl);
  parallaxPreviewBlob = blob;
  parallaxPreviewUrl = URL.createObjectURL(blob);
  parallaxPreviewImage.src = parallaxPreviewUrl;
  parallaxPreviewOverlay.hidden = false;
}

function setButtonsForImageLoaded(loaded) {
  const canAddLayer = layers?.getCanAddLayer?.() ?? false;
  const hasLayers = layers?.getHasLayers?.() ?? false;
  syncDownloadButton();
  resetEditBtn.disabled = !loaded;
  sendToLayersBtn.disabled = !loaded || !canAddLayer;
  if (btnImportLayersComposition) btnImportLayersComposition.disabled = !hasLayers;
  btnApplyCutout.disabled = !loaded;
  btnSendCutoutToLayers.disabled = !loaded || !canAddLayer;
  btnResetCutout.disabled = !loaded;
  cutout.setEnabled(loaded);
  syncLayersActionButtons();
}

async function loadNewFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.");
    return;
  }

  sourceFileName = file.name || "";
  fileNameText.textContent = sourceFileName || "Image loaded.";

  try {
    const loadedImage = await loadImageFromFile(file);
    const limited = constrainImageLongSide(loadedImage, MAX_IMPORT_LONG_SIDE);
    const stretched = await upscaleImageToTargetIfNeeded(limited.image, editor.getInnerCanvasSize?.());
    sourceImage = stretched.image;
    setRetroOrientationLock(null);
    cutoutImage = null;
    editor.setImage(sourceImage);
    await cutout.setImage(sourceImage, sourceFileName);
    cutout.setReferenceBackground(null);
    setCutoutContextAvailability(false);
    setCutoutPreviewBackground("checker");
    setButtonsForImageLoaded(true);
    if (stretched.upscaled) {
      setStatus(`Image loaded and stretched to ${stretched.width}x${stretched.height}.`);
    } else if (limited.resized) {
      setStatus(`Image loaded and resized to ${limited.width}x${limited.height} (4K max).`);
    } else {
      setStatus(`Image loaded: ${sourceFileName}`);
    }
  } catch (err) {
    console.error(err);
    setButtonsForImageLoaded(false);
    setStatus("Could not load image.");
  }
}

async function addFileAsLayer(file, insertAt = "top") {
  if (!file) return;
  if (!layers.getCanAddLayer()) {
    const max = layers.getMaxLayers?.() || 6;
    setStatus(`Layer limit reached (${max}). Delete one to add another.`);
    showLayerLimitPopup();
    return;
  }
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.");
    return;
  }
  try {
    const loadedImage = await loadImageFromFile(file);
    const limited = constrainImageLongSide(loadedImage, MAX_IMPORT_LONG_SIDE);
    const stretched = await upscaleImageToTargetIfNeeded(limited.image, layers.getCanvasSize?.());
    const image = stretched.image;
    const added = layers.addLayerFromImage(image, file.name || "layer", { at: insertAt });
    if (added) {
      setMode("layers");
      if (stretched.upscaled) {
        setStatus(`Layer added and stretched to ${stretched.width}x${stretched.height}.`);
      } else if (limited.resized) {
        setStatus(`Layer added and resized to ${limited.width}x${limited.height} (4K max).`);
      }
    }
  } catch (err) {
    console.error(err);
    setStatus("Could not add image as layer.");
  }
}

function handleImageInputByMode(file, options = {}) {
  if (!file) return;
  const layersInsertAt = options.layersInsertAt === "bottom" ? "bottom" : "top";
  if (currentMode === "layers") {
    addFileAsLayer(file, layersInsertAt);
  } else {
    loadNewFile(file);
  }
}

async function readClipboardImageAsFile() {
  if (!navigator.clipboard?.read) {
    throw new Error("Clipboard image access is not available in this browser.");
  }

  const items = await navigator.clipboard.read();
  for (const item of items) {
    const imageType = item.types.find(type => type.startsWith("image/"));
    if (!imageType) continue;
    const blob = await item.getType(imageType);
    const ext = imageType.split("/")[1] || "png";
    return new File([blob], `clipboard-image.${ext}`, { type: imageType });
  }
  return null;
}

function readImageFileFromPasteItems(items) {
  if (!items) return null;
  for (const item of items) {
    if (!item.type?.startsWith("image/")) continue;
    const blob = item.getAsFile?.();
    if (!blob) continue;
    const ext = item.type.split("/")[1] || "png";
    return new File([blob], `clipboard-image.${ext}`, { type: item.type });
  }
  return null;
}

async function pasteImageFromClipboard() {
  // Try direct paste command path first (some browsers allow this under user gesture).
  const sink = document.createElement("div");
  sink.contentEditable = "true";
  sink.setAttribute("aria-hidden", "true");
  sink.style.position = "fixed";
  sink.style.left = "-9999px";
  sink.style.top = "0";
  sink.style.opacity = "0";
  document.body.appendChild(sink);

  const pastedFile = await new Promise((resolve) => {
    let done = false;
    const finish = (file) => {
      if (done) return;
      done = true;
      resolve(file || null);
    };

    const onPaste = (event) => {
      const file = readImageFileFromPasteItems(event.clipboardData?.items);
      if (file) {
        event.preventDefault();
        finish(file);
      }
    };

    sink.addEventListener("paste", onPaste, { once: true });
    sink.focus();

    try {
      document.execCommand("paste");
    } catch (error) {
      // Ignore and fallback below.
    }

    setTimeout(() => finish(null), 120);
  });

  sink.remove();
  if (pastedFile) return pastedFile;

  // Fallback to Async Clipboard API.
  return readClipboardImageAsFile();
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  handleImageInputByMode(file, { layersInsertAt: pendingLayersInsertAt });
  pendingLayersInsertAt = "top";
  e.target.value = "";
});

pasteImageBtn?.addEventListener("click", async () => {
  try {
    const file = await pasteImageFromClipboard();
    if (!file) {
      setStatus("Clipboard has no image.");
      return;
    }
    handleImageInputByMode(file);
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Could not read image from clipboard.");
  }
});

// Drag-and-drop for both canvases
function attachDropTarget(el, onDropFile, highlightEl = editorDropZone) {
  ["dragenter", "dragover"].forEach(ev => {
    el.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      highlightEl.classList.add("dragover");
    }, { passive: false });
  });
  ["dragleave", "dragend", "drop"].forEach(ev => {
    el.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      highlightEl.classList.remove("dragover");
    }, { passive: false });
  });
  el.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    onDropFile(file);
  }, { passive: false });
}

attachDropTarget(editorDropZone, loadNewFile, editorDropZone);
attachDropTarget(cutoutWrap, loadNewFile, editorDropZone);
attachDropTarget(layersWrap, addFileAsLayer, layersCanvasWrap);

// Paste support (same as BGone)
document.addEventListener("paste", (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      handleImageInputByMode(file);
      e.preventDefault();
      break;
    }
  }
});

modeTabs.forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

moreToggleBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  setMoreMenuOpen(moreMenu?.hidden);
});

moreMenu?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  setMoreMenuOpen(false);
});

definitionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyCanvasDefinition(button.dataset.definition || "sd");
  });
});

canvasFormatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (lockedRetroOrientation) return;
    const nextFormat = button.dataset.canvasFormat || "43";
    if (canvasFormat === nextFormat) return;
    canvasFormat = nextFormat;
    if (canvasFormat === "11") {
      canvasOrientation = "horizontal";
    }
    applyCanvasAspectFromSettings();
  });
});

canvasOrientationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (lockedRetroOrientation) return;
    if (canvasFormat === "11") return;
    const nextOrientation = button.dataset.canvasOrientation || "horizontal";
    if (canvasOrientation === nextOrientation) return;
    canvasOrientation = nextOrientation;
    applyCanvasAspectFromSettings();
  });
});

upscaleLowResToggle?.addEventListener("change", () => {
  upscaleLowResEnabled = !!upscaleLowResToggle.checked;
  localStorage.setItem(UPSCALE_LOW_RES_KEY, upscaleLowResEnabled ? "1" : "0");
});

sidebarCollapseBtn?.addEventListener("click", () => {
  const collapsed = !sidePanel?.classList.contains("is-collapsed");
  setSidebarCollapsed(collapsed);
});

aboutToggleBtn?.addEventListener("click", () => {
  const nextOpen = aboutPanel?.hidden;
  setAboutPanelOpen(nextOpen, { markSeen: true });
  if (nextOpen) setMoreMenuOpen(false);
});

aboutStartBtn?.addEventListener("click", () => {
  setAboutPanelOpen(false, { markSeen: true });
  setMoreMenuOpen(false);
});

logoBoltBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  triggerLogoBoltSparks();
});

btnQuickUpload?.addEventListener("click", () => {
  pendingLayersInsertAt = "top";
  fileInput.click();
});

btnQuickPaste?.addEventListener("click", () => {
  pasteImageBtn?.click();
});

btnQuickDownload?.addEventListener("click", () => {
  downloadEditorBtn.click();
});

btnQuickAddComposition?.addEventListener("click", () => {
  btnAddCompositionLayer?.click();
});

btnQuickParallax?.addEventListener("click", () => {
  if (!layers?.getHasLayers?.() || layers.getLayerCount() < 2) {
    setStatus("Parallax needs at least 2 layers.");
    return;
  }
  setParallaxDefaults();
  setParallaxPanelOpen(true);
  btnExportParallaxGif?.click();
});

btnResetCutout.addEventListener("click", () => {
  cutout.resetMask();
});

resetEditBtn.addEventListener("click", () => {
  if (!editor.getHasImage()) return;
  editor.resetEditorState();
  if (lockedRetroOrientation) {
    setCanvasAspectPreset(lockedRetroOrientation);
  } else {
    applyCanvasAspectFromSettings();
  }
  setStatus("Retro settings reset.");
});

btnApplyCutout.addEventListener("click", async () => {
  if (!sourceImage) return;
  try {
    setStatus("Generating cutout…");
    const blob = await cutout.exportCutoutBlob();
    cutoutImage = await loadImageFromBlob(blob);
    editor.setImage(cutoutImage);
    setMode("edit");
    setStatus("Cutout applied. Continue in Retro or download PNG.");
  } catch (err) {
    console.error(err);
    setStatus("Could not apply cutout.");
  }
});

sendToLayersBtn.addEventListener("click", async () => {
  if (!editor.getHasImage()) return;
  if (!layers.getCanAddLayer()) {
    const max = layers.getMaxLayers?.() || 6;
    setStatus(`Layer limit reached (${max}). Delete one to add another.`);
    showLayerLimitPopup();
    return;
  }
  try {
    setStatus("Preparing edited image as new layer...");
    const blob = await editor.exportInnerPngBlob();
    const editedImage = await loadImageFromBlob(blob);
    const added = layers.addLayerFromImage(editedImage, `${(sourceFileName || "retrocut").replace(/\.[^.]+$/, "")}-edit`);
    if (added) setMode("layers");
  } catch (err) {
    console.error(err);
    setStatus("Could not send image to Layers.");
  }
});

btnSendCutoutToLayers.addEventListener("click", async () => {
  if (!sourceImage) return;
  if (!layers.getCanAddLayer()) {
    const max = layers.getMaxLayers?.() || 6;
    setStatus(`Layer limit reached (${max}). Delete one to add another.`);
    showLayerLimitPopup();
    return;
  }
  try {
    setStatus("Preparing cutout as new layer...");
    const blob = await cutout.exportCutoutBlob();
    const image = await loadImageFromBlob(blob);
    const added = layers.addLayerFromImage(image, `${(sourceFileName || "retrocut").replace(/\.[^.]+$/, "")}-cutout`);
    if (added) setMode("layers");
  } catch (err) {
    console.error(err);
    setStatus("Could not send cutout to Layers.");
  }
});

btnLayersAdd?.addEventListener("click", () => {
  setMode("layers");
  pendingLayersInsertAt = "top";
  fileInput.click();
});

btnLayersAddBottom?.addEventListener("click", () => {
  setMode("layers");
  pendingLayersInsertAt = "bottom";
  fileInput.click();
});

btnLayersHideAll?.addEventListener("click", () => {
  const result = layers.toggleAllLayersVisibility?.() || { changed: false, hiddenAll: false };
  setMode("layers");
  if (!result.changed) {
    setStatus("No layer visibility changes.");
    return;
  }
  setStatus(result.hiddenAll ? "All layers hidden." : "All layers shown.");
});

btnAddCompositionLayer?.addEventListener("click", async () => {
  if (!layers.getHasLayers()) return;
  if (!layers.getCanAddLayer()) {
    const max = layers.getMaxLayers?.() || 6;
    setStatus(`Layer limit reached (${max}). Delete one to add another.`);
    showLayerLimitPopup();
    return;
  }
  try {
    setStatus("Creating composition layer...");
    const blob = await layers.exportPngBlob();
    const image = await loadImageFromBlob(blob);
    const added = layers.addLayerFromImage(image, "composition");
    if (added) {
      setMode("layers");
      setStatus("Composition added as new layer.");
    }
  } catch (err) {
    console.error(err);
    setStatus("Could not add composition as layer.");
  }
});

async function importLayersCompositionToRetro() {
  if (!layers.getHasLayers()) return;
  try {
    setStatus("Preparing composition for Retro...");
    const blob = await layers.exportPngBlob();
    const image = await loadImageFromBlob(blob);
    const layersRatio = layers.getRatio?.() || "landscape43";
    setRetroOrientationLock(editorPresetFromLayersRatio(layersRatio));
    editor.setImage(image);
    sourceImage = image;
    sourceFileName = "layers-composition.png";
    fileNameText.textContent = sourceFileName;
    setButtonsForImageLoaded(true);
    setMode("edit");
    setStatus("Composition sent to Retro.");
  } catch (err) {
    console.error(err);
    setStatus("Could not send composition to Retro.");
  }
}

btnImportLayersComposition?.addEventListener("click", importLayersCompositionToRetro);

btnDownloadLayersZip.addEventListener("click", async () => {
  if (!layers.getHasLayers()) return;
  try {
    setStatus("Preparing layers ZIP...");
    const zipBlob = await layers.exportLayersZipBlob();
    downloadBlob(zipBlob, "retrocut-layers.zip");
    setStatus("Downloaded layers ZIP.");
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Could not export layers ZIP.");
  }
});

if (parallaxDuration && parallaxDurationValue) {
  parallaxDuration.addEventListener("input", syncParallaxDurationLabel);
  syncParallaxDurationLabel();
}

if (parallaxIntensity && parallaxIntensityValue) {
  parallaxIntensity.addEventListener("input", syncParallaxIntensityLabel);
  syncParallaxIntensityLabel();
}

btnExportParallaxGif?.addEventListener("click", async () => {
  if (isParallaxExporting) return;
  if (!layers.getHasLayers()) return;
  if (layers.getLayerCount() < 2) {
    setStatus("Parallax needs at least 2 layers.");
    return;
  }
  const durationSec = Number(parallaxDuration?.value || 3);
  const intensity = Number(parallaxIntensity?.value || 50) / 100;
  const qualityPreset = Number(parallaxQualityPreset?.value || 50);
  const fps = Number(parallaxFps?.value || 15);
  const loopMode = parallaxLoopMode?.value === "linear" ? "linear" : "pingpong";
  const motionType = parallaxMotionType?.value || "zoom";
  const lockTopLayer = !!parallaxLockTop?.checked;
  let lastProgressBucket = -1;
  try {
    isParallaxExporting = true;
    setStatus("Rendering parallax GIF...");
    btnExportParallaxGif.disabled = true;
    setParallaxActionLabel("Preparing...");
    const gifBlob = await layers.exportParallaxGifBlob({
      durationSec,
      intensity,
      qualityPreset,
      fps,
      loopMode,
      motionType,
      lockTopLayer,
      onProgress: ({ stage, progress }) => {
        const bucket = Math.floor((progress * 100) / 5) * 5;
        if (bucket === lastProgressBucket) return;
        lastProgressBucket = bucket;
        if (stage === "render") {
          setStatus(`Rendering frames... ${Math.round(progress * 100)}%`);
          setParallaxActionLabel(`Rendering... ${Math.round(progress * 100)}%`);
        } else {
          setStatus(`Encoding GIF... ${Math.round(progress * 100)}%`);
          setParallaxActionLabel(`Encoding... ${Math.round(progress * 100)}%`);
        }
      }
    });
    openParallaxPreview(gifBlob);
    setStatus("Parallax animation ready.");
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Could not export parallax GIF.");
  } finally {
    isParallaxExporting = false;
    setParallaxActionLabel(PARALLAX_EXPORT_LABEL);
    syncLayersActionButtons();
  }
});

btnSaveParallaxGif?.addEventListener("click", () => {
  if (!parallaxPreviewBlob) return;
  downloadBlob(parallaxPreviewBlob, "retrocut-parallax.gif");
});

btnCloseParallaxPreview?.addEventListener("click", () => {
  closeParallaxPreview();
});

parallaxPreviewOverlay?.addEventListener("click", (event) => {
  if (event.target === parallaxPreviewOverlay) closeParallaxPreview();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMoreMenuOpen(false);
  if (event.key === "Escape" && parallaxPreviewOverlay && !parallaxPreviewOverlay.hidden) {
    closeParallaxPreview();
  }
});

downloadEditorBtn.addEventListener("click", async () => {
  if (currentMode === "layers") {
    if (!layers.getHasLayers()) return;
    try {
      setStatus("Preparing layered export…");
      const blob = await layers.exportPngBlob();
      downloadBlob(blob, "retrocut-layers.png");
      setStatus("Downloaded layered PNG.");
    } catch (err) {
      console.error(err);
      setStatus("Could not export layers.");
    }
    return;
  }

  if (!editor.getHasImage()) return;
  try {
    setStatus("Preparing export…");
    const blob = await editor.exportInnerPngBlob();
    const base = (sourceFileName || "retrocut").replace(/\.[^.]+$/, "");
    downloadBlob(blob, `${base}-retrocut.png`);
    setStatus("Downloaded PNG.");
  } catch (err) {
    console.error(err);
    setStatus("Could not export PNG.");
  }
});

// Init
canvasDefinition = readCanvasDefinition();
upscaleLowResEnabled = localStorage.getItem(UPSCALE_LOW_RES_KEY) === "1";
if (upscaleLowResToggle) upscaleLowResToggle.checked = upscaleLowResEnabled;
applyCanvasDefinition(canvasDefinition, { persist: false });
applyCanvasAspectFromSettings();
syncCanvasSettingsUI();
setSidebarCollapsed(true);
setMoreMenuOpen(false);
const hasSeenAbout = localStorage.getItem(ABOUT_SEEN_KEY) === "1";
setAboutPanelOpen(!hasSeenAbout, { markSeen: !hasSeenAbout });
setParallaxDefaults();
setButtonsForImageLoaded(false);
cutoutBgButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setCutoutPreviewBackground(btn.dataset.cutoutBg || "checker");
  });
});
setCutoutContextAvailability(false);
setCutoutPreviewBackground("checker");
setMode("layers");
