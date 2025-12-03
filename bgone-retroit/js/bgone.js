// bgone.js
import { getSession } from './app.js';
import * as ort from 'onnxruntime-web';

/**
 * Convert the image data in the given canvas into a tensor suitable for U²‑Net.
 * Normalises pixel values to [0,1] and reshapes to [1,3,H,W].
 */
function preprocess(canvas) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, width, height).data;

  // U²‑Net expects three channels (RGB), so we ignore the alpha channel.
  const floatData = new Float32Array(width * height * 3);
  for (let i = 0, j = 0; i < imgData.length; i += 4) {
    floatData[j++] = imgData[i]     / 255; // R
    floatData[j++] = imgData[i + 1] / 255; // G
    floatData[j++] = imgData[i + 2] / 255; // B
  }

  // Create a tensor with shape [1, 3, H, W]
  return new ort.Tensor('float32', floatData, [1, 3, height, width]);
}

/**
 * Apply the model's mask output to the canvas by writing alpha values.
 * U²‑Net outputs a single channel mask with shape [1, 1, H, W] and values in [0,1].
 */
function applyMask(canvas, maskTensor) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, width, height);
  const mask = maskTensor.data;

  // Set alpha channel based on mask
  for (let i = 0, j = 0; i < imgData.data.length; i += 4, j++) {
    const alpha = mask[j];
    imgData.data[i + 3] = Math.min(255, Math.max(0, alpha * 255));
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Remove the background from the provided canvas by running U²‑Net.
 * This will download or reuse the cached model via getSession().
 */
export async function removeBackground(canvas) {
  const session = await getSession();
  const inputTensor = preprocess(canvas);

  // Feed the tensor into the first input of the model
  const feeds = {};
  const inputName = session.inputNames ? session.inputNames[0] : Object.keys(session.inputNames)[0];
  feeds[inputName] = inputTensor;

  // Run inference
  const results = await session.run(feeds);
  const outputName = session.outputNames ? session.outputNames[0] : Object.keys(results)[0];
  const maskTensor = results[outputName];

  // Apply the resulting mask to the canvas
  applyMask(canvas, maskTensor);
}
