import { useState } from "react";
import { renderToString } from "react-dom/server";
import {
  markerParams,
  generic_svg_fn,
  MarkerParamType,
} from "./SvgCache_Markers";

export interface getImgIntf {
  (tag: string, label: string, size: number): HTMLImageElement | undefined;
}

export interface addSvgCreateIntf {
  (key: string, createFn: svgCreateIntf): void;
}
export interface svgCreateIntf {
  (params: MarkerParamType, size: number, held: boolean): JSX.Element;
}

export const useSvgCache = () => {
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [createFns, setCreateFns] = useState<{
    [key: string]: svgCreateIntf;
  }>({});

  // Converts an SVG containing JSX.Element to a URI that can be used as an image.src
  const svgComponentToStr = (svg: JSX.Element) => {
    // using typically server sided renderToString to convert svg.
    // excellent explanation of handling unicode https://stackoverflow.com/a/31412163/81008
    const svgStr = encodeURIComponent(renderToString(svg));
    return "data:image/svg+xml," + svgStr;
  };

  // Returns a cached copy of an image for drawing to a canvas
  // This looks up the svg reference by {label} and renders at {size}
  // TODO see if there is a better way than getImgFn interface
  const getImg: getImgIntf = (tag: string, label: string, size: number) => {
    // Determine if the button is held, if so, use non held label and we'll pass the held state as meta data to the render function
    const heldSuffix = "_h";
    const held = label.toLowerCase().endsWith(heldSuffix);
    const lookupLabel = label
      .toLowerCase()
      .substring(0, label.length - (held ? heldSuffix.length : 0));

    // Currently appending size to allow caching of different sizes
    // The alternative would be clearing the cache each time size changes which would require a bit of a refactor on how size is used
    const mapStr = `${label}_${size}`;
    // If image isn't in cache
    if (!images[mapStr]) {
      if (!(tag in markerParams)) {
        console.log(markerParams);
        console.log(`Couldn't find tag "${tag}" in markerParams`);
      }

      const params = markerParams[tag].markers.find(
        (marker) => marker.label.toLowerCase() === lookupLabel
      );
      if (!params) {
        console.log(
          `⚠getImg: params for label ${label} are undefined. Make sure that this label has an entry in SvgCache_Markers.tsx`
        );
      } else if (!(params.tag in createFns)) {
        console.log(`getImg: couldn't find tag "${params.tag}" in createFns`);
      }

      // Generate SVG
      // use a generic function if params are invalid
      const svg = params
        ? createFns[params.tag](params, size, held)
        : generic_svg_fn(label, size);

      // Convert to image uri and cache the image
      const image = new Image();
      image.src = svgComponentToStr(svg);
      setImages((prevImages) => ({ ...prevImages, [mapStr]: image }));
    }

    return images[mapStr];
  };

  // Sets a create svg callback for the given `key`, the create fn will be used
  // in `getImg` when a marker's `tag` field matches the `key`
  const addSvgCreateFn: addSvgCreateIntf = (
    key: string,
    createFn: svgCreateIntf
  ) => {
    setCreateFns((prevLookup) => ({ ...prevLookup, [key]: createFn }));
  };

  // TODO add a clear function?
  // TODO should these have useCallback? Initial attempt to make getImg a useCallback resulted in an infinite loop. more investigation needed
  return [getImg, addSvgCreateFn] as const;
};
