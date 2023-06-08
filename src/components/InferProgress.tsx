import { CircularProgress } from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";
import React from "react";
import type { ComponentProps } from "react";

type Props = ComponentProps<"div"> & {
  percent: number;
  bufferPercent: number;
  ffmpegReady: boolean;
};

const InferProgress = (props: Props) => {
  const { percent, bufferPercent, ffmpegReady } = props;
  const parsed = ffmpegReady && bufferPercent >= 100;
  const classified = parsed && percent >= 100;
  const variant = percent > 1 ? "buffer" : "indeterminate";

  const Prog = () => (
    <LinearProgress
      variant={variant}
      value={percent}
      valueBuffer={bufferPercent}
    />
  );

  return (
    <div className={props.className}>
      <div>Loading FFMpeg{ffmpegReady ? "✅" : <Prog />}</div>
      {ffmpegReady && <div>Parsing Video{parsed ? "✅" : <Prog />}</div>}
      {parsed && (
        <div>
          Classifying Images
          {classified ? "✅" : <Prog />}
        </div>
      )}
    </div>
  );
};

export default InferProgress;
