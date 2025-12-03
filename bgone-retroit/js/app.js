// app.js
// Export the model path and a single loaded session so it’s shared.
export const modelPath = './assets/model.onnx';
import * as ort from 'onnxruntime-web';

let session;
export async function getSession() {
  if (!session) {
    session = await ort.InferenceSession.create(modelPath);
  }
  return session;
}
