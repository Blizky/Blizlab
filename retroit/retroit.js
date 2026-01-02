/* retroit.js - Logic for RetroIt App */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const fileInput      = document.getElementById("fileInput");
const fileNameText   = document.getElementById("fileNameText");
const downloadBtn    = document.getElementById("downloadBtn");

const styleButtons   = document.querySelectorAll(".styles .chip-btn");
const orientationBtns= document.querySelectorAll(".orientations .chip-btn");
const intensitySlider= document.getElementById("intensity");
const intensityValue = document.getElementById("intensityValue");
const roundnessSlider= document.getElementById("roundness");
const roundnessValue = document.getElementById("roundnessValue");
const noiseSlider    = document.getElementById("noise");
const noiseValue     = document.getElementById("noiseValue");
const dropZone       = document.getElementById("dropZone");
const fillBtn        = document.getElementById("fillBtn");
const canvasFileNameText = document.getElementById("canvasFileNameText");

const PAPER = "#fdfdf9";
const MAT_MARGIN = 40;

let img = null;
let currentStyle = "bw";
let orientation  = "landscape43";
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

/* Orientation + canvas setup ---------------------------------- */
function setOrientation(newOrientation) {
  orientation = newOrientation;

  if (orientation === "landscape43") {
    canvas.width = 1440;
    canvas.height = 1080;
    dropZone.style.aspectRatio = "4 / 3";
    dropZone.style.maxWidth = "780px";
  } else if (orientation === "landscape169") {
    canvas.width = 1440;
    canvas.height = 810;
    dropZone.style.aspectRatio = "16 / 9";
    dropZone.style.maxWidth = "780px";
  } else if (orientation === "portrait34") {
    canvas.width = 1080;
    canvas.height = 1440;
    dropZone.style.aspectRatio = "3 / 4";
    dropZone.style.maxWidth = "560px";
  } else if (orientation === "square11") {
    canvas.width = 1200;        
    canvas.height = 1200;
    dropZone.style.aspectRatio = "1 / 1";
    dropZone.style.maxWidth = "620px";
  }

  if (img) {
    const innerW = canvas.width - MAT_MARGIN * 2;
    const innerH = canvas.height - MAT_MARGIN * 2;
    const fitScale = Math.min(innerW / img.width, innerH / img.height);
    scale = fitScale;
    offsetX = 0;
    offsetY = 0;
  }

  render();
}

/* IMAGE LOADING ------------------------------------------------ */
function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    img = image;

    const innerW = canvas.width - MAT_MARGIN * 2;
    const innerH = canvas.height - MAT_MARGIN * 2;
    const fitScale = Math.min(innerW / img.width, innerH / img.height);
    scale = fitScale;
    offsetX = 0;
    offsetY = 0;

    render();
    downloadBtn.disabled = false;
  };
  image.onerror = () => {
    alert("Could not load image.");
  };
  image.src = url;
}

/* RENDERING ---------------------------------------------------- */
function render() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // marco/papel
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const innerRadius = Number(roundnessSlider.value) || 0;
  const ix = MAT_MARGIN;
  const iy = MAT_MARGIN;
  const iw = w - MAT_MARGIN * 2;
  const ih = h - MAT_MARGIN * 2;

  ctx.save();
  if (innerRadius > 0) {
    roundedRectPath(ctx, ix, iy, iw, ih, innerRadius);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(ix, iy, iw, ih);
    ctx.clip();
  }

  // fondo negro dentro del área de imagen
  ctx.fillStyle = "#000";
  ctx.fillRect(ix, iy, iw, ih);

  if (img) {
    drawPhoto(ctx, ix, iy, iw, ih);
    applyStyle(ctx, ix, iy, iw, ih);
  } else {
    ctx.fillStyle = "#777";
    ctx.font = "30px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Drop an image here", w / 2, h / 2);
  }

  ctx.restore();
}

function drawPhoto(targetCtx, ix, iy, iw, ih) {
  const w = img.width * scale;
  const h = img.height * scale;
  const x = ix + (iw - w) / 2 + offsetX;
  const y = iy + (ih - h) / 2 + offsetY;
  targetCtx.drawImage(img, x, y, w, h);
}

function applyStyle(targetCtx, ix, iy, iw, ih) {
  const tSlider = intensitySlider.value / 100;
  const noiseAmount = (noiseSlider.value || 0) / 100;

  const imageData = targetCtx.getImageData(ix, iy, iw, ih);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    if (currentStyle === "bw") {
      let gray = 0.3 * r + 0.59 * g + 0.11 * b;
      const minF = 0.44;
      const maxF = 1.84;
      const factor = minF + tSlider * (maxF - minF);
      gray = ((gray - 128) * factor) + 128;
      r = g = b = clamp(gray);
    } else if (currentStyle === "sepia") {
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;

      r = clamp(mix(r, sr, 0.4 + 0.6 * tSlider));
      g = clamp(mix(g, sg, 0.4 + 0.6 * tSlider));
      b = clamp(mix(b, sb, 0.4 + 0.6 * tSlider));

      const fade = 8 + 15 * tSlider;
      r = clamp(r + fade * 0.9);
      g = clamp(g + fade * 0.7);
      b = clamp(b + fade * 0.4);
    } else if (currentStyle === "postal") {
      const gray = (r + g + b) / 3;
      const satBlend = 0.45;
      let rr = gray * (1 - satBlend) + r * satBlend;
      let gg = gray * (1 - satBlend) + g * satBlend;
      let bb = gray * (1 - satBlend) + b * satBlend;

      const lift = 18 + 20 * tSlider;
      rr = clamp(rr + lift);
      gg = clamp(gg + lift);
      bb = clamp(bb + lift);

      const tone = 12 + 18 * tSlider;
      rr = clamp(rr + tone * 0.2);
      gg = clamp(gg + tone * 0.5);
      bb = clamp(bb - tone * 0.1);

      r = rr; g = gg; b = bb;
    }

    /* Noise / film grain */
    if (noiseAmount > 0) {
      const amp = 35 * noiseAmount; // max +/- ~35
      const n = (Math.random() - 0.5) * 2 * amp;
      r = clamp(r + n);
      g = clamp(g + n);
      b = clamp(b + n);
    }

    d[i]     = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  targetCtx.putImageData(imageData, ix, iy);
}

/* Helpers ------------------------------------------------------ */
function roundedRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
function mix(a, b, t) { return a + (b - a) * t; }

/* EVENTS ------------------------------------------------------- */
orientationBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    orientationBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    setOrientation(btn.dataset.orientation);
  });
});
setOrientation("landscape43");

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    fileNameText.textContent = file.name;
    if (canvasFileNameText) canvasFileNameText.textContent = file.name;
    loadImageFromFile(file);
  } else {
    fileNameText.textContent = "No file selected.";
    if (canvasFileNameText) canvasFileNameText.textContent = "";
  }
});

["dragenter","dragover"].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("dragover");
  });
});
["dragleave","dragend","drop"].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragover");
  });
});
dropZone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    fileNameText.textContent = file.name;
    if (canvasFileNameText) canvasFileNameText.textContent = file.name;
    loadImageFromFile(file);
  }
});

fillBtn.addEventListener("click", () => {
  if (!img) return;
  const innerW = canvas.width - MAT_MARGIN * 2;
  const innerH = canvas.height - MAT_MARGIN * 2;
  const fillScale = Math.max(innerW / img.width, innerH / img.height);
  scale = fillScale;
  offsetX = 0;
  offsetY = 0;
  render();
});

styleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    styleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentStyle = btn.dataset.style;
    if (img) render();
  });
});

intensitySlider.addEventListener("input", () => {
  intensityValue.textContent = intensitySlider.value;
  if (img) render();
});

roundnessSlider.addEventListener("input", () => {
  roundnessValue.textContent = roundnessSlider.value;
  if (img) render();
});

noiseSlider.addEventListener("input", () => {
  noiseValue.textContent = noiseSlider.value;
  if (img) render();
});

canvas.addEventListener("wheel", (e) => {
  if (!img) return;
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left);
  const my = (e.clientY - rect.top);

  const zoomAmount = 1.1;
  const oldScale = scale;
  scale = e.deltaY < 0 ? scale * zoomAmount : scale / zoomAmount;
  scale = Math.max(0.2, Math.min(scale, 5));

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const sx = (mx - cx) - offsetX;
  const sy = (my - cy) - offsetY;

  offsetX -= sx * (scale / oldScale - 1);
  offsetY -= sy * (scale / oldScale - 1);

  render();
}, { passive: false });

canvas.addEventListener("mousedown", (e) => {
  if (!img) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  offsetX += e.clientX - lastX;
  offsetY += e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  render();
});

window.addEventListener("mouseup", () => { dragging = false; });

/* DOWNLOAD ----------------------------------------------------- */
downloadBtn.addEventListener("click", () => {
  if (!img) return;

  const w = canvas.width;
  const h = canvas.height;
  const ix = MAT_MARGIN;
  const iy = MAT_MARGIN;
  const iw = w - MAT_MARGIN * 2;
  const ih = h - MAT_MARGIN * 2;
  const innerRadius = Number(roundnessSlider.value) || 0;

  // 1) recortamos solo el área interna (sin marco)
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = iw;
  exportCanvas.height = ih;
  const ectx = exportCanvas.getContext("2d");

  ectx.drawImage(canvas, ix, iy, iw, ih, 0, 0, iw, ih);

  // 2) si hay esquinas redondeadas, aplicamos máscara
  if (innerRadius > 0) {
    ectx.save();
    ectx.globalCompositeOperation = "destination-in";
    roundedRectPath(ectx, 0, 0, iw, ih, innerRadius);
    ectx.fillStyle = "#fff";
    ectx.fill();
    ectx.restore();
  }

  const link = document.createElement("a");
  link.download = "retroit-image.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

// Init
render();