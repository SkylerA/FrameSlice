import { useState, useMemo, RefObject } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import type { FFmpeg, ProgressCallback } from "@ffmpeg/ffmpeg";
import { clamp } from "@/utils/data";

const ffmpeg_init = {
  log: false,
  corePath: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
  //   corePath: "http://localhost:3000/ffmpeg-core.js",
};

export type Crop = {
  // x,y,width,height allow strings for passing of ffmpeg expressions like "in_w-50"
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  name: string;
};

export type ParseDetails = {
  presetName?: string;
  limit?: number;
  limitMode?: LimitMode;
  startTime?: number;
  stopTime?: number;
  frameRate?: number;
  ffmpegOverride?: string; // temp command for testing ffmpeg commands manually
};

export type RunDetails = {
  parseDetails: ParseDetails;
  crops: Crop[];
};

export type ParseFrameCb = (parseFiles: string[], ffmpeg: FFmpeg) => void;

export const PARSE_PREFIX = "parse";
// currently using globals so that calling code can access mid run info even though ffmpeg is in a tight loop where state updates won't propagate
let globalFps = -1;
let currRun: RunDetails = { parseDetails: {}, crops: [] };

// parse name out of filenames with format parse_{name}_{count}.{ext}
function getParseName(file: string) {
  const pattern = "parse(-(\\d+))*_(.+)\\.([\\w|\\d]+)"; // beware autoformat destroys this line replacing ' with " and then \ gets used as an escape
  const matches = file.match(pattern);
  const name = matches ? matches[3] : "";
  const idx = matches ? Number(matches[2]) : 0;
  const ext = matches ? matches[4] : "";
  return { name, idx, ext };
}

// checks string for , X.X fps, and returns X.X
function parseFps(file: string) {
  const pattern = ", (\\d+.\\d*) fps,"; // beware autoformat destroys this line replacing ' with " and then \ gets used as an escape
  const matches = file.match(pattern);
  const fpsStr = matches?.[1] ?? undefined;
  return Number(fpsStr);
}

function getFps() {
  return globalFps;
}

function getRunDetails() {
  return currRun;
}

export function handleFFmpegProgress(
  progress: { ratio: number; time?: number },
  videoRef: RefObject<HTMLVideoElement>,
  cb: (progress: number) => void
) {
  // setParseProgress(progress.ratio * 100);
  const details = getRunDetails();
  const limit = details.parseDetails.limit;
  const prog_time = progress.time ?? 0;
  const stopTime = details.parseDetails.stopTime ?? 0;
  const startTime = details.parseDetails.startTime ?? 0;
  let percent = 0;
  if (details.parseDetails.limitMode === "frames") {
    const fps = getFps();
    const total_s = videoRef.current?.duration ?? 0;
    const total_frames = fps * total_s;
    const prog = Math.min(100, total_frames * progress.ratio);

    percent = prog;
  } else if (details.parseDetails.limitMode === "time" && limit) {
    percent = (prog_time / limit) * 100;
  } else {
    const range = stopTime - startTime;
    if (range > 0) {
      percent = (prog_time / range) * 100;
    } else {
      percent = progress.ratio * 100;
    }
  }
  if (percent) {
    percent = clamp(Math.floor(percent), 0, 100);
    cb(percent);
  }
}

export function freeUrls(results: { url: string }[]) {
  results.map((result) => URL.revokeObjectURL(result.url));
}

// TODO improve these types
export const ImgTypes = ["png", "jpg", "bmp"]; // Can't use as const because ImgTypes goes undefined at import for some reason
const ImgTypesInfer = ["png", "jpg", "bmp"] as const; // Duplicate array as const to allow ts to infer types...
export type ImgType = (typeof ImgTypesInfer)[number];
export type OutputMode = ImgType | "gif" | "video";
export type LimitMode = "none" | "frames" | "time";
export type FrameRateMode = "custom" | "video";

export function generateFFmpegCommand(
  file: string,
  crops: Crop[],
  details: ParseDetails,
  output: OutputMode
) {
  const singleSpace = (str: string) => str.replace(/( )+/g, " ");
  const filterChains: string[] = [];
  const outputMappings: string[] = [];

  // Get ffmpeg vars
  const frameRate = details.frameRate ? `-r ${details.frameRate}` : "";
  const seekStart = details.startTime ? `-ss ${details.startTime}` : "";
  // TODO add logic on client side to not send stopTime if it matches the end time
  const seekEnd = details.stopTime ? `-to ${details.stopTime}` : "";

  // set -vframes if limitMode is frames
  const frames =
    details.limit && details.limitMode === "frames"
      ? `-vframes ${Math.floor(details.limit)}`
      : "";

  // set -t if a limitMode of time was given
  const seekSpan = details.limitMode === "time" ? `-t ${details.limit}` : "";

  // Generate crop and map strings for each request
  crops.forEach((crop, index) => {
    const { x, y, width, height, name = "" } = crop;
    const crop_name = name == "" ? `crop_${x}_${y}_${width}_${height}` : name;

    // img output string or undefined
    const imgOut = ["jpg", "png", "bmp"].includes(output)
      ? `${PARSE_PREFIX}-%d_${crop_name}.${output}`
      : undefined;

    // gif output string or undefined
    const gifOut =
      "gif" === output ? `${PARSE_PREFIX}_${crop_name}.gif` : undefined;

    // vid output string or undefined
    const fileExt = file.slice(file.lastIndexOf(".") + 1);
    const vidOut =
      "video" === output
        ? `${PARSE_PREFIX}_${crop_name}.${fileExt}`
        : undefined;

    // get output str in format of whatever mode was given
    const outputStr = imgOut ?? gifOut ?? vidOut;

    const outTag = `out${index}`;
    const cropStr = `[0:v]crop=${width}:${height}:${x}:${y}[${outTag}]`;

    let addOnStr = "";
    let mapTag = "";

    // TODO This is initial work on improving gif quality with palettes, but it seems like too long of a clip causes a hang so need to research this more
    // If gif, add some palettegen commands to improve gif quality
    // if (gifOut) {
    //   mapTag = "f";
    //   const gifPaletteStr = `;[${outTag}]split[${outTag}orig][${outTag}temp];[${outTag}temp]palettegen[${outTag}p];[${outTag}orig][${outTag}p]paletteuse[${outTag}${mapTag}]`;
    //   addOnStr = gifOut ? gifPaletteStr : "";
    // }

    // Create and store full filter string
    const filterStr = `${cropStr}${addOnStr}`;
    filterChains.push(`${filterStr}`);

    outputMappings.push(
      `-map [out${index}${mapTag}] ${frameRate} ${frames} -vsync 2 ${outputStr}`
    );
  });

  // Build complex filter string
  const filterComplex = filterChains.length
    ? `-filter_complex ${filterChains.join(";")}`
    : "";

  // Build output mapping string
  const outputOptions = outputMappings.join(" ");

  // Build input/seek string
  // Keep seek in front of -i for fast seeking
  // TODO need to see if frame is accurate after seek though, in the past seeking cut at keyframes which could result in lost frames for a given range
  const seekRange = `${seekStart} ${seekEnd} ${seekSpan}`;
  const seek = `${seekRange} -i ${file}`;

  // Build full cmd
  const cmd = `ffmpeg ${seek} ${filterComplex} ${outputOptions}`;

  return singleSpace(cmd);
}

// const installLogger = (ffmpeg: FFmpeg, cb: LogCallback) => {
//   ffmpeg?.setLogger(cb);
// };

const log_getFps = ({ type, message }: { type: string; message: string }) => {
  // only listen until we get a valid fps
  if ((type === "fferr" && globalFps === -1) || !globalFps) {
    // Listen for FPS and store it
    const _fps = parseFps(message);
    globalFps = _fps ?? -1;
  }
};

// TODO this probably results in duplicate instances of ffmpeg currently if multipole components call the useHook
export default function useFFmpeg() {
  const ffmpeg = useMemo(() => createFFmpeg(ffmpeg_init), []);
  const [ffmpegReady, setFFmpegReady] = useState(false);

  const load = async () => {
    console.time("ffmpeg loaded");
    if (ffmpeg && !ffmpeg.isLoaded()) {
      console.log("ffmpeg loading...");
      await ffmpeg.load();

      ffmpeg.setLogger(log_getFps);

      setFFmpegReady(ffmpeg.isLoaded());
    }
    console.timeEnd("ffmpeg loaded");
  };

  async function parseVideo(
    file: string,
    crops: Crop[],
    details: ParseDetails,
    resultsCb: ParseFrameCb,
    output: OutputMode,
    progressCb: ProgressCallback = emptyCb
  ) {
    // update values that the user can introspect during a parse
    globalFps = -1;
    currRun = { crops, parseDetails: details };

    await load();
    console.time("parseVideo time:");
    // TODO WorkerFS might help here https://github.com/ffmpegwasm/ffmpeg.wasm/issues/147
    ffmpeg.FS("writeFile", "file.mp4", await fetchFile(file));

    // Track ffmpeg progress
    ffmpeg.setProgress(progressCb);

    // Get ffmpeg string, convert to array and remove "ffmpeg" from front as that's only needed in terminal
    const override = details.ffmpegOverride ?? "";
    const cmd =
      override !== ""
        ? override
        : generateFFmpegCommand("file.mp4", crops, details, output);
    const args = cmd.split(" ").slice(1);
    // execute ffmpeg command
    console.log("💻running ffmpeg cmd: ", cmd);
    await ffmpeg.run(...args);

    // Find parse artifacts
    const files = ffmpeg.FS("readdir", "/");
    const cropFiles = files.filter((file) => file.startsWith(PARSE_PREFIX));
    console.log(cropFiles);

    // Fire handler callback
    resultsCb?.(cropFiles, ffmpeg);

    // clean up
    // TODO add clean up for generated files
    ffmpeg.FS("unlink", "file.mp4");

    console.timeEnd("parseVideo time:");
  }

  return [
    ffmpeg,
    ffmpegReady,
    parseVideo,
    getParseName,
    getFps,
    getRunDetails,
  ] as const;
}
function emptyCb(progressParams: { ratio: number }): any {}
