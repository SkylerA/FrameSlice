// This is taken from https://codesandbox.io/s/use-resize-observer-throttle-and-debounce-8uvsg?file=/src/index.js which was linked from https://www.npmjs.com/package/use-resize-observer
import { useState, useMemo } from "react";
import type { RefObject, RefCallback } from "react";
import useResizeObserver from "use-resize-observer";
import throttle from "lodash.throttle";

interface Size {
  width?: number;
  height?: number;
}

const useThrottledResizeObserver = (
  wait: number,
  elementRef: RefObject<HTMLElement>
): { ref: RefCallback<HTMLElement>; width?: number; height?: number } => {
  const [size, setSize] = useState<Size>({});
  const onResize = useMemo(() => throttle(setSize, wait), [wait]);
  const { ref } = useResizeObserver<HTMLElement>({ ref: elementRef, onResize });

  // TODO check docs on how to merge refs
  return { ref, ...size };
};

export default useThrottledResizeObserver;
