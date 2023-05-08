import { useMemo, useRef, useState } from "react";
import VidParser from "@/components/VidParser";
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
    parseVideo(file, cropData, data, handleCropResults);
  };

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cropData, setCropData] = useState<Crop[]>([]);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [cropUrls, setCropUrls] = useState<string[]>([]);

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

  const handleSelectionChange = (selections: Box[]) => {
    setCropData(selections as Crop[]);
  };

  console.log(vidRatio);

  return (
    <div className={styles.VidCropper}>
      <SelectionContainer
        selections={cropData as Box[]}
        onSelectionChange={handleSelectionChange}
        selecting={selecting}
        showSelections
        ratio={vidRatio}
      >
        <VidParser
          videoRef={videoRef}
          // cb={gg_classify}
          // cb={football_ocr}
          // cb={void ocr_parallel}
          //   crops={cropData}
          //   details={details}
          controls={!selecting}
        />
      </SelectionContainer>

      <div className={styles.settings}>
        <form onSubmit={handleSubmit(onCropSubmit)}>
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
          {cropData.map((crop, idx) => (
            <div key={idx}>{JSON.stringify(crop)}</div>
          ))}
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
