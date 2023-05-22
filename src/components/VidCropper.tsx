import { useCallback, useRef, useState } from "react";
import { NextComponentType } from "next";
import useFFmpeg, { Crop } from "@/hooks/useFFmpeg";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import Card from "@/components/Card";
import { Json } from "./CropFileLoader";
import CropResults from "./CropResults";
import FrameControls, { FrameControlValues } from "./FrameControls";
import CropControls from "./CropControls";
import VideoControl from "./VideoControl";

import styles from "@/styles/VidCropper.module.css";

type Props = {};

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
  const [cropResults, setCropResults] = useState<CropResult[]>([]);
  const [cropData, setCropData] = useState<Crop[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [stopTime, setStopTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const cropDisabled = vidSrc === "" || cropData.length < 1;

  const editCropsCb = useCallback((crops: Crop[]) => {
    setCropData(crops);
  }, []);

  const setSelectingCb = useCallback((selecting: boolean) => {
    setSelecting(selecting);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [parseProgress, setParseProgress] = useState<number>(100);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ffmpeg, ffmpegReady, parseVideo, getParseName] = useFFmpeg();

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
    parseVideo(
      file,
      cropData,
      details,
      handleCropResults,
      frameVals.outputMode,
      ffmpegProgressCb
    );
  }

  return (
    <div className={styles.VidCropper}>
      <VideoControl
        selecting={selecting}
        crops={cropData}
        setCrops={setCropData}
        vidRef={videoRef}
        vidSrc={vidSrc}
        setVidSrc={setVidSrc}
        startTime={startTime}
        setStartTime={setStartTime}
        stopTime={stopTime}
        setStopTime={setStopTime}
      />

      <Card>
        <CropControls
          parseFramesFileJson={parseFramesFileJson}
          editCropsCb={editCropsCb}
          cropData={cropData}
          selecting={selecting}
          setSelecting={setSelectingCb}
        />
      </Card>

      <Card>
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
