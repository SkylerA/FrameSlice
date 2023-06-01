import { Marker, useTimeline } from "@/hooks/useTimeline";
import React, { useEffect, useCallback } from "react";

type Props = {
  markers: Marker[];
  relativeIdx?: number;
  onSelect: (
    frameNum: number,
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => void;
  // TODO determine if there are any performance issues from firing onHover frequently
  onHover: (
    frameNum: number,
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => void;
};

const TimelineCanvas = (props: Props) => {
  const [
    _, // eslint-disable-line @typescript-eslint/no-unused-vars
    setMarkers,
    scrollVal,
    setScrollVal,
    getFrameIdx,
    canvasRef,
    parentRef,
    scrollRef,
  ] = useTimeline();
  const { markers, onSelect, onHover, relativeIdx = 0 /*, ...rest*/ } = props;
  // Find the min and max frame numbers provided
  const frame_range = markers?.reduce(
    (min_max, marker) => {
      const min = Math.min(min_max.min, marker.frame);
      const max = Math.max(min_max.max, marker.frame);
      return { min, max };
    },
    { min: markers[0]?.frame ?? 0, max: markers[0]?.frame ?? 0 }
  );

  // Pass any marker changes to useTimeline
  useEffect(() => {
    setMarkers(markers ?? []);
  }, [markers]);

  // return the x coord of the mouse relative to the target in the given event
  const getX = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    return e.clientX - e.currentTarget?.getBoundingClientRect().left ?? 0;
  }, []);

  // Handle clicks and fire onSelect callback
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const frame = relativeIdx + getFrameIdx(getX(e));
      onSelect(frame, e);
    },
    []
  );

  // Handle hover and fire onHover callback
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const frame = relativeIdx + getFrameIdx(getX(e));
      onHover(frame, e);
    },
    []
  );

  // Set hover frame to -1 on mouse exit
  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      onHover(-1, e);
    },
    []
  );

  return (
    <>
      <div>
        <div ref={parentRef}>
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        <input
          ref={scrollRef}
          className="TimelineCanvas-slider"
          type="range"
          // min={frame_min}
          // TODO improve right edge rendering/padding
          style={{ width: "calc(calc(100vw - calc(100vw - 100%)) - 0.25rem)" }}
          value={scrollVal}
          min={frame_range.min}
          max={frame_range.max}
          onChange={(e) => setScrollVal(e.target.valueAsNumber)}
        />
      </div>
    </>
  );
};

// SMA settings default so markers.reduce/map doesn't cause issues, this is hard to see down here tho
// currently leaving `markers ?? []` in portions of the code just incase this gets removed
TimelineCanvas.defaultProps = { markers: [] };

export default TimelineCanvas;
