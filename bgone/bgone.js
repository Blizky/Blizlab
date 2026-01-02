import {
  removeBackground,
  preload
} from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm";

const MODEL_READY_KEY = "bgoneModelReady";

/* DOM REFS */
const modelNoteEl = document.getElementById("modelNote");
const btnReloadModel = document.getElementById("btnReloadModel");
const modelDot = document.getElementById("modelDot");

const statusEl = document.getElementById("status");
const imageFilenameEl = document.getElementById("imageFilename");
const btnRemove = document.getElementById("btnRemove");
const brushValueEl = document.getElementById("brushValue");
const btnUndo = document.getElementById("btnUndo");
const btnRedo = document.getElementById("btnRedo");
const canvasTipEl = document.getElementById("canvasTip");
const overlayMsg = document.getElementById("overlayMsg");
const btnDownload = document.getElementById("btnDownload");
const modeEraseBtn = document.getElementById("modeErase");
const modeRestoreBtn = document.getElementById("modeRestore");

const fileInput = document.getElementById("fileInput");
const labelSelectImage = document.getElementById("labelSelectImage");
const brushSizeEl = document.getElementById("brushSize");
const canvas = document.getElementById("canvas");
const canvasWrap = document.getElementById("canvasWrap");
const brushPreview = document.getElementById("brushPreview");

const ctx = canvas.getContext("2d");

// Offscreen canvases
const originalCanvas = document.createElement("canvas");
const originalCtx = originalCanvas.getContext("2d");
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");

// Full-res export info
let originalImageElement = null;
let originalImageWidth = 0;
let originalImageHeight = 0;

// -------- MODEL STATUS --------------------------------------

function setModelDot(ready) {
  if (!modelDot) return;
  modelDot.classList.toggle("ok", ready);
  modelDot.setAttribute("aria-label", ready ? "Model cached and ready" : "Model not cached yet");
}

function markModelReady() {
  localStorage.setItem(MODEL_READY_KEY, "1");
  modelNoteEl.textContent = "Model cached in this browser. BGone can work offline.";
  setModelDot(true);
}

function checkModelReady() {
  const ready = localStorage.getItem(MODEL_READY_KEY) === "1";
  if (ready) {
    modelNoteEl.textContent = "Model cached in this browser. BGone can work offline.";
  }
  setModelDot(ready);
}

checkModelReady();

btnReloadModel.addEventListener("click", async () => {
  modelNoteEl.textContent = "Downloading or refreshing AI model…";
  btnReloadModel.disabled = true;
  setModelDot(false);
  try {
    await preload({ debug: true });
    markModelReady();
  } catch (err) {
    console.error(err);
    modelNoteEl.textContent = "Error downloading model. Check connection.";
  } finally {
    btnReloadModel.disabled = false;
  }
});

// -------- IMAGE + CANVAS STATE -------------------------------

let hasImage = false;
let working = false;
let brushMode = "erase";
let painting = false;
let lastPointer = null;

const history = { stack: [], redos: [], limit: 30 };

function pushHistory() {
  if (!hasImage) return;
  try {
    const snap = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    history.stack.push(snap);
    if (history.stack.length > history.limit) history.stack.shift();
    history.redos.length = 0;
  } catch (e) {
    console.error(e);
  }
}

function undo() {
  if (history.stack.length <= 1) return;
  const current = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const prev = history.stack[history.stack.length - 2];
  history.redos.push(current);
  history.stack.pop();
  maskCtx.putImageData(prev, 0, 0);
  render();
  statusEl.textContent = "Undid last stroke.";
}

function redo() {
  if (history.redos.length === 0) return;
  const redoImg = history.redos.pop();
  history.stack.push(redoImg);
  maskCtx.putImageData(redoImg, 0, 0);
  render();
  statusEl.textContent = "Redid stroke.";
}

btnUndo.addEventListener("click", undo);
btnRedo.addEventListener("click", redo);

function setWorking(flag) {
  working = flag;
  btnRemove.disabled = flag || !hasImage;
}

function setDownloadEnabled(flag) {
  btnDownload.disabled = !flag;
}

function fitImageDimensions(imgWidth, imgHeight, maxWidth = 1400, maxHeight = 900) {
  let w = imgWidth;
  let h = imgHeight;
  const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
  w = Math.round(w * ratio);
  h = Math.round(h * ratio);
  return { w, h };
}

function render() {
  if (!hasImage) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(originalCanvas, 0, 0, w, h);

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0, w, h);

  ctx.globalCompositeOperation = "source-over";
}

function initMaskFromImage() {
  const w = canvas.width;
  const h = canvas.height;
  maskCanvas.width = w;
  maskCanvas.height = h;
  maskCtx.clearRect(0, 0, w, h);
  maskCtx.fillStyle = "#fff";
  maskCtx.fillRect(0, 0, w, h);
  pushHistory();
}

function initMaskFromResultBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = canvas.width;
      const h = canvas.height;

      const temp = document.createElement("canvas");
      temp.width = w;
      temp.height = h;
      const tctx = temp.getContext("2d");
      tctx.drawImage(img, 0, 0, w, h);

      const imgData = tctx.getImageData(0, 0, w, h);
      const maskData = maskCtx.createImageData(w, h);
      const src = imgData.data;
      const dst = maskData.data;

      for (let i = 0; i < src.length; i += 4) {
        const a = src[i + 3];
        dst[i] = 255;
        dst[i + 1] = 255;
        dst[i + 2] = 255;
        dst[i + 3] = a;
      }

      maskCtx.putImageData(maskData, 0, 0);
      pushHistory();
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error rendering result."));
    };
    img.src = url;
  });
}

async function loadFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    originalImageElement = img;
    originalImageWidth = img.width;
    originalImageHeight = img.height;

    const { w, h } = fitImageDimensions(img.width, img.height);
    canvas.width = w;
    canvas.height = h;
    originalCanvas.width = w;
    originalCanvas.height = h;

    originalCtx.clearRect(0, 0, w, h);
    originalCtx.drawImage(img, 0, 0, w, h);

    hasImage = true;
    setWorking(false);
    setDownloadEnabled(true);
    btnRemove.disabled = false;

    overlayMsg.style.display = "none";
    statusEl.textContent = `Image loaded (${img.width} × ${img.height}).`;
    imageFilenameEl.textContent = file.name;
    imageFilenameEl.dataset.hasName = "1";
    canvasTipEl.textContent = `Image size: ${img.width} × ${img.height} px · Canvas: ${w} × ${h} px`;

    initMaskFromImage();
    render();
  };
  img.onerror = () => {
    statusEl.textContent = "Error loading image.";
  };
  img.src = url;
}

// ---- Brush preview & painting -------------------------------

function updateBrushPreviewStyle() {
  if (!brushPreview) return;
  brushPreview.classList.toggle("restore", brushMode === "restore");
}

function getCanvasPointer(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((evt.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

function showBrushPreview() {
  if (!hasImage || working || !brushPreview) return;
  brushPreview.style.display = "block";
  updateBrushPreviewStyle();
}

function hideBrushPreview() {
  if (!brushPreview) return;
  brushPreview.style.display = "none";
}

function updateBrushPreview(evt) {
  if (!hasImage || !brushPreview || working) return;
  const canvasRect = canvas.getBoundingClientRect();
  const wrapRect = canvasWrap.getBoundingClientRect();
  const radius = parseInt(brushSizeEl.value, 10) || 1;
  const scaleX = canvasRect.width / canvas.width || 1;
  const size = radius * 2 * scaleX;
  const x = evt.clientX - wrapRect.left;
  const y = evt.clientY - wrapRect.top;
  brushPreview.style.width = `${size}px`;
  brushPreview.style.height = `${size}px`;
  brushPreview.style.left = `${x}px`;
  brushPreview.style.top = `${y}px`;
  brushPreview.style.display = "block";
}

function drawStamp(x, y, radius) {
  maskCtx.save();
  maskCtx.lineCap = "round";
  maskCtx.lineJoin = "round";
  maskCtx.fillStyle = "#fff";
  maskCtx.strokeStyle = "#fff";

  if (brushMode === "erase") {
    maskCtx.globalCompositeOperation = "destination-out";
  } else {
    maskCtx.globalCompositeOperation = "source-over";
  }

  maskCtx.beginPath();
  maskCtx.arc(x, y, radius, 0, Math.PI * 2);
  maskCtx.fill();
  maskCtx.restore();
}

function drawStroke(from, to, radius) {
  maskCtx.save();
  maskCtx.lineCap = "round";
  maskCtx.lineJoin = "round";
  maskCtx.lineWidth = radius * 2;
  maskCtx.strokeStyle = "#fff";

  if (brushMode === "erase") {
    maskCtx.globalCompositeOperation = "destination-out";
  } else {
    maskCtx.globalCompositeOperation =