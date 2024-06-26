import { useCallback, useEffect, useRef, useState } from "react";
import type { NextComponentType } from "next";
import useFFmpeg, {
  Crop,
  ImgTypes,
  ParseDetails,
  freeUrls,
  handleFFmpegProgress,
} from "@/hooks/useFFmpeg";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import Card from "@/components/Card";
import type { CropResult } from "./CropResults";
import FrameControls, { FrameControlValues } from "./FrameControls";
import CropControls from "./CropControls";
import VideoControl from "./VideoControl";
import Button from "./Button";
import mime from "mime/lite";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";

import styles from "@/styles/VidCropper.module.css";

import { FramesParseObj, FramesParseObjToCrop } from "@/utils/parse";
import type { ImgObj, Json } from "@/utils/data";
import ScrollOnShow from "./ScrollOnShow";
import dynamic from "next/dynamic";
import { infer_no_op, type InferFn } from "@/utils/infer";

// Hardcoding CropInfer to nothing for now
const CropInferFn: InferFn = infer_no_op;

const ClassLabelEditor = dynamic(() => import("./Labeling/ClassLabelEditor"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const CropResults = dynamic(() => import("./CropResults"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

type Props = {};

const VidCropper: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const [vidSrc, setVidSrc] = useState<string>("");
  const [selecting, setSelecting] = useState<boolean>(false);
  const [cropResults, setCropResults] = useState<CropResult[]>([]);
  const [parseDetails, setParseDetails] = useState<ParseDetails | undefined>(undefined);
  const [cropData, setCropData] = useState<Crop[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [stopTime, setStopTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [parseProgress, setParseProgress] = useState<number>(0);
  const [vidW, setVidW] = useState<number>(0);
  const [vidH, setVidH] = useState<number>(0);
  const [runFrameVals, setRunFrameVals] = useState<FrameControlValues>(
    {} as FrameControlValues
  );
  const [cropImgObjs, setCropImgObjs] = useState<ImgObj[]>([]);

  const [loadFFmpeg, setLoadFFmpeg] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ffmpeg, ffmpegReady, parseVideo, getParseName, getFps, getRunDetails] =
    useFFmpeg(loadFFmpeg);

  const cropDisabled = vidSrc === "" || cropData.length < 1;
  const showLabels = cropImgObjs.length > 0;
  const showResults = !showLabels && (cropResults.length > 0 || loading);

  useEffect(() => {
    // Hold off loading ffmpeg until a user is actually loading a video
    if (!ffmpegReady && vidSrc !== "") {
      setLoadFFmpeg(true);
    }
  }, [vidSrc, ffmpegReady]);

  const editCropsCb = useCallback((crops: Crop[]) => {
    setCropData(crops);
  }, []);

  const setSelectingCb = useCallback((selecting: boolean) => {
    setSelecting(selecting);
  }, []);

  const ffmpegProgressCb = useCallback(
    (progress: { ratio: number; time?: number }) => {
      handleFFmpegProgress(progress, videoRef, setParseProgress);
    },
    [videoRef]
  );

  const storeCropsAndInfer = useCallback(
    async (files: string[], ffmpeg: FFmpeg) => {
      freeUrls(cropResults); // Free previous crop img memory

      // Create canvas once since infer calls that check pixel data would otherwise recreate it every frame/crop
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      // console recommended willReadFrequently while testing https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently

      const newResults = [];
      for (const file of files) {
        // load next image
        const data = ffmpeg.FS("readFile", file);
        const type = mime.getType(file) ?? "image/png"; // determine file type or default to png
        const blob = new Blob([data.buffer], { type });

        // Create a URL
        const url = URL.createObjectURL(blob);
        const { name, idx, ext } = getParseName(file) ?? "";

        // Call infer function and capture custom return data
        let returnData = await CropInferFn(url, name, idx, context);

        // clean up the ffmpeg file
        ffmpeg.FS("unlink", file);

        newResults.push({ url, name, idx, ext, data: returnData });

        // update the results in chunks to avoid some thrash
        const imgChunks = 10;
        if (newResults.length % imgChunks === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0)); // Allow time for re-render
          setCropResults(newResults.slice());
        }
      }

      setLoading(false);
      setCropResults(newResults);
    },
    [cropResults, getParseName]
  );

  const parseFramesFileJson = useCallback((json: Json) => {
    if (json) {
      const frames = json as FramesParseObj[];
      const crops = frames.map((filter) => FramesParseObjToCrop(filter));
      setCropData(crops);
    }
  }, []);

  const cropVidCb = useCallback(
    (frameVals: FrameControlValues) => {
      const frameRate =
        frameVals.frameRateMode === "custom"
          ? { frameRate: frameVals.frameRate }
          : {};
      const limit = frameVals.limit > 0 ? { limit: frameVals.limit } : {};

      const details: ParseDetails = {
        ...frameRate,
        startTime,
        stopTime,
        limitMode: frameVals.limitMode,
        ...limit,
        cropData,
        videoWidth: vidW,
        videoHeight: vidH,
      };
      const file = videoRef.current?.src ?? "";
      setCropImgObjs([]);
      setCropResults([]);
      setParseProgress(0);
      setLoading(true);
      setRunFrameVals(frameVals);
      setParseDetails(details);
      parseVideo(
        file,
        cropData,
        details,
        storeCropsAndInfer,
        frameVals.outputMode,
        ffmpegProgressCb
      );
    },
    [
      videoRef,
      parseVideo,
      ffmpegProgressCb,
      cropData,
      startTime,
      stopTime,
      storeCropsAndInfer,
      vidW,
      vidH
    ]
    // TODO cropData is an array which will probably cause this useCallback to update everytime
  );

  const handleVidSizeChange = useCallback((width: number, height: number) => {
    setVidW(width);
    setVidH(height);
  }, []);

  const showLabelEditor = useCallback(
    () => {
      const imgObjs = cropResults.map(
        (result) => ({ url: result.url, classStr: result.name } as ImgObj)
      );
      setCropImgObjs([...imgObjs]);
    },
    [cropResults]
    // TODO cropResults is an array which will probably cause this useCallback to update everytime
  );

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
        vidDimensionsCb={handleVidSizeChange}
      />

      <Card>
        <CropControls
          parseFramesFileJson={parseFramesFileJson}
          editCropsCb={editCropsCb}
          cropData={cropData}
          selecting={selecting}
          setSelecting={setSelectingCb}
          videoW={vidW}
          videoH={vidH}
        />
      </Card>

      <Card>
        <FrameControls cropCb={cropVidCb} cropDisabled={cropDisabled} />
      </Card>
      {showResults && (
        <>
          <Card>
            <CropResults
              cropResults={cropResults}
              details={parseDetails}
              loading={loading}
              progress={parseProgress}
              extraBtns={[
                {
                  toolTip: "Label Crops",
                  cb: showLabelEditor,
                  icon: LabelOutlinedIcon,
                },
              ]}
            />
            {cropResults.length > 0 &&
              ImgTypes.includes(runFrameVals.outputMode) && (
                <Button className={styles.labelBtn} onClick={showLabelEditor}>
                  Label Crops
                </Button>
              )}
          </Card>
        </>
      )}
      {showLabels && (
        <Card>
          <h2>Crop Labelor</h2>
          <ScrollOnShow />
          <ClassLabelEditor style={{ maxHeight: "70dvh" }} data={cropImgObjs} />
        </Card>
      )}
    </div>
  );
};

export default VidCropper;
