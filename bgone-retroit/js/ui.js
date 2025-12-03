// ui.js
import { removeBackground } from './bgone.js';
import { applyRetroEffect } from './retro.js';

export function initUI() {
  const fileInput = document.querySelector('#file-input');
  const outputCanvas = document.querySelector('#output');
  fileInput.addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = async () => {
      const canvas = outputCanvas;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Remove background
      await removeBackground(canvas);
      // Apply retro effect
      applyRetroEffect(canvas, 6);
    };
    img.src = URL.createObjectURL(file);
  });
}

