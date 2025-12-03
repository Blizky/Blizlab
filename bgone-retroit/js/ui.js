import { removeBackground } from './bgone.js';
import { applyRetroEffect } from './retro.js';
import { modelPath, getSession } from './app.js';

export function initUI() {
  const fileInput = document.querySelector('#file-input');
  const outputCanvas = document.querySelector('#output');
  const downloadBtn = document.getElementById('download-btn');
  const progressBar = document.getElementById('progress-bar');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('model-status');
  let modelCached = false;

  async function ensureModelLoaded() {
    try {
      await getSession();
      modelCached = true;
      if (statusDot) statusDot.classList.add('done');
      if (statusText) statusText.textContent = 'Model cached. BGone can now work offline.';
    } catch (e) {
      console.error(e);
    }
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      if (modelCached) return;
      try {
        const response = await fetch(modelPath);
        const total = +response.headers.get('Content-Length');
        const reader = response.body.getReader();
        let received = 0;
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (progressBar) {
            const percent = (received / total) * 100;
            progressBar.style.width = percent + '%';
          }
        }
        let modelData = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          modelData.set(chunk, offset);
          offset += chunk.length;
        }
        const ort = window.ort;
        await ort.env.wasm.init();
        await ort.InferenceSession.create(modelData);
        modelCached = true;
        if (statusDot) statusDot.classList.add('done');
        if (statusText) statusText.textContent = 'Model cached. BGone can now work offline.';
      } catch (err) {
        console.error('Model download error', err);
      }
    });
  }

  // check if model cached from previous session
  getSession().then(() => {
    modelCached = true;
    if (statusDot) statusDot.classList.add('done');
    if (statusText) statusText.textContent = 'Model cached. BGone can now work offline.';
  }).catch(() => {});

  fileInput.addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    if (!modelCached) {
      await ensureModelLoaded();
    }
    const img = new Image();
    img.onload = async () => {
      outputCanvas.width = img.width;
      outputCanvas.height = img.height;
      const ctx = outputCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      await removeBackground(outputCanvas);
      applyRetroEffect(outputCanvas, 6);
    };
    img.src = URL.createObjectURL(file);
  });
}
