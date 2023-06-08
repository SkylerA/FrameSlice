export const loadModel = async () => {
  // This function has multiple changes to defer loading of the model to after the paint but before an infer is called
  //
  if (typeof window !== "undefined") {
    // TODO add json check for 'format' === 'graph-model'
    console.time("Imported tfjs-backend-webgl");
    // Backend seems to get auto imported on a regular import, but with this method, you see "Error: No backend found in registry" if you don't explicitly import here
    await import("@tensorflow/tfjs-backend-webgl");
    console.timeEnd("Imported tfjs-backend-webgl");
    const { loadGraphModel } = await import("@tensorflow/tfjs-converter");
    const json = await import("@/model_files/labels.json");
    const graphModel = await loadGraphModel("./tfjs_graph_model/model.json");
    return { graphModel, labels: json.labels };
  } else {
    return { graphModel: undefined, labels: [] };
  }
};

// export const inferImage = async (url: string, graphModel: GraphModel) => {
//   return new Promise<number | undefined>(async (resolve) => {
//     const tensor = await imageUrlToTensor(url, { w: 34, h: 34 });
//     const classIdx = await inferTensor(tensor, graphModel);
//     resolve(classIdx);
//   });
// };

// export const inferTensor = async (tensor: Tensor, graphModel: GraphModel) => {
//   return new Promise<number | undefined>((resolve) => {
//     const results = graphModel?.predict(tensor) as Tensor<Rank> | undefined;
//     const classIdx = results?.as1D().argMax().dataSync()[0];
//     resolve(classIdx);
//   });
// };

// export const imageUrlToTensor = async (
//   url: string,
//   size: { w: number; h: number }
// ) => {
//   return new Promise<Tensor>((resolve) => {
//     const image = new Image();
//     image.src = url;
//     image.onload = async () => {
//       // TODO see about starting loading this before first call
//       const tensor = await import("@tensorflow/tfjs").then((tf) => {
//         return tf.browser
//           .fromPixels(image)
//           .resizeNearestNeighbor([size.h, size.w])
//           .toFloat()
//           .expandDims();
//       });
//       resolve(tensor);
//     };
//   });
// };
