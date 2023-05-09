import { useCallback, useMemo, useRef, useState } from "react";
import type { ParseDetails } from "@/components/VidParser";
import SelectionContainer from "@/components/SelectionContainer";
import type { Box } from "@/components/SelectionContainer";
import useThrottledResizeObserver from "@/hooks/useThrottledResizeObserver";
import styles from "@/styles/VidCropper.module.css";
import { NextComponentType } from "next";
import { useForm, SubmitHandler } from "react-hook-form";
import useFFmpeg from "@/hooks/useFFmpeg";
import CropFileLoader, { Json } from "./CropFileLoader";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import CropTable from "./CropTable";

type Props = {};

export type Crop = {
  // x,y,width,height allow strings for passing of ffmpeg expressions like "in_w-50"
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  name: string;
};

function freeUrls(urls: string[]) {
  urls.map((url) => URL.revokeObjectURL(url));
}

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

const VidCropper: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const [vidSrc, setVidSrc] = useState<string>("");
  const [selecting, setSelecting] = useState<boolean>(false);
  const [cropUrls, setCropUrls] = useState<string[]>([]);
  const [cropData, setCropData] = useState<Crop[]>([]);

  const editCropsCb = useCallback((crops: Crop[]) => {
    setCropData(crops);
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [parseProgress, setParseProgress] = useState<number>(100);

  const { width = 1, height = 1 } = useThrottledResizeObserver(500, videoRef);

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

  const details: ParseDetails = {
    frameCount: 10,
    startTime: 32,
    frameRate: 1,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ffmpeg, ffmpegReady, parseVideo] = useFFmpeg();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ParseDetails>();

  const onCropSubmit: SubmitHandler<ParseDetails> = (data) => {
    console.log(data);

    const file = videoRef.current?.src ?? "";
    parseVideo(file, cropData, data, handleCropResults, ffmpegProgressCb);
  };

  function ffmpegProgressCb(progress: { ratio: number }) {
    setParseProgress(progress.ratio * 100);
  }

  const handleCropResults = (files: string[], ffmpeg: FFmpeg) => {
    console.log(files);
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
    }

    setCropUrls(newCropUrls);
  };

  function parseFramesFileJson(json: Json) {
    if (json) {
      console.log(json);
      const frames = json as FramesParseObj[];
      const crops = frames.map((filter) => FramesParseObjToCrop(filter));
      setCropData(crops);
    }
  }

  const handleSelectionChange = (selections: Box[]) => {
    setCropData(selections as Crop[]);
  };

  function handleVideoSelected(e: React.ChangeEvent<HTMLInputElement>): void {
    URL.revokeObjectURL(vidSrc);
    const file = e.currentTarget.files?.[0];
    if (file) {
      // void parseVideo(file, tempCrops, {} as ParseDetails);
      setVidSrc(URL.createObjectURL(file));
    }
  }

  return (
    <div className={styles.VidCropper}>
      <SelectionContainer
        selections={cropData as Box[]}
        onSelectionChange={handleSelectionChange}
        selecting={selecting}
        showSelections
        ratio={vidRatio}
      >
        <video ref={videoRef} src={vidSrc} controls={!selecting} />
      </SelectionContainer>

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
              Start Time
              <input type="number" {...register("startTime")} />
            </label>
          </div>
          <div>
            {/* TODO Add note about stop time being possibly limited by frame count */}
            <label>
              Stop Time
              <input type="number" {...register("stopTime")} />
            </label>
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

          <input type="submit" value="Crop Video" />
          {parseProgress > 0 && parseProgress < 100 && (
            <progress className="ffmpeg-progress" value={parseProgress} />
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

      <div className="crop-results">
        {cropUrls.map((url, idx) => (
          <img src={url} key={url} alt={`crop-result-${idx}`} />
        ))}
      </div>
    </div>
  );
};

export default VidCropper;
