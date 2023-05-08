import { useState, useEffect, useMemo } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import type { FFmpeg } from "@ffmpeg/ffmpeg";

const ffmpeg_init = {
  log: true,
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
};

export type ParseFrameCb = (parseFiles: string[], ffmpeg: FFmpeg) => void;

export const PARSE_PREFIX = "parse_";

export function generateFFmpegCommand(
  file: string,
  crops: Crop[],
  details: ParseDetails
) {
  const singleSpace = (str: string) => str.replace(/( )+/g, " ");
  const filterChains: string[] = [];
  const outputMappings: string[] = [];

  // Get ffmpeg vars
  const r = details.frameRate ? `-r ${details.frameRate}` : "";
  const seekStart = details.startTime ? `-ss ${details.startTime}` : "";
  const seekEnd = details.stopTime ? `-to ${details.stopTime}` : "";
  const frames = details.frameCount ? `-vframes ${details.frameCount}` : "";

  // Generate crop and map strings for each request
  crops.forEach((crop, index) => {
    const { x, y, width, height, name = "" } = crop;
    const crop_name = name == "" ? `crop_${x}_${y}_${width}_${height}` : name;
    filterChains.push(`[0:v]crop=${width}:${height}:${x}:${y}[out${index}]`);
    outputMappings.push(
      // TODO decide if vsync 0 should be included
      // TODO see if exporting to bmp can speed up loop by not encoding pixels
      `-map [out${index}] ${r} ${frames} -vsync 1 ${PARSE_PREFIX}${crop_name}_%d.png`
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

  useEffect(() => {
    // Load the ffmpeg wasm once the interface has been created
    const load = async () => {
      // for whatever reason, the compiler demanded that this async func definition get moved inside the useEffect
      if (ffmpeg && !ffmpeg.isLoaded()) {
        console.log("ffmpeg loading...");
        await ffmpeg.load();

        setFFmpegReady(ffmpeg.isLoaded());
      }
    };

    load().catch((e) => console.log(e));
  }, [ffmpeg]);

  async function parseVideo(
    file: string,
    crops: Crop[],
    details: ParseDetails,
    cb: ParseFrameCb
  ) {
    console.time("parseVideo time:");
    // TODO WorkerFS might help here https://github.com/ffmpegwasm/ffmpeg.wasm/issues/147
    ffmpeg.FS("writeFile", "file.mp4", await fetchFile(file));

    console.log(
      `📽parseVideo: parsing `,
      file,
      ` Crops: `,
      crops,
      " Details: ",
      details
    );

    // Get ffmpeg string, convert to array and remove "ffmpeg" from front as that's only needed in terminal
    const cmd = generateFFmpegCommand("file.mp4", crops, details);
    const args = cmd.split(" ").slice(1);
    console.log(`📽parseVideo: ffmpeg command: ${cmd}`);

    // execute ffmpeg command
    console.log("💻running ffmpeg cmd: ", cmd);
    await ffmpeg.run(...args);

    // Find parse artifacts
    const files = ffmpeg.FS("readdir", "/");
    const cropFiles = files.filter((file) => file.startsWith(PARSE_PREFIX));
    console.log(cropFiles);

    // Fire handler callback
    if (cb) {
      cb(cropFiles, ffmpeg);
    }

    // clean up
    // TODO add clean up for generated files
    ffmpeg.FS("unlink", "file.mp4");

    console.timeEnd("parseVideo time:");
  }

  return [ffmpeg, ffmpegReady, parseVideo] as const;
}
