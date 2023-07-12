import React, { RefObject, useEffect, useMemo } from "react";
import DropZone from "./DropZone";
import type { Box } from "./SelectionContainer";

import { Crop } from "@/hooks/useFFmpeg";
import useThrottledResizeObserver from "@/hooks/useThrottledResizeObserver";
import styles from "@/styles/VideoControl.module.css";
import type { DropEvent, FileRejection, FileWithPath } from "react-dropzone";
import dynamic from "next/dynamic";
import SelectionContainer from "./SelectionContainer";

const MultiRangeSlider = dynamic(
  () => import("./multiRangeSlider/MultiRangeSlider"),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  }
);

type Props = {
  stopTime: number;
  startTime: number;
  setStopTime(time: number): void;
  setStartTime(time: number): void;
  vidSrc: string;
  setVidSrc(src: string): void;
  fileSelectCb?(file: File): void;
  selecting: boolean;
  crops: Crop[];
  setCrops(crops: Crop[]): void;
  vidRef: RefObject<HTMLVideoElement>;
  vidDimensionsCb?: (width: number, height: number) => void;
  hideRange?: boolean;
};

const vidScale = 60; // The underlying component's value rounding can cause some resolution issues so this scale provides better granularity
const secToStr = (val: number) =>
  new Date((val / vidScale) * 1000).toISOString().slice(11, 22);
const rangeValToSec = (val: number) => Math.round((val / vidScale) * 100) / 100;

const VideoControl = (props: Props) => {
  const { vidRef, hideRange, vidDimensionsCb } = props;
  const { width = 1, height = 1 } = useThrottledResizeObserver(500, vidRef);
  const haveVid = props.vidSrc !== "";

  const videoWidth = vidRef.current?.videoWidth;
  const videoHeight = vidRef.current?.videoHeight;

  const vidRatio = useMemo(() => {
    return {
      w_ratio: width / (videoWidth ?? width),
      h_ratio: height / (videoHeight ?? height),
    };
  }, [width, videoWidth, height, videoHeight]);

  useEffect(() => {
    vidDimensionsCb?.(videoWidth ?? 0, videoHeight ?? 0);
  }, [videoWidth, videoHeight, vidDimensionsCb]);

  // Determine max value for time range
  const vidLength = vidRef.current?.duration ?? 0;
  const timeRangeMax = (vidLength ? vidLength : 0) * vidScale;

  function loadVid(file: File | undefined) {
    if (file) {
      URL.revokeObjectURL(props.vidSrc);

      // Reset times so that min/max logic works as expected on load/change
      props.setStartTime(-1);
      props.setStopTime(-1);
      props.setVidSrc(URL.createObjectURL(file));
      props.fileSelectCb?.(file);
    }
  }

  const handleSelectionChange = (selections: Box[]) => {
    props.setCrops(selections as Crop[]);
  };

  const handleRangeChange = ({ min, max }: { min: number; max: number }) => {
    // de-scale value
    const adjustedMin = rangeValToSec(min);
    const adjustedMax = rangeValToSec(max);
    // determine if min or max changed and update the video timestamp to match
    // this will give the user a peview when dragging
    if (vidRef.current) {
      if (adjustedMin !== props.startTime) {
        vidRef.current.currentTime = adjustedMin;
      } else if (adjustedMax !== props.stopTime) {
        vidRef.current.currentTime = adjustedMax;
      }
    }

    // track changes
    props.setStopTime(adjustedMax); // change stop first so that start time updates the video time last if both changed
    props.setStartTime(adjustedMin);
  };

  function handleVidSelection(
    acceptedFiles: FileWithPath[],
    fileRejections: FileRejection[],
    event: DropEvent
  ): void {
    loadVid(acceptedFiles[0]);
  }

  const vidStyle = haveVid ? { display: "initial" } : { display: "none" };

  return (
    <div className={styles.VideoControl}>
      {!haveVid && (
        <span className="addDropShadow">
          <DropZone onFileChange={handleVidSelection} />
        </span>
      )}
      <>
        <SelectionContainer
          className={styles.test}
          selections={props.crops as Box[]}
          onSelectionChange={handleSelectionChange}
          selecting={props.selecting}
          showSelections
          ratio={vidRatio}
        >
          <video
            ref={props.vidRef}
            src={props.vidSrc}
            controls={!props.selecting}
            playsInline
            style={vidStyle}
            muted
          />
        </SelectionContainer>
        {timeRangeMax > 0 && !hideRange && (
          <div className={styles.RangeContainer}>
            <span>Clip Range</span>
            <MultiRangeSlider
              min={0}
              max={timeRangeMax}
              step={0.01}
              convertValCb={secToStr}
              onChange={handleRangeChange}
            />
          </div>
        )}
      </>
    </div>
  );
};

export default VideoControl;
