// retro.js
// Simple “retroid” effect: pixelate the image and reduce colours.
export function applyRetroEffect(canvas, pixelSize = 8) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Draw the current image scaled down and back up to create pixelation.
  const offscreen = document.createElement('canvas');
  offscreen.width = width / pixelSize;
  offscreen.height = height / pixelSize;
  const octx = offscreen.getContext('2d');
  // Draw reduced image
  octx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
  // Draw back to main canvas
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, offscreen.width, offscreen.height, 0, 0, width, height);
}

