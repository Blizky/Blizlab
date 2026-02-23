import { createEditor } from "./modules/editor.js?v=20260221d";
import { createCutoutTool } from "./modules/cutout.js?v=20260221d";
import { createLayersTool } from "./modules/layers.js?v=20260221d";
import { canvasToBlob, constrainImageLongSide, downloadBlob, loadImageFromBlob, loadImageFromFile } from "./modules/shared.js?v=20260221d";
import { APP_VERSION } from "./modules/version.js";

const statusPill = document.getElementById("statusPill");

// Shared image controls
const fileInput = document.getElementById("fileInput");
const projectFileInput = document.getElementById("projectFileInput");
const pasteImageBtn = document.getElementById("pasteImageBtn");
const fileNameText = document.getElementById("fileNameText");
const projectSectionTitle = document.getElementById("projectSectionTitle");
const btnSaveProject = document.getElementById("btnSaveProject");
const btnOpenProject = document.getElementById("btnOpenProject");
const exportMenuWrap = document.getElementById("exportMenuWrap");
const downloadEditorBtn = document.getElementById("downloadEditorBtn");
const sidePanel = document.getElementById("sidePanel");
const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
const btnQuickUpload = document.getElementById("btnQuickUpload");
const btnQuickPaste = document.getElementById("btnQuickPaste");
const btnQuickDownload = document.getElementById("btnQuickDownload");
const btnQuickMergeVisibleLayers = document.getElementById("btnQuickMergeVisibleLayers");
const btnQuickParallax = document.getElementById("btnQuickParallax");
const canvasFormatButtons = Array.from(document.querySelectorAll("#canvasFormatChips .chip-btn"));
const canvasOrientationButtons = Array.from(document.querySelectorAll("#canvasOrientationChips .chip-btn"));
const definitionButtons = Array.from(document.querySelectorAll("#definitionChips .chip-btn"));
const upscaleLowResToggle = document.getElementById("upscaleLowResToggle");
const downscaleImportsToggle = document.getElementById("downscaleImportsToggle");
const aboutPanel = document.getElementById("appAboutPanel");
const aboutToggleBtn = document.getElementById("aboutToggleBtn");
const aboutStartBtn = document.getElementById("aboutStartBtn");
const moreToggleBtn = document.getElementById("moreToggleBtn");
const moreMenu = document.getElementById("moreMenu");
const settingsVersionText = document.getElementById("settingsVersionText");
const logoBoltBtn = document.getElementById("logoBoltBtn");
const logoSparks = document.getElementById("logoSparks");
const heroCarousel = document.getElementById("heroCarousel");
const heroScenesTrack = document.getElementById("heroScenesTrack");
const heroPrevBtn = document.getElementById("heroPrevBtn");
const heroNextBtn = document.getElementById("heroNextBtn");
const heroSceneDots = Array.from(document.querySelectorAll("#heroSceneDots [data-hero-scene]"));
const mobileBlocker = document.getElementById("mobileBlocker");
const btnMobileBlockerContinue = document.getElementById("btnMobileBlockerContinue");

// Mode UI
const modeTabs = Array.from(document.querySelectorAll(".mode-tab"));
const editPanel = document.getElementById("editPanel");
const cutoutPanel = document.getElementById("cutoutPanel");
const layersPanel = document.getElementById("layersPanel");
const editorDropZone = document.getElementById("editorDropZone");
const cutoutWrap = document.getElementById("cutoutWrap");
const layersWrap = document.getElementById("layersWrap");
const canvasStack = document.querySelector(".canvas-stack");
const imagestudioMain = document.querySelector(".imagestudio-main");
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
const btnMergeVisibleLayers = document.getElementById("btnMergeVisibleLayers");
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
const DOWNSCALE_IMPORTS_KEY = "retrocutDownscaleImports";
const ABOUT_SEEN_KEY = "retrocutAboutSeen";
const MOBILE_BLOCKER_DISMISSED_KEY = "retrocutMobileBlockerDismissed";
const CANVAS_DEFINITION_SET = new Set(["sd", "hd", "4k"]);
const PROJECT_SCHEMA_VERSION = 1;
const PROJECT_FILE_EXT = ".blz";
const PROJECT_TITLE_FALLBACK = "IMAGE";
const PROJECT_TITLE_MAX = 28;
const PROJECT_OPEN_REQUEST_PARAM = "openProjectRequest";
const PROJECT_OPEN_READY_MSG = "blizlab-open-project-ready";
const PROJECT_OPEN_PAYLOAD_MSG = "blizlab-open-project-payload";
const PROJECT_OPEN_ACK_MSG = "blizlab-open-project-ack";
const PROJECT_OPEN_HANDOFF_TIMEOUT_MS = 15000;
const CANVAS_DEFINITION_SCALES = {
  sd: 0.5,
  hd: 1,
  "4k": 2
};
const IMPORT_TARGET_DEFINITION = {
  sd: "hd",
  hd: "4k",
  "4k": "4k"
};
const MAX_IMPORT_LONG_SIDE = 4096;
const HERO_AUTOPLAY_MS = 6500;
const HERO_PARALLAX_STEP_BACK = 72;
const HERO_PARALLAX_STEP_MID = 146;
const HERO_PARALLAX_STEP_FRONT = 220;
const ABOUT_CLOSE_ANIM_MS = 280;
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
let downscaleImportsEnabled = true;
let pendingLayersInsertAt = "top";
let currentProjectName = "";
let heroSceneIndex = 0;
let heroAutoplayTimer = 0;
let aboutCloseTimer = 0;
let incomingProjectOpenRequestId = readIncomingProjectOpenRequestId();

function setStatus(text) {
  if (statusPill) statusPill.textContent = text;
}

function renderSettingsVersion() {
  if (!settingsVersionText) return;
  settingsVersionText.textContent = `Version ${APP_VERSION}`;
}

function sanitizeProjectName(rawName = "") {
  const cleaned = String(rawName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "blizlab-project";
}

function buildProjectDownloadName(projectName = "") {
  const safe = sanitizeProjectName(projectName).replace(/\s+/g, "_");
  return `${safe}${PROJECT_FILE_EXT}`;
}

function getProjectNameFromFilename(filename = "") {
  const base = String(filename || "").replace(/\.[^.]+$/, "");
  return sanitizeProjectName(base);
}

function formatProjectTitle(name = "") {
  const trimmed = String(name || "").trim();
  if (!trimmed) return PROJECT_TITLE_FALLBACK;
  if (trimmed.length <= PROJECT_TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, PROJECT_TITLE_MAX - 1)}…`;
}

function updateProjectSectionTitle() {
  if (!projectSectionTitle) return;
  if (!currentProjectName) {
    projectSectionTitle.textContent = PROJECT_TITLE_FALLBACK;
    projectSectionTitle.title = PROJECT_TITLE_FALLBACK;
    return;
  }
  projectSectionTitle.textContent = formatProjectTitle(currentProjectName);
  projectSectionTitle.title = currentProjectName;
}

function setCurrentProjectName(name = "") {
  currentProjectName = name ? sanitizeProjectName(name) : "";
  updateProjectSectionTitle();
}

function buildProjectOpenRequestId() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${suffix}`;
}

function readIncomingProjectOpenRequestId() {
  const params = new URLSearchParams(window.location.search || "");
  return String(params.get(PROJECT_OPEN_REQUEST_PARAM) || "").trim();
}

function clearIncomingProjectOpenRequestParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PROJECT_OPEN_REQUEST_PARAM)) return;
  url.searchParams.delete(PROJECT_OPEN_REQUEST_PARAM);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, "", nextUrl);
}

function buildProjectOpenWindowUrl(requestId) {
  const url = new URL(window.location.href);
  url.searchParams.set(PROJECT_OPEN_REQUEST_PARAM, requestId);
  return url.toString();
}

function dismissMobileBlocker({ persist = true } = {}) {
  if (!mobileBlocker) return;
  mobileBlocker.hidden = true;
  mobileBlocker.setAttribute("aria-hidden", "true");
  if (persist) {
    try {
      sessionStorage.setItem(MOBILE_BLOCKER_DISMISSED_KEY, "1");
    } catch (_) {
      // Ignore storage failures (private mode / blocked storage).
    }
  }
}

function initMobileBlocker() {
  if (!mobileBlocker) return;
  const dismissed = (() => {
    try {
      return sessionStorage.getItem(MOBILE_BLOCKER_DISMISSED_KEY) === "1";
    } catch (_) {
      return false;
    }
  })();
  if (dismissed) dismissMobileBlocker({ persist: false });
}

async function imageLikeToPngBlob(imageLike) {
  const source = imageLike;
  if (!source) return null;
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

async function loadImageFromZipAsset(zip, path) {
  if (!zip || !path) return null;
  const entry = zip.file(path);
  if (!entry) return null;
  const blob = await entry.async("blob");
  return loadImageFromBlob(blob);
}

async function openProjectWithLayerAwareBehavior(file) {
  if (!file) return;
  const hasExistingLayers = !!layers?.getHasLayers?.();
  if (!hasExistingLayers) {
    await openProjectFromBlz(file);
    return;
  }
  const openedInNewWindow = await openProjectInNewWindow(file);
  if (openedInNewWindow) {
    setStatus(`Project opened in new window: ${getProjectNameFromFilename(file.name)}.`);
    return;
  }
  setStatus("Could not open a new window. Opening project here...");
  await openProjectFromBlz(file);
}

async function openProjectInNewWindow(file) {
  if (!file) return false;
  const requestId = buildProjectOpenRequestId();
  const targetUrl = buildProjectOpenWindowUrl(requestId);
  let childWindow = null;
  let payloadBuffer = null;
  let childReady = false;
  let payloadSent = false;
  let settled = false;
  let closePollId = 0;
  let timeoutId = 0;

  return new Promise((resolve) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (closePollId) {
        window.clearInterval(closePollId);
        closePollId = 0;
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = 0;
      }
    };
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(!!ok);
    };
    const trySendPayload = () => {
      if (!childWindow || childWindow.closed || !childReady || !payloadBuffer || payloadSent) return;
      payloadSent = true;
      try {
        childWindow.postMessage({
          type: PROJECT_OPEN_PAYLOAD_MSG,
          requestId,
          fileName: file.name || "blizlab-project.blz",
          mimeType: file.type || "application/zip",
          buffer: payloadBuffer
        }, window.location.origin, [payloadBuffer]);
        payloadBuffer = null;
      } catch (error) {
        console.error(error);
        finish(false);
      }
    };
    const onMessage = (event) => {
      if (!childWindow || event.source !== childWindow) return;
      if (event.origin !== window.location.origin) return;
      const data = event.data || {};
      if (data.requestId !== requestId) return;
      if (data.type === PROJECT_OPEN_READY_MSG) {
        childReady = true;
        trySendPayload();
        return;
      }
      if (data.type === PROJECT_OPEN_ACK_MSG) {
        finish(data.ok !== false);
      }
    };

    window.addEventListener("message", onMessage);
    childWindow = window.open(targetUrl, "_blank");
    if (!childWindow) {
      finish(false);
      return;
    }

    setStatus("Opening project in new window...");
    closePollId = window.setInterval(() => {
      if (!childWindow || childWindow.closed) {
        finish(false);
      }
    }, 450);
    timeoutId = window.setTimeout(() => {
      finish(false);
    }, PROJECT_OPEN_HANDOFF_TIMEOUT_MS);

    file.arrayBuffer()
      .then((buffer) => {
        if (settled) return;
        payloadBuffer = buffer;
        trySendPayload();
      })
      .catch((error) => {
        console.error(error);
        finish(false);
      });
  });
}

function announceProjectOpenReadyIfNeeded() {
  if (!incomingProjectOpenRequestId) return;
  clearIncomingProjectOpenRequestParam();
  if (!window.opener || window.opener === window) return;
  try {
    window.opener.postMessage({
      type: PROJECT_OPEN_READY_MSG,
      requestId: incomingProjectOpenRequestId
    }, window.location.origin);
  } catch (error) {
    console.error(error);
  }
}

function postProjectOpenAck(ok) {
  if (!incomingProjectOpenRequestId) return;
  if (!window.opener || window.opener === window) return;
  try {
    window.opener.postMessage({
      type: PROJECT_OPEN_ACK_MSG,
      requestId: incomingProjectOpenRequestId,
      ok: !!ok
    }, window.location.origin);
  } catch (error) {
    console.error(error);
  }
}

async function handleIncomingProjectOpenPayload(event) {
  if (!incomingProjectOpenRequestId) return;
  if (event.origin !== window.location.origin) return;
  if (!window.opener || event.source !== window.opener) return;
  const data = event.data || {};
  if (data.type !== PROJECT_OPEN_PAYLOAD_MSG) return;
  if (data.requestId !== incomingProjectOpenRequestId) return;
  const rawBuffer = data.buffer;
  const fileBuffer = rawBuffer instanceof ArrayBuffer
    ? rawBuffer
    : (ArrayBuffer.isView(rawBuffer) ? rawBuffer.buffer : null);
  if (!fileBuffer) {
    postProjectOpenAck(false);
    incomingProjectOpenRequestId = "";
    return;
  }
  const incomingFile = new File(
    [fileBuffer],
    String(data.fileName || "blizlab-project.blz"),
    { type: String(data.mimeType || "application/zip") }
  );
  const loaded = await openProjectFromBlz(incomingFile);
  postProjectOpenAck(loaded);
  incomingProjectOpenRequestId = "";
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

function readDownscaleImportsSetting() {
  const stored = localStorage.getItem(DOWNSCALE_IMPORTS_KEY);
  if (stored === "0") return false;
  return true;
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
  window.requestAnimationFrame(() => {
    layers?.refreshLayout?.();
  });
  window.setTimeout(() => {
    layers?.refreshLayout?.();
  }, 230);
}

function stopHeroAutoplay() {
  if (heroAutoplayTimer) {
    window.clearInterval(heroAutoplayTimer);
    heroAutoplayTimer = 0;
  }
}

function getHeroSceneCount() {
  if (heroSceneDots.length > 0) return heroSceneDots.length;
  return heroScenesTrack?.children?.length || 0;
}

function setHeroScene(index, { immediate = false } = {}) {
  if (!heroCarousel) return;
  const sceneCount = getHeroSceneCount();
  if (sceneCount < 1) return;
  const nextIndex = ((Math.round(index) % sceneCount) + sceneCount) % sceneCount;
  heroSceneIndex = nextIndex;
  if (immediate) {
    heroCarousel.classList.add("no-anim");
  } else {
    heroCarousel.classList.remove("no-anim");
  }
  heroCarousel.style.setProperty("--hero-scene-index", String(nextIndex));
  heroCarousel.style.setProperty("--hero-back-x", `${-nextIndex * HERO_PARALLAX_STEP_BACK}px`);
  heroCarousel.style.setProperty("--hero-mid-x", `${-nextIndex * HERO_PARALLAX_STEP_MID}px`);
  heroCarousel.style.setProperty("--hero-front-x", `${-nextIndex * HERO_PARALLAX_STEP_FRONT}px`);
  heroSceneDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === nextIndex;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  if (immediate) {
    window.requestAnimationFrame(() => {
      heroCarousel.classList.remove("no-anim");
    });
  }
}

function startHeroAutoplay() {
  if (!heroCarousel || getHeroSceneCount() < 2) return;
  stopHeroAutoplay();
  heroAutoplayTimer = window.setInterval(() => {
    if (aboutPanel?.hidden) return;
    setHeroScene(heroSceneIndex + 1);
  }, HERO_AUTOPLAY_MS);
}

function getAboutCloseDuration() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return 0;
  return ABOUT_CLOSE_ANIM_MS;
}

function clearAboutCloseTimer() {
  if (!aboutCloseTimer) return;
  window.clearTimeout(aboutCloseTimer);
  aboutCloseTimer = 0;
}

function setAboutPanelOpen(open, { markSeen = false } = {}) {
  if (!aboutPanel || !aboutToggleBtn) return;
  const isOpen = !!open;
  if (isOpen) {
    clearAboutCloseTimer();
    aboutPanel.classList.remove("is-closing");
    aboutPanel.hidden = false;
    document.body.classList.remove("about-closed");
    aboutToggleBtn.setAttribute("aria-expanded", "true");
    startHeroAutoplay();
  } else {
    document.body.classList.add("about-closed");
    aboutToggleBtn.setAttribute("aria-expanded", "false");
    stopHeroAutoplay();
    if (!aboutPanel.hidden) {
      clearAboutCloseTimer();
      aboutPanel.classList.add("is-closing");
      const closeDuration = getAboutCloseDuration();
      aboutCloseTimer = window.setTimeout(() => {
        aboutPanel.hidden = true;
        aboutPanel.classList.remove("is-closing");
        aboutCloseTimer = 0;
      }, closeDuration + 40);
    } else {
      aboutPanel.classList.remove("is-closing");
    }
  }
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

function getImportTargetDefinition() {
  return IMPORT_TARGET_DEFINITION[canvasDefinition] || canvasDefinition;
}

function getImportTargetLabel() {
  const definition = getImportTargetDefinition();
  return definition === "4k" ? "4K" : definition.toUpperCase();
}

function getImportTargetSize(baseTargetSize) {
  if (!baseTargetSize) return null;
  const baseW = Math.max(1, Math.round(Number(baseTargetSize.width) || 1));
  const baseH = Math.max(1, Math.round(Number(baseTargetSize.height) || 1));
  const selectedScale = CANVAS_DEFINITION_SCALES[canvasDefinition] || CANVAS_DEFINITION_SCALES.hd;
  const importDefinition = getImportTargetDefinition();
  const importScale = CANVAS_DEFINITION_SCALES[importDefinition] || selectedScale;
  const boost = Math.max(1, importScale / selectedScale);
  return {
    width: Math.max(1, Math.round(baseW * boost)),
    height: Math.max(1, Math.round(baseH * boost))
  };
}

async function downscaleImageToTargetIfNeeded(image, targetSize) {
  if (!downscaleImportsEnabled || !targetSize) {
    return { image, downscaled: false, width: image.width, height: image.height };
  }

  const targetW = Math.max(1, Math.round(Number(targetSize.width) || 1));
  const targetH = Math.max(1, Math.round(Number(targetSize.height) || 1));
  const sourceW = Math.max(1, image.naturalWidth || image.width);
  const sourceH = Math.max(1, image.naturalHeight || image.height);
  const scaleFactor = Math.min(targetW / sourceW, targetH / sourceH, 1);
  if (!Number.isFinite(scaleFactor) || scaleFactor >= 1) {
    return { image, downscaled: false, width: sourceW, height: sourceH };
  }

  const outW = Math.max(1, Math.round(sourceW * scaleFactor));
  const outH = Math.max(1, Math.round(sourceH * scaleFactor));
  const work = document.createElement("canvas");
  work.width = outW;
  work.height = outH;
  const wctx = work.getContext("2d");
  wctx.imageSmoothingEnabled = true;
  wctx.imageSmoothingQuality = "high";
  wctx.drawImage(image, 0, 0, outW, outH);
  const blob = await canvasToBlob(work, "image/png");
  const downscaled = await loadImageFromBlob(blob);
  return { image: downscaled, downscaled: true, width: outW, height: outH };
}

async function normalizeImportedImage(image, targetSize) {
  const limited = constrainImageLongSide(image, MAX_IMPORT_LONG_SIDE);
  const importTarget = getImportTargetSize(targetSize);
  const downscaled = await downscaleImageToTargetIfNeeded(limited.image, importTarget);
  const stretched = await upscaleImageToTargetIfNeeded(downscaled.image, importTarget);
  return {
    image: stretched.image,
    limited,
    downscaled,
    stretched
  };
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

function getCurrentProjectSettings() {
  return {
    canvasDefinition,
    canvasFormat,
    canvasOrientation,
    lockedRetroOrientation,
    upscaleLowResEnabled,
    downscaleImportsEnabled,
    cutoutBgMode,
    currentMode
  };
}

function applyProjectSettings(settings = {}) {
  const nextCanvasDefinition = CANVAS_DEFINITION_SET.has(settings.canvasDefinition)
    ? settings.canvasDefinition
    : canvasDefinition;
  applyCanvasDefinition(nextCanvasDefinition);

  const nextFormat = ["11", "43", "45", "169"].includes(settings.canvasFormat)
    ? settings.canvasFormat
    : canvasFormat;
  const nextOrientation = ["horizontal", "vertical"].includes(settings.canvasOrientation)
    ? settings.canvasOrientation
    : canvasOrientation;
  canvasFormat = nextFormat;
  canvasOrientation = nextFormat === "11" ? "horizontal" : nextOrientation;
  applyCanvasAspectFromSettings();

  upscaleLowResEnabled = settings.upscaleLowResEnabled !== false;
  if (upscaleLowResToggle) upscaleLowResToggle.checked = upscaleLowResEnabled;
  localStorage.setItem(UPSCALE_LOW_RES_KEY, upscaleLowResEnabled ? "1" : "0");

  downscaleImportsEnabled = settings.downscaleImportsEnabled !== false;
  if (downscaleImportsToggle) downscaleImportsToggle.checked = downscaleImportsEnabled;
  localStorage.setItem(DOWNSCALE_IMPORTS_KEY, downscaleImportsEnabled ? "1" : "0");

  setRetroOrientationLock(settings.lockedRetroOrientation || null);
  cutoutBgMode = ["checker", "white", "black", "context"].includes(settings.cutoutBgMode)
    ? settings.cutoutBgMode
    : "checker";
  setCutoutContextAvailability(cutoutHasContext);
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
  if (imagestudioMain) {
    imagestudioMain.classList.toggle("is-layers", inLayers);
  }
  if (inLayers) {
    window.requestAnimationFrame(() => {
      layers?.refreshLayout?.();
    });
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
  const visibleLayerCount = layers.getVisibleLayerCount?.() || 0;
  const maxLayers = layers.getMaxLayers?.() || 5;
  const canParallax = layerCount >= 2;
  const canMergeVisible = visibleLayerCount >= 2;
  const canAddLayer = layers.getCanAddLayer();
  if (layersCountText) layersCountText.textContent = `${layerCount}/${maxLayers}`;
  if (btnMergeVisibleLayers) {
    btnMergeVisibleLayers.disabled = !canMergeVisible;
    btnMergeVisibleLayers.title = canMergeVisible
      ? "Merge visible layers into one layer"
      : "Need at least 2 visible layers";
  }
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
  if (btnQuickMergeVisibleLayers) btnQuickMergeVisibleLayers.disabled = !!btnMergeVisibleLayers?.disabled;
  if (btnQuickParallax) btnQuickParallax.disabled = isParallaxExporting || !canParallax;
  if (currentMode === "edit" && sendToLayersBtn) {
    sendToLayersBtn.disabled = !editor.getHasImage() || !canAddLayer;
  }
  if (currentMode === "cutout" && btnSendCutoutToLayers) {
    btnSendCutoutToLayers.disabled = !sourceImage || !canAddLayer;
  }
}

function showLayerLimitPopup() {
  const max = layers?.getMaxLayers?.() || 5;
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
  setCurrentProjectName("");
  fileNameText.textContent = sourceFileName || "Image loaded.";

  try {
    const loadedImage = await loadImageFromFile(file);
    const normalized = await normalizeImportedImage(loadedImage, editor.getInnerCanvasSize?.());
    sourceImage = normalized.image;
    setRetroOrientationLock(null);
    cutoutImage = null;
    editor.setImage(sourceImage);
    await cutout.setImage(sourceImage, sourceFileName);
    cutout.setReferenceBackground(null);
    setCutoutContextAvailability(false);
    setCutoutPreviewBackground("checker");
    setButtonsForImageLoaded(true);
    if (normalized.stretched.upscaled) {
      setStatus(`Image loaded and stretched to ${normalized.stretched.width}x${normalized.stretched.height}.`);
    } else if (normalized.downscaled.downscaled) {
      setStatus(`Image loaded and downscaled to ${normalized.downscaled.width}x${normalized.downscaled.height} (${getImportTargetLabel()} import target).`);
    } else if (normalized.limited.resized) {
      setStatus(`Image loaded and resized to ${normalized.limited.width}x${normalized.limited.height} (4K max).`);
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
    const max = layers.getMaxLayers?.() || 5;
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
    const normalized = await normalizeImportedImage(loadedImage, layers.getCanvasSize?.());
    const image = normalized.image;
    const added = layers.addLayerFromImage(image, file.name || "layer", { at: insertAt });
    if (added) {
      setMode("layers");
      if (normalized.stretched.upscaled) {
        setStatus(`Layer added and stretched to ${normalized.stretched.width}x${normalized.stretched.height}.`);
      } else if (normalized.downscaled.downscaled) {
        setStatus(`Layer added and downscaled to ${normalized.downscaled.width}x${normalized.downscaled.height} (${getImportTargetLabel()} import target).`);
      } else if (normalized.limited.resized) {
        setStatus(`Layer added and resized to ${normalized.limited.width}x${normalized.limited.height} (4K max).`);
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

projectFileInput?.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  await openProjectWithLayerAwareBehavior(file);
  e.target.value = "";
});
window.addEventListener("message", (event) => {
  handleIncomingProjectOpenPayload(event).catch((error) => {
    console.error(error);
    postProjectOpenAck(false);
    incomingProjectOpenRequestId = "";
    setStatus("Could not open project.");
  });
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

downscaleImportsToggle?.addEventListener("change", () => {
  downscaleImportsEnabled = !!downscaleImportsToggle.checked;
  localStorage.setItem(DOWNSCALE_IMPORTS_KEY, downscaleImportsEnabled ? "1" : "0");
});

sidebarCollapseBtn?.addEventListener("click", () => {
  const collapsed = !sidePanel?.classList.contains("is-collapsed");
  setSidebarCollapsed(collapsed);
});

aboutToggleBtn?.addEventListener("click", () => {
  const nextOpen = aboutPanel?.hidden || aboutPanel?.classList.contains("is-closing");
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

heroPrevBtn?.addEventListener("click", () => {
  setHeroScene(heroSceneIndex - 1);
  startHeroAutoplay();
});

heroNextBtn?.addEventListener("click", () => {
  setHeroScene(heroSceneIndex + 1);
  startHeroAutoplay();
});

heroSceneDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = Number(dot.dataset.heroScene);
    if (!Number.isFinite(index)) return;
    setHeroScene(index);
    startHeroAutoplay();
  });
});

heroCarousel?.addEventListener("pointerenter", () => {
  stopHeroAutoplay();
});

heroCarousel?.addEventListener("pointerleave", () => {
  if (!aboutPanel?.hidden) startHeroAutoplay();
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

btnQuickMergeVisibleLayers?.addEventListener("click", () => {
  btnMergeVisibleLayers?.click();
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

btnSaveProject?.addEventListener("click", () => {
  saveProjectToBlz();
});

btnOpenProject?.addEventListener("click", () => {
  projectFileInput?.click();
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
    const max = layers.getMaxLayers?.() || 5;
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
    const max = layers.getMaxLayers?.() || 5;
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

btnMergeVisibleLayers?.addEventListener("click", async () => {
  const visibleLayerCount = layers.getVisibleLayerCount?.() || 0;
  if (visibleLayerCount < 2) {
    setStatus("Need at least 2 visible layers to merge.");
    return;
  }
  const confirmed = window.confirm(
    `Merge ${visibleLayerCount} visible layers into one layer? The original visible layers will be removed.`
  );
  if (!confirmed) return;
  try {
    setStatus("Merging visible layers...");
    const result = await layers.mergeVisibleLayers?.("Merged");
    if (!result?.merged) {
      setStatus("Need at least 2 visible layers to merge.");
      return;
    }
    setMode("layers");
    setStatus(`Merged ${result.mergedCount} visible layers.`);
  } catch (err) {
    console.error(err);
    setStatus("Could not merge visible layers.");
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

async function saveProjectToBlz() {
  const ZipCtor = globalThis.JSZip;
  if (!ZipCtor) {
    setStatus("ZIP library not loaded.");
    return;
  }

  const hasSource = !!sourceImage || !!editor.getHasImage?.();
  const hasLayers = !!layers.getHasLayers?.();
  if (!hasSource && !hasLayers) {
    setStatus("Nothing to save yet. Add at least one image or layer.");
    return;
  }

  const suggestedName = sanitizeProjectName(
    currentProjectName || sourceFileName || "blizlab-project"
  );
  const askedName = window.prompt("Project name", suggestedName);
  if (askedName == null) return;
  const projectName = sanitizeProjectName(askedName);

  try {
    setStatus("Packing project…");
    const zip = new ZipCtor();
    const layersState = await layers.exportProjectState();

    for (const asset of layersState.assets) {
      zip.file(asset.path, asset.blob);
    }

    let sourceImagePath = null;
    let cutoutImagePath = null;
    if (sourceImage) {
      sourceImagePath = "assets/source/source-image.png";
      const sourceBlob = await imageLikeToPngBlob(sourceImage);
      if (sourceBlob) zip.file(sourceImagePath, sourceBlob);
    }
    if (cutoutImage) {
      cutoutImagePath = "assets/source/cutout-image.png";
      const cutoutBlob = await imageLikeToPngBlob(cutoutImage);
      if (cutoutBlob) zip.file(cutoutImagePath, cutoutBlob);
    }

    const manifest = {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      app: "blizlab-retrocut",
      savedAt: new Date().toISOString(),
      projectName,
      settings: getCurrentProjectSettings(),
      source: {
        fileName: sourceFileName || "",
        sourceImage: sourceImagePath,
        cutoutImage: cutoutImagePath
      },
      editor: editor.getProjectState?.() || {},
      cutout: cutout.getProjectState?.() || {},
      layers: {
        ratio: layersState.ratio,
        canvasDefinition: layersState.canvasDefinition,
        activeLayerIndex: layersState.activeLayerIndex,
        layers: layersState.layers
      }
    };

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    const outBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });
    downloadBlob(outBlob, buildProjectDownloadName(projectName));
    setCurrentProjectName(projectName);
    setStatus(`Project saved: ${buildProjectDownloadName(projectName)}.`);
  } catch (err) {
    console.error(err);
    setStatus("Could not save project.");
  }
}

async function openProjectFromBlz(file) {
  if (!file) return false;
  const ZipCtor = globalThis.JSZip;
  if (!ZipCtor) {
    setStatus("ZIP library not loaded.");
    return false;
  }

  try {
    setStatus("Opening project…");
    const zip = await ZipCtor.loadAsync(file);
    const manifestEntry = zip.file("manifest.json");
    if (!manifestEntry) throw new Error("Invalid project: manifest.json missing.");
    const manifestText = await manifestEntry.async("string");
    const manifest = JSON.parse(manifestText);
    if (!manifest || typeof manifest !== "object") {
      throw new Error("Invalid project manifest.");
    }
    if (Number(manifest.schemaVersion) !== PROJECT_SCHEMA_VERSION) {
      throw new Error("Project version not supported in this build.");
    }

    applyProjectSettings(manifest.settings || {});

    const projectName = sanitizeProjectName(
      manifest.projectName || getProjectNameFromFilename(file.name)
    );

    const sourcePath = manifest.source?.sourceImage || "";
    const loadedSourceImage = await loadImageFromZipAsset(zip, sourcePath);
    if (loadedSourceImage) {
      sourceImage = loadedSourceImage;
      sourceFileName = manifest.source?.fileName || `${projectName}.png`;
      fileNameText.textContent = sourceFileName;
      editor.setImage(sourceImage);
      await cutout.setImage(sourceImage, sourceFileName);
      cutout.setReferenceBackground(null);
      setCutoutContextAvailability(false);
      setCutoutPreviewBackground(cutoutBgMode);
      setButtonsForImageLoaded(true);
    } else {
      sourceImage = null;
      sourceFileName = "";
      cutoutImage = null;
      fileNameText.textContent = "No file selected.";
      editor.clearImage?.();
      cutout.clearImage?.();
      cutout.setReferenceBackground(null);
      setCutoutContextAvailability(false);
      setCutoutPreviewBackground("checker");
      setButtonsForImageLoaded(false);
    }

    const cutoutPath = manifest.source?.cutoutImage || "";
    cutoutImage = await loadImageFromZipAsset(zip, cutoutPath);

    const layersManifest = manifest.layers || {};
    const layerDefs = Array.isArray(layersManifest.layers) ? layersManifest.layers : [];
    const hydratedLayers = [];
    for (const layer of layerDefs) {
      const currentImage = await loadImageFromZipAsset(zip, layer.currentImage);
      if (!currentImage) continue;
      const originalImage = await loadImageFromZipAsset(zip, layer.originalImage);
      hydratedLayers.push({
        ...layer,
        currentImage,
        originalImage: originalImage || currentImage
      });
    }
    layers.importProjectState({
      ratio: layersManifest.ratio,
      canvasDefinition: layersManifest.canvasDefinition,
      activeLayerIndex: layersManifest.activeLayerIndex,
      layers: hydratedLayers
    });

    editor.applyProjectState?.(manifest.editor || {});
    cutout.applyProjectState?.(manifest.cutout || {});

    const requestedMode = manifest.settings?.currentMode;
    if (requestedMode === "edit" || requestedMode === "cutout" || requestedMode === "layers") {
      setMode(requestedMode);
    } else if (layers.getHasLayers()) {
      setMode("layers");
    } else if (sourceImage) {
      setMode("edit");
    }

    setCurrentProjectName(projectName);
    syncDownloadButton();
    syncLayersActionButtons();
    setStatus(`Project loaded: ${projectName}.`);
    return true;
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Could not open project.");
    return false;
  }
}

btnImportLayersComposition?.addEventListener("click", importLayersCompositionToRetro);

btnDownloadLayersZip.addEventListener("click", async () => {
  if (!layers.getHasLayers()) return;
  try {
    setStatus("Preparing layers ZIP...");
    const zipBlob = await layers.exportLayersZipBlob();
    downloadBlob(zipBlob, "blizlab-layers.zip");
    setStatus("Downloaded layers ZIP (01_blizlab_layer.png format, fixed canvas size).");
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

btnMobileBlockerContinue?.addEventListener("click", () => {
  dismissMobileBlocker();
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
downscaleImportsEnabled = readDownscaleImportsSetting();
if (upscaleLowResToggle) upscaleLowResToggle.checked = upscaleLowResEnabled;
if (downscaleImportsToggle) downscaleImportsToggle.checked = downscaleImportsEnabled;
applyCanvasDefinition(canvasDefinition, { persist: false });
applyCanvasAspectFromSettings();
syncCanvasSettingsUI();
setSidebarCollapsed(false);
setMoreMenuOpen(false);
setHeroScene(0, { immediate: true });
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
renderSettingsVersion();
initMobileBlocker();
setMode("layers");
updateProjectSectionTitle();
announceProjectOpenReadyIfNeeded();
