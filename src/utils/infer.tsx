export function RgbToL(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  return (max + min) / 2;
}

export function getPixelData(
  url: string,
  x: number,
  y: number,
  context: CanvasRenderingContext2D
): Promise<ImageData> {
  // Return a promise so we can await the result
  return new Promise((resolve, reject) => {
    const img = new Image();
    // When image is loaded get pixel data and return Luminance
    img.onload = () => {
      // In js you have to draw the image to a canvas to get the pixel data unless you want to manually parse the image format
      context.canvas.width = img.width;
      context.canvas.height = img.height;
      context.drawImage(img, 0, 0);

      // return pixel data for given coordinate
      resolve(context.getImageData(x, y, img.width, img.height));
    };
    img.onerror = reject;
    // Start image load
    img.src = url;
  });
}

export function LuminanceThreshold(
  pixel: ImageData,
  threshold: number
): boolean {
  if (pixel.data.length > 3) {
    // Get RGB values
    const r = pixel.data[0];
    const g = pixel.data[1];
    const b = pixel.data[2];

    // Calculate luminance
    const lum = RgbToL(r, g, b);

    // Threshold
    return lum > threshold;
  } else {
    return false;
  }
}

export type InferFn = (
  fileUrl: string,
  cropId: string,
  frameIdx: number,
  context: CanvasRenderingContext2D | null
) => Promise<Record<string, any>>;

export const infer_no_op: InferFn = async function (
  fileUrl,
  btnId,
  frameIdx,
  context
) {
  return {};
};
