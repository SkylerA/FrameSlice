import { useCallback, useRef, useState } from "react";
import { NextComponentType } from "next";
import useFFmpeg, { Crop } from "@/hooks/useFFmpeg";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import Card from "@/components/Card";
import { Json } from "./CropFileLoader";
import CropResults, { CropResult } from "./CropResults";
import FrameControls, { FrameControlValues } from "./FrameControls";
import CropControls from "./CropControls";
import VideoControl from "./VideoControl";
import mime from "mime/lite";

import styles from "@/styles/VidCropper.module.css";

// Tensorflow
import { GraphModel } from "@tensorflow/tfjs-converter";
import { IOHandler } from "@tensorflow/tfjs-core/dist/io/types";
import { inferImage, loadModel } from "@/utils/models";
import { FramesParseObj, FramesParseObjToCrop } from "@/utils/parse";

type Props = {};

function freeUrls(results: CropResult[]) {
  results.map((result) => URL.revokeObjectURL(result.url));
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
  const [model, setModel] = useState<GraphModel | null>(null);

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

  const storeCropsNoInfer = async (files: string[], ffmpeg: FFmpeg) => {
    freeUrls(cropResults); // Free previous crop img memory

    const newResults = [];
    for (const file of files) {
      // load next image
      const data = ffmpeg.FS("readFile", file);
      const type = mime.getType(file) ?? "image/png"; // determine file type or default to png
      const blob = new Blob([data.buffer], { type });

      // Create a URL
      const url = URL.createObjectURL(blob);
      const { name, idx, ext } = getParseName(file) ?? "";

      // clean up the ffmpeg file
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

  function storeModel(graphModel: GraphModel<string | IOHandler>): void {
    setModel(graphModel);
  }

  const inferCrops = async (files: string[], ffmpeg: FFmpeg) => {
    console.time("loaded model");
    const graphModel = model ?? (await loadModel(storeModel));
    console.timeEnd("loaded model");
    freeUrls(cropResults); // Free previous crop img memory

    console.time("parsing/inference");
    const newResults: CropResult[] = [];
    const inferPromises: Promise<void>[] = [];
    for (const file of files) {
      // load next image
      const data = ffmpeg.FS("readFile", file);
      const type = mime.getType(file) ?? "image/png"; // determine file type or default to png
      const blob = new Blob([data.buffer], { type });

      // Create a URL
      const url = URL.createObjectURL(blob);
      const { name, idx, ext } = getParseName(file) ?? "";

      // clean up the ffmpeg file
      ffmpeg.FS("unlink", file);

      // newResults.push({ url, name, idx, ext });

      if (ext !== "gif" && ext !== "video") {
        const inferPromise = inferImage(url, graphModel).then((val) => {
          newResults.push({ url, name, idx, ext, classIdx: val });
        });
        inferPromises.push(inferPromise);
      } else {
        newResults.push({ url, name, idx, ext });
      }

      // update the results in chunks to avoid some thrash
      const imgChunks = 10;
      if (newResults.length % imgChunks === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0)); // Allow time for re-render
        setCropResults(newResults.slice());
        console.log("not sure this works anymore");
      }
    }

    if (inferPromises.length > 0) {
      // wait for all inference steps to finish
      await Promise.all(inferPromises);
      console.log("🛑done");
    }

    console.timeEnd("parsing/inference");

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
  // TODO  useCallback
  function cropVidCb(frameVals: FrameControlValues): void {
    const frameRate =
      frameVals.frameRateMode === "custom"
        ? { frameRate: frameVals.frameRate }
        : {};
    const limit = frameVals.limit > 0 ? { limit: frameVals.limit } : {};

    const details = {
      ...frameRate,
      startTime,
      stopTime,
      limitMode: frameVals.limitMode,
      ...limit,
    };
    const file = videoRef.current?.src ?? "";
    setCropResults([]);
    setLoading(true);
    parseVideo(
      file,
      cropData,
      details,
      storeCropsNoInfer,
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
