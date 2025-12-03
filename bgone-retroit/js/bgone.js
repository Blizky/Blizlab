// bgone.js
import { getSession } from './app.js';

// Convert an ImageData or <canvas> into an ONNX input tensor.
function preprocess(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Normalise pixel values and reshape to match U²‑Net’s expected input
  const float32Data = new Float32Array(imgData.data.length / 4 * 3);
  for (let i = 0, j = 0; i < imgData.data.length; i += 4) {
    float32Data[j++] = imgData.data[i] / 255;     // R
    float32Data[j++] = imgData.data[i + 1] / 255; // G
    float32Data[j++] = imgData.data[i + 2] / 255; // B
  }
  return new ort.Tensor('float32', float32Data, [1, 3, canvas.height, canvas.width]);
}

// Apply the alpha mask returned by the model to the original image.
function applyMask(canvas, maskTensor) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mask = maskTensor.data;
  // U²‑Net outputs values in [0,1]; use them as alpha
  for (let i = 0, j = 0; i < imgData.data.length; i += 4) {
    const alpha = mask[j++];
    imgData.data[i + 3] = alpha * 255;
  }
  ctx.putImageData(imgData, 0, 0);
}

export async function removeBackground(canvas) {
  const session = await getSession();
  const input = preprocess(canvas);
  const output = await session.run({ input });
  // U²‑Net uses the first output name; adjust if different
  const mask = Object.values(output)[0];
  applyMask(canvas, mask);
  return canvas;
}

