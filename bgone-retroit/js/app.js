// app.js

import * as ort from 'onnxruntime-web';

/**
 * URL of the ONNX model to download.
 * 
 * Here we use the smaller U²‑Net P variant (~4.7 MB) hosted on GitHub,
 * which rembg publishes under a permissive license. You can replace this
 * with another ONNX model URL if desired (e.g. u2net.onnx for higher quality).
 */
export const modelPath =
  'https://github.com/danielgatis/rembg/raw/master/rembg/resources/models/u2netp.onnx';

/**
 * Cache the ONNX InferenceSession so that we only download
 * and initialise the model once. onnxruntime-web will store the
 * downloaded model in IndexedDB for offline reuse.
 */
let session = null;

/**
 * Lazily create or return the existing ONNX session.
 * The first call will fetch the model from `modelPath` if it is not yet cached.
 *
 * @returns {Promise<ort.InferenceSession>} A promise that resolves to an ONNX session
 */
export async function getSession() {
  if (session) {
    return session;
  }

  // Create a new session; this downloads the model if not present in IndexedDB
  session = await ort.InferenceSession.create(modelPath);
  return session;
}
