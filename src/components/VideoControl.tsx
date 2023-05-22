import React, { RefObject, useMemo, useState } from "react";
import DropZone from "./DropZone";
import SelectionContainer, { Box } from "./SelectionContainer";
import { Crop } from "@/hooks/useFFmpeg";
import MultiRangeSlider from "./multiRangeSlider/MultiRangeSlider";
import useThrottledResizeObserver from "@/hooks/useThrottledResizeObserver";
import styles from "@/styles/VideoControl.module.css";

type Props = {
  stopTime: number;
  startTime: number;
  setStopTime(time: number): void;
  setStartTime(time: number): void;
  vidSrc: string;
  setVidSrc(src: string): void;
  selecting: boolean;
  crops: Crop[];
  setCrops(crops: Crop[]): void;
  vidRef: RefObject<HTMLVideoElement>;
};

const vidScale = 60; // The underlying component's value rounding can cause some resolution issues so this scale provides better granularity
const secToStr = (val: number) =>
  new Date((val / vidScale) * 1000).toISOString().slice(11, 22);
const rangeValToSec = (val: number) => Math.round((val / vidScale) * 100) / 100;

const VideoControl = (props: Props) => {
  const { vidRef } = props;
  const { width = 1, height = 1 } = useThrottledResizeObserver(500, vidRef);

  const vidRatio = useMemo(() => {
    return {
      w_ratio: width / (vidRef.current?.videoWidth ?? width),
      h_ratio: height / (vidRef.current?.videoHeight ?? height),
    };
  }, [width, vidRef.current?.videoWidth, height, vidRef.current?.videoHeight]);

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

  const haveVid = props.vidSrc !== "";

  return (
    <>
      {!haveVid && <DropZone fileSelectedCb={loadVid} />}
      {haveVid && (
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
              muted
            />
          </SelectionContainer>
          {timeRangeMax > 0 && (
            <div className={styles.RangeContainer}>
              <span>Clip Range</span>
              {/* TODO Might be better to use https://zillow.github.io/react-slider/ or Mui probably has a double slider*/}
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
      )}
    </>
  );
};

export default VideoControl;
