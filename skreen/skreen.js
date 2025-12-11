// Skreen – Kelvin light logic

const body = document.body;
const kSlider = document.getElementById("kelvin");
const kValue = document.getElementById("kValue");
const btnFull = document.getElementById("btnFull");
const btnExitFull = document.getElementById("btnExitFull");
const btnInfo = document.getElementById("btnInfo");
const bar = document.getElementById("skreenBar");

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

// Kelvin (1000–40000) to RGB approximation (Tanner Helland)
function kelvinToRGB(k) {
  let temp = k / 100;
  let r, g, b;

  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    r = clamp(r, 0, 255);
  }

  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    g = clamp(g, 0, 255);
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    g = clamp(g, 0, 255);
  }

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    b = clamp(b, 0, 255);
  }

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

function updateBackground() {
  const k = parseInt(kSlider.value, 10);
  kValue.textContent = `${k} K`;
  const { r, g, b } = kelvinToRGB(k);
  body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

// Fullscreen handling
function handleFullscreenChange() {
  const isFs = !!document.fullscreenElement;

  if (isFs) {
    bar.style.display = "none";
    btnExitFull.style.display = "block";
  } else {
    bar.style.display = "inline-flex";
    btnExitFull.style.display = "none";
    btnFull.textContent = "Full screen";
  }
}

function enterFullscreen() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }
}

function exitFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen();
  }
}

// Info modal
function showInfoModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "skreen-modal-backdrop";

  const modal = document.createElement("div");
  modal.className = "skreen-modal";
  modal.innerHTML = `
    <h2>About Skreen Light</h2>

    <p>
      The color is calculated using the
      <strong>Tanner Helland Kelvin-to-RGB approximation</strong>, which converts
      a Kelvin temperature value into an RGB color your monitor can display.
    </p>

    <p>
      This is not a perfect physics model, but it closely matches common
      video-light temperatures (3000–7000&nbsp;K) and is excellent for quick
      fill-light use.
    </p>

    <p>
      For best accuracy:
      <br>• Set your monitor’s color temperature to a neutral preset (around 6500&nbsp;K).
      <br>• Adjust your monitor brightness manually.
    </p>

    <button type="button">Got it</button>
  `;

  const closeBtn = modal.querySelector("button");
  closeBtn.addEventListener("click", () => {
    backdrop.remove();
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  });

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

// Events
kSlider.addEventListener("input", updateBackground);
btnFull.addEventListener("click", enterFullscreen);
btnExitFull.addEventListener("click", exitFullscreen);
btnInfo.addEventListener("click", showInfoModal);
document.addEventListener("fullscreenchange", handleFullscreenChange);

// Optional: "f" toggles fullscreen
document.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") {
    if (document.fullscreenElement) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }
});

// Initial paint
updateBackground();
handleFullscreenChange();