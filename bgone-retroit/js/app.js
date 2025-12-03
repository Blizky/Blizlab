// app.js
// Export a URL to fetch the ONNX model from the web.
// The u2netp model is ~4.7 MB and works well in the browser.
export const modelPath = 'https://github.com/danielgatis/rembg/raw/master/rembg/resources/models/u2netp.onnx';

import * as ort from 'onnxruntime-web';

let session;

export async function getSession() {
  // If we've already created the session, return it.
  if (session) return session;

  // Create a new session; onnxruntime-web will download the model from modelPath
  session = await ort.InferenceSession.create(modelPath);
  return session;
}
