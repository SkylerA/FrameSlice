import React, { useState, useRef } from "react";
import type { NextComponentType } from "next";
// import useFFmpeg from "../hooks/useFFmpeg";
import type { Crop, ParseDetails, ParseFrameCb } from "../hooks/useFFmpeg";
export type { Crop, ParseDetails, ParseFrameCb }; // re-export useFFmpeg types
import styles from "@/styles/VidParser.module.css";

type Props = {
  // crops?: Crop[];
  // details?: ParseDetails;
  // cb?: ParseFrameCb;
  controls?: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
};

// TODO not entirely sure about the extra Record and unknown syntax, this was required to avoid errors when a user passed a cb through the props. This is also fixable by using React.FC instead of NextComponentType
const VidParser: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const fileRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [ffmpeg, ffmpegReady, parseVideo] = useFFmpeg();
  const [video, setVideo] = useState<string>("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) {
      // void parseVideo(file, tempCrops, {} as ParseDetails);
      setVideo(URL.createObjectURL(file));
    }
  }

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // function parse(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
  //   const vid = fileRef.current?.files?.[0];
  //   console.log("parse", vid);
  //   if (vid) {
  //     void parseVideo(
  //       vid,
  //       props.crops ?? [],
  //       props.details ?? ({} as ParseDetails),
  //       props.cb ??
  //         ((e) => console.log("No callback provided to parse function"))
  //     );
  //   }
  // }

  return (
    <div className={styles.VidParser}>
      <video ref={props.videoRef} src={video} controls={props.controls} />
      <div>
        <label>
          Load Video
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={handleChange}
          />
        </label>
        {/* {props.cb && <button onClick={parse}>Parse</button>} */}
      </div>
    </div>
  );
};

export default VidParser;
