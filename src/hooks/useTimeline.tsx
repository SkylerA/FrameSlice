import { useMarkerCache } from "@/components/inputTimeline/SvgMarkerCacheContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { useDevicePixelRatio } from "use-device-pixel-ratio";

export type Marker = {
  frame: number;
  label: string;
  tag: string;
};

let frame_w = 0;

export function useTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null); // sma loosen this up later
  // TODO currenlty have to use scrollRef to get a value scroll val as scrollVal goes stale when called from getFrameIdx, but then removing the scroll state results in the timeline not updating on scroll so we still (currently) need the state to force a re-draw... this should get fixed up eventually
  const scrollRef = useRef<HTMLInputElement>(null);

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [scrollVal, setScrollVal] = useState(0);
  // const [frame_w, setFrame_w] = useState(0);

  // TODO ensure we only create one instance of the cache
  const { getImg } = useMarkerCache();
  const ratio = useDevicePixelRatio({ maxDpr: +Infinity, round: false });

  // Pre-determine the highest row count
  // Group by frameNumber then find the biggest group to determine our canvas height
  const framesWithInputs = groupBy(markers ?? [], (x) => x && x.frame);
  const maxRows = Object.entries(framesWithInputs).reduce(
    (highestCount, group) => Math.max(highestCount, group[1].length),
    0
  );

  // Main Draw useEffect
  useEffect(() => {
    // Define drawing sizes
    // Had to move this into a useEffect because Next.js was trying to run the code server-side
    frame_w =
      1.25 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const canvas_h = maxRows * frame_w; // currently assuming markers w/h is uniform

    const ctx = canvasRef.current?.getContext("2d");
    const parent = parentRef.current;
    if (ctx && parent) {
      ctx.scale(ratio, ratio);
      const w = parent.offsetWidth;
      // const h = parent.offsetHeight;
      const h = canvas_h;

      // Scale and resize canvas to match browser resolution
      resizeCanvas(canvasRef, w, h);

      // Draw Timeline
      draw(ctx, w, h);
    }
  });

  const resizeCanvas = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    w: number,
    h: number
  ) => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Size canvas drawing area for current pixel density
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      // Resize rendered canvas size to the parent container size
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  };

  // Draw the canvas
  const draw = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // reset our y index counts
    frameMarkerCounts = [];
    ctx.clearRect(0, 0, width, height);
    //   ctx.fillRect(0, 0, width, height);

    // Draw markers
    markers?.map((marker) => drawMarker(ctx, marker));
  };

  // Draw Marker
  const drawMarker = (ctx: CanvasRenderingContext2D, marker: Marker) => {
    const frameNum = marker.frame;
    const size = frame_w * ratio;
    const scrollVal = scrollRef.current?.valueAsNumber ?? 0;
    // scrollVal is the number of frame we want to start from
    const x = marker.frame * size - scrollVal * size;
    const y = getNextYIdx(frameNum) * size;

    // TODO fix type safety on marker type so that an array of markers must contain a tag... this might be because not all files are tsx yet
    if (!marker.label) {
      // TODO error
      console.log(`Error: Marker label isn't defined`, marker);
      return;
    }

    if (!marker.tag) {
      // TODO error
      console.log(`Error: Marker tag isn't defined`, marker);
      return;
    }

    if (marker.label === "invalid") {
      // skip entries explicitly marked as invalid
      return;
    }

    const img = getImg(marker.tag, marker.label, size);
    if (img) {
      ctx.drawImage(img, x, y);
    } else {
      // TODO load clips from server and watch console, this seems to fire a lot. Maybe it's trying to draw before svg's have been cached?
      console.log("img isn't valid", marker.tag, marker.label, size);
    }
  };

  const getFrameIdx = useCallback(
    (x_coord: number) => {
      const scroll = scrollRef.current?.valueAsNumber ?? 0;
      return Math.floor(x_coord / frame_w) + scroll;
    },
    [scrollRef]
  );

  // TODO add useCallback
  return [
    markers,
    setMarkers,
    scrollVal,
    setScrollVal,
    getFrameIdx,
    canvasRef,
    parentRef,
    scrollRef,
  ] as const; // sma adding const to fix ambiguous type inference when calling useTimeline()
}

// track how many markers are on a given frameIdx
let frameMarkerCounts: number[] = [];
const getNextYIdx = (frameNum: number) => {
  // get marker count for given frame
  const count = frameMarkerCounts[frameNum] ?? 0;
  // incr for next get
  frameMarkerCounts[frameNum] = count + 1;

  return count;
};

// groupBy provide by https://stackoverflow.com/a/62765924/81008
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groupBy = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);
