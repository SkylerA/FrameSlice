import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NextComponentType } from "next";
import { useDropzone } from "react-dropzone";
import { useForm, SubmitHandler } from "react-hook-form";
import useFFmpeg from "@/hooks/useFFmpeg";
import useThrottledResizeObserver from "@/hooks/useThrottledResizeObserver";
import type { Box } from "@/components/SelectionContainer";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type { ParseDetails } from "@/hooks/useFFmpeg";
import Card from "@/components/Card";
import CropFileLoader, { Json } from "./CropFileLoader";
import CropTable from "./CropTable";
import MultiRangeSlider from "./multiRangeSlider/MultiRangeSlider";
import SelectionContainer from "@/components/SelectionContainer";
import Tooltip from "@mui/material/Tooltip";

import styles from "@/styles/VidCropper.module.css";

import CropResults from "./CropResults";
import FrameControls, { FrameControlValues } from "./FrameControls";

type Props = {};

export type Crop = {
  // x,y,width,height allow strings for passing of ffmpeg expressions like "in_w-50"
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  name: string;
};

type FramesCrop = {
  cropH: string;
  cropW: string;
  xOff: string;
  yOff: string;
};

type FramesParseObj = {
  crop: FramesCrop;
  filterName?: string;
  UID?: string;
  procParams: { parseProcName: string; proc_kwargs: unknown };
};

type CropResult = {
  url: string;
  name: string | undefined;
  idx: number;
  ext: string;
};

function freeUrls(results: CropResult[]) {
  results.map((result) => URL.revokeObjectURL(result.url));
}

const vidScale = 60; // The underlying component's value rounding can cause some resolution issues so this scale provides better granularity
const secToStr = (val: number) =>
  new Date((val / vidScale) * 1000).toISOString().slice(11, 22);

const rangeValToSec = (val: number) => Math.round((val / vidScale) * 100) / 100;

function FramesParseObjToCrop(obj: FramesParseObj): Crop {
  const { crop, filterName, UID } = obj;
  return {
    x: crop.xOff,
    y: crop.yOff,
    width: crop.cropW,
    height: crop.cropH,
    name: filterName ?? UID ?? "",
  };
}

const baseStyle = {
  display: "flex",
  flexDirection: "column" as const, // Tyescript complains otherwise...
  justifyContent: "center",
  backgroundColor: "var(--card-bg)",
  color: "var(--card-fg)",
  outline: "none",
  cursor: "pointer",
  height: "10rem",
  width: "20rem",
};

const VidCropper: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const [vidSrc, setVidSrc] = useState<string>("");
  const [selecting, setSelecting] = useState<boolean>(false);
  const [cropResults, setCropResults] = useState<CropResult[]>([]);
  const [cropData, setCropData] = useState<Crop[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [stopTime, setStopTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const cropDisabled = vidSrc === "" || cropData.length < 1;

  const editCropsCb = useCallback((crops: Crop[]) => {
    setCropData(crops);
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [parseProgress, setParseProgress] = useState<number>(100);

  const { width = 1, height = 1 } = useThrottledResizeObserver(500, videoRef);
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: { "video/*": [] },
    multiple: false,
  });

  const vidRatio = useMemo(() => {
    return {
      w_ratio: width / (videoRef.current?.videoWidth ?? width),
      h_ratio: height / (videoRef.current?.videoHeight ?? height),
    };
  }, [
    width,
    videoRef.current?.videoWidth,
    height,
    videoRef.current?.videoHeight,
  ]);

  // Determine max value for time range
  const vidLength = videoRef.current?.duration ?? 0;
  const timeRangeMax = (vidLength ? vidLength : 0) * vidScale;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ffmpeg, ffmpegReady, parseVideo, getParseName] = useFFmpeg();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ParseDetails>();

  useEffect(() => {
    const file = acceptedFiles[0];
    loadVid(file);
  }, [JSON.stringify(acceptedFiles)]);

  function ffmpegProgressCb(progress: { ratio: number }) {
    setParseProgress(progress.ratio * 100);
  }

  const handleCropResults = async (files: string[], ffmpeg: FFmpeg) => {
    freeUrls(cropResults); // Free previous crop img memory

    const newResults = [];
    for (const file of files) {
      // load next image
      const data = ffmpeg.FS("readFile", file);
      const blob = new Blob([data.buffer], { type: "image/png" });

      // Create a URL
      const url = URL.createObjectURL(blob);
      const { name, idx, ext } = getParseName(file) ?? "";

      // clean up the ffmpeg files
      ffmpeg.FS("unlink", file);

      newResults.push({ url, name, idx, ext });

      // update the results in chunks to avoid some thrash
      const imgChunks = 10;
      if (newResults.length % imgChunks === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0)); // Allow time for re-render
        setCropResults(newResults.slice());
      }
    }

    setLoading(false);
    setCropResults(newResults);
  };

  function parseFramesFileJson(json: Json) {
    if (json) {
      const frames = json as FramesParseObj[];
      const crops = frames.map((filter) => FramesParseObjToCrop(filter));
      setCropData(crops);
    }
  }

  const handleSelectionChange = (selections: Box[]) => {
    setCropData(selections as Crop[]);
  };

  function loadVid(file: File | undefined) {
    if (file) {
      URL.revokeObjectURL(vidSrc);

      // Reset times so that min/max logic works as expected on load/change
      setStartTime(-1);
      setStopTime(-1);
      setVidSrc(URL.createObjectURL(file));
    }
  }

  const handleRangeChange = ({ min, max }: { min: number; max: number }) => {
    // de-scale value
    const adjustedMin = rangeValToSec(min);
    const adjustedMax = rangeValToSec(max);
    // determine if min or max changed and update the video timestamp to match
    // this will give the user a peview when dragging
    if (videoRef.current) {
      if (adjustedMin !== startTime) {
        videoRef.current.currentTime = adjustedMin;
      } else if (adjustedMax !== stopTime) {
        videoRef.current.currentTime = adjustedMax;
      }
    }

    // track changes
    setStopTime(adjustedMax); // change stop first so that start time updates the video time last if both changed
    setStartTime(adjustedMin);
  };

  // TODO useCallback
  function cropVidCb(frameVals: FrameControlValues): void {
    const frameRate =
      frameVals.frameRateMode === "custom"
        ? { frameRate: frameVals.frameRate }
        : {};
    const frameCount =
      frameVals.frameCount > 0 ? { frameCount: frameVals.frameCount } : {};

    const details = { ...frameRate, ...frameCount, startTime, stopTime };
    const file = videoRef.current?.src ?? "";
    setCropResults([]);
    setLoading(true);
    parseVideo(file, cropData, details, handleCropResults, ffmpegProgressCb);
  }

  return (
    <div className={styles.VidCropper}>
      {vidSrc === "" && (
        <div>
          <div
            {...getRootProps({
              className: "dropzone gradient-border",
              style: { ...baseStyle },
            })}
          >
            <input {...getInputProps()} />
            <p>Drag a Video here</p>
            <p>or</p>
            <p>Click to select a file</p>
          </div>
        </div>
      )}
      {vidSrc !== "" && (
        <>
          <SelectionContainer
            className={styles.test}
            selections={cropData as Box[]}
            onSelectionChange={handleSelectionChange}
            selecting={selecting}
            showSelections
            ratio={vidRatio}
          >
            <video
              ref={videoRef}
              src={vidSrc}
              controls={!selecting}
              playsInline
              muted
            />
          </SelectionContainer>
          {timeRangeMax > 0 && (
            <div className={styles.RangeContainer}>
              <span>Clip Range</span>
              {/* TODO Might be better to use https://zillow.github.io/react-slider/ */}
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

      <Card>
        <div className={styles.cropControls}>
          <h2>Crop Regions</h2>
          <span className={styles.cropLoad}>
            <Tooltip
              arrow
              title="Click and drag on video frame to create crop areas"
              sx={{ display: "flex" }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={selecting}
                  onChange={(e) => setSelecting(e.currentTarget.checked)}
                />
                Select Crop Areas
              </label>
            </Tooltip>
            <span>or</span>
            <CropFileLoader parseJsonCb={parseFramesFileJson} />
          </span>
          <CropTable crops={cropData} editCb={editCropsCb} />
        </div>
      </Card>

      <Card className={styles.controls}>
        <FrameControls cropCb={cropVidCb} cropDisabled={cropDisabled} />
      </Card>
      {(cropResults.length > 0 || loading) && (
        <Card>
          <CropResults cropResults={cropResults} loading={loading} />
        </Card>
      )}
    </div>
  );
};

export default VidCropper;
