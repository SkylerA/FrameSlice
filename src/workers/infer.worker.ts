import type { GraphModel } from "@tensorflow/tfjs-converter";
import type { Tensor, Rank } from "@tensorflow/tfjs";

const loadModelPromise = loadModel();

// Listen for messages
addEventListener("message", (event) => {
  if (event.data?.type === "inferBlob") {
    const { blob, name, idx } = event.data;
    handleInferBlobRequest(blob, name, idx);
  } else if (event.data?.type === "inferUrl") {
    handleInferUrlRequest(event.data.url);
  }
});

async function handleInferBlobRequest(blob: Blob, name: string, idx: number) {
  const { graphModel, labels: newLabels } = await loadModelPromise;

  if (graphModel && blob) {
    inferImageBlob(blob, graphModel)
      .then((val) => {
        postMessage({ type: "inferResult", classIdx: val, name, idx });
      })
      .catch((error) => console.log("handleInferBlobRequest Error: ", error));
  } else {
    console.log(
      `handleInferBlobRequest: graphModel or url is invalid`,
      graphModel,
      blob
    );
  }
}

async function handleInferUrlRequest(url: string) {
  const { graphModel, labels: newLabels } = await loadModelPromise;

  if (graphModel && url) {
    inferImageUrl(url, graphModel)
      .then((val) => {
        postMessage({ classIdx: val, /*idx,*/ url });
      })
      .catch((error) => console.log("handleInferUrlRequest Error: ", error));
  } else {
    console.log(
      `handleInferUrlRequest: graphModel or url is invalid`,
      graphModel,
      url
    );
  }
}

async function inferImageBlob(blob: Blob, graphModel: GraphModel) {
  return new Promise<number | undefined>(async (resolve) => {
    const image = await createImageBitmap(blob);

    // TODO remove hardcoding
    const img_size = 34;
    // TODO see about starting loading this before first call
    const tensor = await import("@tensorflow/tfjs").then((tf) => {
      return tf.browser
        .fromPixels(image)
        .resizeNearestNeighbor([img_size, img_size])
        .toFloat()
        .expandDims();
    });

    const results = graphModel?.predict(tensor) as Tensor<Rank> | undefined;

    const predictions = results?.arraySync();
    const classIdx = results?.as1D().argMax().dataSync()[0];
    resolve(classIdx);
  });
}

async function inferImageUrl(url: string, graphModel: GraphModel) {
  // web workers don't have access to Image() so we have to do this instead
  const response = await fetch(url);
  const blob = await response.blob();
  return inferImageBlob(blob, graphModel);
}

async function loadModel() {
  // This function has multiple changes to defer loading of the model to after the paint but before an infer is called
  if (typeof window !== "undefined") {
    // TODO add json check for 'format' === 'graph-model'

    // Backend seems to get auto imported on a regular import, but with this method, you see "Error: No backend found in registry" if you don't explicitly import here
    await import("@tensorflow/tfjs-backend-webgl");
    console.timeEnd("Imported tfjs-backend-webgl");
    const { loadGraphModel } = await import("@tensorflow/tfjs-converter");
    const json = await import("@/model_files/labels.json");
    const graphModel = await loadGraphModel("/tfjs_graph_model/model.json");
    return { graphModel, labels: json.labels };
  } else {
    return { graphModel: undefined, labels: [] as string[] };
  }
}
