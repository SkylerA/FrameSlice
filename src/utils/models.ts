import { fetchAndZipImg } from "@/utils/zip";
import saveAs from "file-saver";
import { ImgObj } from "./data";

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

export const loadLabels = async () => {
  const json = await import("@/model_files/labels.json");
  return json.labels;
};

// Create a zip of all crops in their respective label folders
export const downloadLabels = async (objs: ImgObj[]) => {
  // TODO download prep can be very slow sometimes and page looks unresponsive. Need to investigate why this goes so slow sometimes or at least put up some progress indicator.
  // TODO need to do research on what happens in a duplicate name is added to zip, probably need to add some checks to update numbers if there is a dupe. In particular if we allow label editing and 1.png of class S get's moved to P that also has 1.png etc etc
  const JSZip = (await import("jszip")).default;

  const zip = new JSZip();

  // Add images to zip
  const promises = objs.map((obj, idx) => {
    const dir = obj.classStr;
    const zipPath = `Labels/${dir}/${idx}.png`;
    // TODO parse and use actual file extension from original image path

    // Add the file to the zip
    if (obj.file) {
      // If we are working with local files, just save the file
      zip.file(zipPath, obj.file);
      return Promise.resolve();
    } else {
      // If we don't have a file, dl the img from the url
      return fetchAndZipImg(obj.url, zip, zipPath);
    }
  });

  // Wait for all images to dl and then zip everything
  Promise.all(promises).then(() => {
    zip.generateAsync({ type: "blob" }).then((blob) => {
      // Prompt the user to save the file
      saveAs(blob, "classify_labels.zip");
    });
  });
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
