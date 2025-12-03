// retro.js

/**
 * Apply a simple pixelation effect to a canvas to give a retro look.
 * @param {HTMLCanvasElement} canvas - The canvas whose contents will be pixelated.
 * @param {number} pixelSize - Higher values produce blockier pixelation.
 */
export function applyRetroEffect(canvas, pixelSize = 8) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Create an offscreen canvas to downscale the image
  const offscreen = document.createElement('canvas');
  offscreen.width  = Math.max(1, Math.floor(width / pixelSize));
  offscreen.height = Math.max(1, Math.floor(height / pixelSize));
  const offCtx = offscreen.getContext('2d');

  // Draw the current image into the small offscreen canvas
  offCtx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);

  // Draw the scaled-up version back onto the main canvas without smoothing
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    offscreen,
    0, 0, offscreen.width, offscreen.height,
    0, 0, width, height
  );
}
