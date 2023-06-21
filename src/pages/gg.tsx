// TODO model is currently copy pasted in, need a more permanent way of updating/storing/accessing etc
// model location: /code/FramesServer/ml_models/gg_classify_mobilenet_v3/tfjs_model

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NextComponentType } from "next";

import VideoControl from "@/components/VideoControl";
import { GetCrops, GetBtnPrefix } from "@/utils/parse";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import useFFmpeg, {
  Crop,
  freeUrls,
  handleFFmpegProgress,
} from "@/hooks/useFFmpeg";
import { loadLabels, loadModel } from "@/utils/models";
import type { CropResult } from "@/components/CropResults";
import mime from "mime";
import type { Marker } from "@/hooks/useTimeline";
// TODO remove Autosizer from package json if we don't use it
// import AutoSizer from "react-virtualized-auto-sizer";
import styles from "@/styles/gg.module.css";
// import { LinearProgress } from "@mui/material";
import InferProgress from "@/components/InferProgress";
import { useWindowSize } from "usehooks-ts";
import GG_Timeline from "@/components/GG_Timeline";
import GamepadInput from "../components/GamepadInputs";
import ParseSettings from "@/components/ParseSettings";
import Card from "@/components/Card";
import { ParseSettingsContext } from "@/components/contexts/parseSettingsContext";

type Props = {};

type ObjArray = { [key: string]: any }[];

let crops: Crop[] = [];

const convertLabel = (label: string) => {
  // dummy values for 0 and 5 because they are never used in read fgc inputs
  const directionLookup = [
    "dummy",
    "🡿",
    "🡻",
    "🡾",
    "🡸",
    "dummy",
    "🡺",
    "🡼",
    "🡹",
    "🡽",
  ];
  const heldSuffix = "_h";
  const held = label?.toLowerCase().endsWith(heldSuffix);

  const intLabel = parseInt(label);
  // If the label was a low int, replace it with a direction, otherwise use original label
  const newLabel =
    intLabel && intLabel <= 9
      ? // If a direction, lookup the arrow and then add _h if button was held
        `${directionLookup[intLabel]}${held ? "_h" : ""}`
      : label;

  return newLabel;
};

type inferResult = {
  classIdx: number;
  name: string;
  idx: number;
};

let labels: string[] = [];

const demo = [
  { classIdx: 32, name: "gg_btn_L_0_0", idx: 1 },
  { classIdx: 32, name: "gg_btn_L_0_1", idx: 1 },
  { classIdx: 32, name: "gg_btn_L_0_0", idx: 2 },
  { classIdx: 32, name: "gg_btn_L_0_1", idx: 3 },
  { classIdx: 32, name: "gg_btn_L_0_1", idx: 2 },
  { classIdx: 32, name: "gg_btn_L_0_0", idx: 3 },
  { classIdx: 30, name: "gg_btn_L_0_1", idx: 4 },
  { classIdx: 26, name: "gg_btn_L_0_0", idx: 4 },
  { classIdx: 26, name: "gg_btn_L_0_0", idx: 5 },
  { classIdx: 30, name: "gg_btn_L_0_1", idx: 5 },
  { classIdx: 6, name: "gg_btn_L_0_0", idx: 6 },
  { classIdx: 27, name: "gg_btn_L_0_1", idx: 6 },
  { classIdx: 0, name: "gg_btn_L_0_0", idx: 7 },
  { classIdx: 16, name: "gg_btn_L_0_1", idx: 7 },
  { classIdx: 2, name: "gg_btn_L_0_0", idx: 8 },
  { classIdx: 17, name: "gg_btn_L_0_1", idx: 8 },
  { classIdx: 2, name: "gg_btn_L_0_0", idx: 9 },
  { classIdx: 17, name: "gg_btn_L_0_1", idx: 9 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 1 },
  { classIdx: 4, name: "gg_btn_L_0_0", idx: 10 },
  { classIdx: 24, name: "gg_btn_L_0_1", idx: 10 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 2 },
  { classIdx: 8, name: "gg_btn_L_0_0", idx: 11 },
  { classIdx: 25, name: "gg_btn_L_0_1", idx: 11 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 3 },
  { classIdx: 12, name: "gg_btn_L_0_0", idx: 12 },
  { classIdx: 29, name: "gg_btn_L_0_1", idx: 12 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 4 },
  { classIdx: 12, name: "gg_btn_L_0_0", idx: 13 },
  { classIdx: 29, name: "gg_btn_L_0_1", idx: 13 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 5 },
  { classIdx: 11, name: "gg_btn_L_0_0", idx: 14 },
  { classIdx: 29, name: "gg_btn_L_0_1", idx: 14 },
  { classIdx: 31, name: "gg_btn_L_0_2", idx: 6 },
  { classIdx: 6, name: "gg_btn_L_0_0", idx: 15 },
  { classIdx: 29, name: "gg_btn_L_0_1", idx: 15 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 7 },
  { classIdx: 0, name: "gg_btn_L_0_0", idx: 16 },
  { classIdx: 18, name: "gg_btn_L_0_1", idx: 16 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 8 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 1 },
  { classIdx: 4, name: "gg_btn_L_0_0", idx: 17 },
  { classIdx: 19, name: "gg_btn_L_0_1", idx: 17 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 9 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 2 },
  { classIdx: 8, name: "gg_btn_L_0_0", idx: 18 },
  { classIdx: 21, name: "gg_btn_L_0_1", idx: 18 },
  { classIdx: 17, name: "gg_btn_L_0_2", idx: 10 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 3 },
  { classIdx: 8, name: "gg_btn_L_0_0", idx: 19 },
  { classIdx: 21, name: "gg_btn_L_0_1", idx: 19 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 11 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 4 },
  { classIdx: 8, name: "gg_btn_L_0_0", idx: 20 },
  { classIdx: 21, name: "gg_btn_L_0_1", idx: 20 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 12 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 5 },
  { classIdx: 8, name: "gg_btn_L_0_0", idx: 21 },
  { classIdx: 21, name: "gg_btn_L_0_1", idx: 21 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 13 },
  { classIdx: 28, name: "gg_btn_L_0_2", idx: 14 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 15 },
  { classIdx: 29, name: "gg_btn_L_0_2", idx: 16 },
  { classIdx: 20, name: "gg_btn_L_0_2", idx: 17 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 18 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 19 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 20 },
  { classIdx: 32, name: "gg_btn_L_0_2", idx: 21 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 6 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 7 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 8 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 9 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 10 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 11 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 12 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 13 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 14 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 15 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 16 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 17 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 18 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 19 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 20 },
  { classIdx: 32, name: "gg_btn_L_0_3", idx: 120 },
];

const GG: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const [selecting, setSelecting] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [vidSrc, setVidSrc] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(0);
  const [stopTime, setStopTime] = useState<number>(0);
  const [parseProgress, setParseProgress] = useState<number>(0);
  const [cropResults, setCropResults] = useState<CropResult[]>([]);
  // const [newTimelineResults, setNewTimelineResults] = useState<ObjArray>([]);
  const [results, setResults] = useState<ObjArray[]>([[]]);
  const [frameW, setFrameW] = useState<number>(0);
  const [inferReqCount, setInferReqCount] = useState<number>(0);
  const inferWorkerRef = useRef<Worker>();
  const [clipIdx, setClipIdx] = useState<number>(-1);
  const [inferResults, setInferResults] = useState<inferResult[]>([]);
  // const [clipIdx, setClipIdx] = useState<number>(0);
  // const [inferResults, setInferResults] = useState<inferResult[]>([...demo]);
  const winSize = useWindowSize();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ffmpeg, ffmpegReady, parseVideo, getParseName, getFps, getRunDetails] =
    useFFmpeg();

  const { parseSettings, setParseSettings } = useContext(ParseSettingsContext);

  // Cause the model to start async loading
  const loadModelPromise = useMemo(() => loadModel(), []);

  function requestInferBlob(blob: Blob, name: string, idx: number) {
    inferWorkerRef.current?.postMessage({ type: "inferBlob", blob, name, idx });
  }

  const setupInferWorker = () => {
    const worker = new Worker(
      new URL("../workers/infer.worker.ts", import.meta.url)
    );
    inferWorkerRef.current = worker;

    worker.onmessage = function (e) {
      if (e.data?.type === "inferResult") {
        handleInferResult(e);
      }
    };
  };

  const handleInferResult = (e: MessageEvent<any>) => {
    const { classIdx, name, idx } = e.data;
    setInferResults((prev) => {
      return [...prev, { classIdx, name, idx }];
    });
  };

  useEffect(() => {
    crops = GetCrops(parseSettings) ?? [];
  }, [parseSettings]);

  useEffect(() => {
    if (vidSrc !== "") {
      if (!inferWorkerRef.current) setupInferWorker();
      handleVid(vidSrc);
    }
  }, [vidSrc]);

  useEffect(() => {
    setFrameW(
      1.25 * parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
  }, []);

  useEffect(() => {
    (async () => {
      if (inferResults.length > 0) {
        const prefix = GetBtnPrefix(parseSettings) ?? "";
        // TODO improve error handling across the board
        if (prefix === "")
          console.log("Error: no btnPrefix available for", parseSettings);
        const lbls = labels.length > 0 ? labels : await loadLabels();

        // New timeline
        const temp = CropResultsToInputTimeline(inferResults, lbls, prefix);
        // setNewTimelineResults(temp);
        // TODO need to consider if shallow copy will causes issues here
        setResults((prev) => {
          prev[clipIdx] = temp;
          return [...prev];
        });
        // setInferResults([]);
      }
    })();
  }, [JSON.stringify(inferResults)]);

  function ffmpegProgressCb(progress: { ratio: number; time?: number }) {
    handleFFmpegProgress(progress, videoRef, setParseProgress);
  }

  const no_op = async (files: string[], ffmpeg: FFmpeg) => {
    // freeUrls(cropResults); // Free previous crop img memory
    for (const file of files) {
      // clean up the ffmpeg file
      ffmpeg.FS("unlink", file);
    }
  };

  const inferCrops = async (files: string[], ffmpeg: FFmpeg) => {
    console.time("loaded model");
    // Model has been async loading since first paint so this should usually be available quickly
    const { labels: newLabels } = await loadModelPromise;
    labels = newLabels;
    console.timeEnd("loaded model");

    freeUrls(cropResults); // Free previous crop img memory

    console.time("parsing/inference time");
    const newResults: CropResult[] = [];
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

      // Classify image
      requestInferBlob(blob, name, idx);
    }

    console.timeEnd("parsing time");

    // TODO this can probably be remove
    setCropResults(newResults);

    // Track how many requests we made for progress calculations
    setInferReqCount(files.length);

    // // New timeline
    // const temp = CropResultsToInputTimeline(newResults as inferResult[]);
    // setNewTimelineResults(temp);
  };

  const CropResultsToInputTimeline = (
    results: inferResult[],
    labels: string[],
    btnPrefix: string
  ) => {
    if (!btnPrefix || btnPrefix === "")
      console.log("CropResultsToInputTimeline Error: no btnPrefix provided");
    // TODO add error/warning if labels is empty as it will result in undefined btn arrays
    return results.reduce((grouped, curr) => {
      // Add an empty object to the entry if one doesn't exist
      grouped[curr.idx] = grouped[curr.idx] ?? {};
      // get a reference to the stored object so we don't have to update the array after object changes
      const obj = grouped[curr.idx];

      // Currently only parsing for gg buttons
      // This assumes a name format of ${GG_BTN_PREFIX}${side}_${row}_${col}
      if (curr.name?.startsWith(btnPrefix)) {
        const [side, row, col] = curr.name.replace(btnPrefix, "").split("_");
        // side and row aren't currently used

        // Create a btns entry if one doesn't exist
        obj["btns"] = obj["btns"] ?? ([] as string[]);
        const btns = obj["btns"];
        const label = labels[curr.classIdx ?? -1];

        // Skip storing invalid vals
        if (label !== "invalid") {
          btns[Number(col)] = label;
        }
      }
      return grouped;
    }, [] as { [key: string]: any }[]);
  };

  const CropResultToMarker = (result: CropResult): Marker | undefined => {
    const label = labels[result.classIdx ?? -1];
    return { frame: result.idx, tag: "gg-st", label: convertLabel(label) };
  };

  // TODO useCallback
  const handleVid = useCallback(
    (vid: string) => {
      if (vidSrc) {
        const file = videoRef.current?.src ?? "";
        // setCropResults([]);
        setClipIdx((prev) => prev + 1);
        setInferReqCount(0);
        setInferResults([]);
        parseVideo(vid, crops, {}, inferCrops, "png", ffmpegProgressCb);
      }
    },
    [
      vidSrc,
      videoRef,
      setClipIdx,
      setInferReqCount,
      setInferResults,
      parseVideo,
      inferCrops,
      ffmpegProgressCb,
    ]
  );

  function seekToFrame(idx: number) {
    const magicNumber = 1;
    const roundingHelp = 0.00001; // HTML5 video isn't frame accurate so trying some extra time padding to try to get things to line up https://github.com/w3c/media-and-entertainment/issues/4
    const time = (idx - magicNumber) / getFps() + roundingHelp;
    if (videoRef.current) videoRef.current.currentTime = time;
  }

  function handleCellHover(idx: number) {
    const magicNumber = 0;
    const time = (idx - magicNumber) / getFps();
    console.log(`hover: ${idx}`);
  }

  const inferProgress =
    inferResults.length > 0
      ? Math.ceil((inferResults.length / inferReqCount) * 100)
      : 0;

  return (
    <div className={styles.gg}>
      <VideoControl
        selecting={selecting}
        crops={crops} // TODO consider removing/relocating
        setCrops={() => {}} // TODO consider removing/relocating
        vidRef={videoRef}
        vidSrc={vidSrc}
        setVidSrc={setVidSrc}
        startTime={startTime}
        setStartTime={setStartTime}
        stopTime={stopTime}
        setStopTime={setStopTime}
        hideRange
      />

      <Card>
        <ParseSettings />
      </Card>

      {results.map((result, idx) => (
        <div key={idx} className={styles.Grid}>
          {result.length > 0 && (
            <GG_Timeline
              containerW={winSize.width}
              frameW={frameW}
              frames={result}
              showDupes={false}
              clickCb={(idx) => seekToFrame(idx)}
              hoverCb={(idx) => handleCellHover(idx)}
            />
          )}
          {/* Render infer progress for only the current clip being updated */}
          {idx === clipIdx && inferProgress < 100 && (
            <div>
              <InferProgress
                className={styles.progress}
                percent={inferProgress}
                bufferPercent={parseProgress}
                ffmpegReady={ffmpegReady}
              />
            </div>
          )}
        </div>
      ))}

      {inferProgress >= 100 && <GamepadInput />}

      {/* Rendering infer progress on its own while there are no results to display above
      {console.log(clipIdx)}
      {(clipIdx < 1 || clipIdx >= results.length) &&
        vidSrc &&
        inferProgress < 100 && (
          <div className={styles.Grid}>
            <InferProgress
              className={styles.progress}
              percent={inferProgress}
              bufferPercent={parseProgress}
              ffmpegReady={ffmpegReady}
            />
          </div>
        )} */}
    </div>
  );
};

export default GG;
