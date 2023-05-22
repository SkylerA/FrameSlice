import { useState, useEffect, useMemo } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import type { FFmpeg, ProgressCallback } from "@ffmpeg/ffmpeg";

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
  frameCount?: number;
  startTime?: number;
  stopTime?: number;
  frameRate?: number;
  ffmpegOverride?: string; // temp command for testing ffmpeg commands manually
};

export type ParseFrameCb = (parseFiles: string[], ffmpeg: FFmpeg) => void;

export const PARSE_PREFIX = "parse_";

// parse name out of filenames with format parse_{name}_{count}.{ext}
function getParseName(file: string) {
  const pattern = "parse_(.+?)(_(\\d+))*\\.(.+)"; // beware autoformat destroys this line replacing ' with " and then \ gets used as an escape
  const matches = file.match(pattern);
  const name = matches ? matches[1] : "";
  const idx = matches ? Number(matches[3]) : 0;
  const ext = matches ? matches[4] : "";
  return { name, idx, ext };
}

// TODO improve these types
export const ImgTypes = ["png", "jpg", "bmp"]; // Can't use as const because ImgTypes goes undefined at import for some reason
const ImgTypesInfer = ["png", "jpg", "bmp"] as const; // Duplicate array as const to allow ts to infer types...
export type ImgType = (typeof ImgTypesInfer)[number];
export type OutputMode = ImgType | "gif" | "video";

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
  const seekEnd = details.stopTime ? `-to ${details.stopTime}` : "";
  const frames = details.frameCount ? `-vframes ${details.frameCount}` : "";

  // Generate crop and map strings for each request
  crops.forEach((crop, index) => {
    const { x, y, width, height, name = "" } = crop;
    const crop_name = name == "" ? `crop_${x}_${y}_${width}_${height}` : name;

    // img output string or undefined
    const imgOut = ["jpg", "png", "bmp"].includes(output)
      ? `${PARSE_PREFIX}${crop_name}_%d.${output}`
      : undefined;

    // gif output string or undefined
    const gifOut =
      "gif" === output ? `${PARSE_PREFIX}${crop_name}.gif` : undefined;

    // vid output string or undefined
    const fileExt = file.slice(file.lastIndexOf(".") + 1);
    const vidOut =
      "video" === output ? `${PARSE_PREFIX}${crop_name}.${fileExt}` : undefined;

    // get output str in format of whatever mode was given
    const outputStr = imgOut ?? gifOut ?? vidOut;

    filterChains.push(`[0:v]crop=${width}:${height}:${x}:${y}[out${index}]`);
    outputMappings.push(
      // TODO decide if vsync 0 should be included
      // TODO see if exporting to bmp can speed up loop by not encoding pixels
      `-map [out${index}] ${frameRate} ${frames} -vsync 2 ${outputStr}`
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
  const seekRange = `${seekStart} ${seekEnd}`;
  const seek = `${seekRange} -i ${file}`;

  // Build full cmd
  const cmd = `ffmpeg ${seek} ${filterComplex} ${outputOptions}`;

  return singleSpace(cmd);
}

// TODO this probably results in duplicate instances of ffmpeg currently if multipole components call the useHook
export default function useFFmpeg() {
  const ffmpeg = useMemo(() => createFFmpeg(ffmpeg_init), []);
  const [ffmpegReady, setFFmpegReady] = useState(false);

  const load = async () => {
    console.time("ffmpeg loaded");
    if (ffmpeg && !ffmpeg.isLoaded()) {
      console.log("ffmpeg loading...");
      await ffmpeg.load();

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

  return [ffmpeg, ffmpegReady, parseVideo, getParseName] as const;
}
function emptyCb(progressParams: { ratio: number }): any {}
