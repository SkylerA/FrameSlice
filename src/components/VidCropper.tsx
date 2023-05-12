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

import styles from "@/styles/VidCropper.module.css";

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

function freeUrls(urls: string[]) {
  urls.map((url) => URL.revokeObjectURL(url));
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
  flexDirection: "column",
  alignItems: "center",
  padding: "8rem 10rem",
  backgroundColor: "#333333",
  color: "#bdbdbd",
  outline: "none",
  margin: ".5rem",
  cursor: "pointer",
};

const VidCropper: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const [vidSrc, setVidSrc] = useState<string>("");
  const [selecting, setSelecting] = useState<boolean>(false);
  const [cropUrls, setCropUrls] = useState<string[]>([]);
  const [cropData, setCropData] = useState<Crop[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [stopTime, setStopTime] = useState<number>(0);

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
  const [ffmpeg, ffmpegReady, parseVideo] = useFFmpeg();

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

  const onCropSubmit: SubmitHandler<ParseDetails> = (data) => {
    const details = { ...data, startTime, stopTime };
    const file = videoRef.current?.src ?? "";
    parseVideo(file, cropData, details, handleCropResults, ffmpegProgressCb);
  };

  function ffmpegProgressCb(progress: { ratio: number }) {
    setParseProgress(progress.ratio * 100);
  }

  const handleCropResults = async (files: string[], ffmpeg: FFmpeg) => {
    freeUrls(cropUrls); // Free previous crop img memory

    const newCropUrls = [];
    for (const file of files) {
      // load next image
      const data = ffmpeg.FS("readFile", file);
      const blob = new Blob([data.buffer], { type: "image/png" });

      // Create a URL
      const imgUrl = URL.createObjectURL(blob);

      // clean up the ffmpeg files
      ffmpeg.FS("unlink", file);

      newCropUrls.push(imgUrl);

      // update the results in chunks to avoid some thrash
      const imgChunks = 10;
      if (newCropUrls.length % imgChunks === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0)); // Allow time for re-render
        setCropUrls(newCropUrls.slice());
      }
    }

    setCropUrls(newCropUrls);
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

  function handleVideoSelected(e: React.ChangeEvent<HTMLInputElement>): void {
    loadVid(e.currentTarget.files?.[0]);
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
            <video ref={videoRef} src={vidSrc} controls={!selecting} />
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
        <div className={styles.settings}>
          <form onSubmit={handleSubmit(onCropSubmit)}>
            <div>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelected}
              />
            </div>
            <div>
              <label>
                Frame Count
                <input
                  defaultValue={1}
                  type="number"
                  {...register("frameCount")}
                />
              </label>
            </div>
            <div>
              <label>
                Frame Rate
                <input type="number" {...register("frameRate")} />
              </label>
            </div>
            <div>
              <label>
                CMD (ignores all settings)
                <textarea {...register("ffmpegOverride")} />
              </label>
            </div>

            <input type="submit" value="Crop Video" />
            {/* FFMpeg.wasm seems to report progress in different ratios/scales depending on the cmd so this will need more work to be accurate */}
            {parseProgress > 0 && parseProgress < 100 && (
              <progress
                className="ffmpeg-progress"
                value={parseProgress}
                max={100}
              />
            )}
          </form>

          <div className="crop-controls">
            <CropFileLoader parseJsonCb={parseFramesFileJson} />
            <label>
              Select Crop Areas
              <input
                type="checkbox"
                checked={selecting}
                onChange={(e) => setSelecting(e.currentTarget.checked)}
              />
            </label>
            <CropTable crops={cropData} editCb={editCropsCb} />
          </div>
        </div>
      </Card>

      {cropUrls.length}
      <p>{parseProgress}</p>
      <div className={styles.cropResults}>
        {cropUrls.map((url, idx) => (
          <img src={url} key={url} alt={`crop-result-${idx}`} />
        ))}
      </div>
    </div>
  );
};

export default VidCropper;
