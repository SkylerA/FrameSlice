import { GraphModel } from "@tensorflow/tfjs-converter";
import { IOHandler } from "@tensorflow/tfjs-core/dist/io/types";
// TODO see about delaying the load of this. Tried to dynamic import, but the can't seem to access types like tf.rank
import * as tf from "@tensorflow/tfjs";
// TODO Ensure we don't need this import any more, tf.getBackend() returns webgl even when it's commented out
// import "@tensorflow/tfjs-backend-webgl";

export const loadModel = async (
  cb: (graph: GraphModel<string | IOHandler>) => void
) => {
  const { loadGraphModel } = await import("@tensorflow/tfjs-converter");
  const graphModel = await loadGraphModel("./tfjs_model/model.json");
  cb(graphModel);
  return graphModel;
};

export const inferImage = async (url: string, graphModel: tf.GraphModel) => {
  return new Promise<number>((resolve) => {
    const image = new Image();
    image.src = url;
    // run inference once image loads
    image.onload = () => {
      // this is hardcoded for gg btns currently
      const img_size = 34;
      const tensor = tf.browser
        .fromPixels(image)
        .resizeNearestNeighbor([img_size, img_size])
        .toFloat()
        .expandDims();
      const results = graphModel?.predict(tensor) as tf.Tensor<tf.Rank>;

      const predictions = results?.arraySync();
      const classIdx = results?.as1D().argMax().dataSync()[0];
      resolve(classIdx);
    };
  });
};
