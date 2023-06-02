import CircularProgress from "@mui/material/CircularProgress";
import React from "react";

type Props = {
  value?: number;
};

const Progress = (props: Props) => {
  return (
    <CircularProgress
      variant={(props.value ?? 0) > 0 ? "determinate" : "indeterminate"}
      value={props.value}
      sx={{ color: "var(--track-color-right)" }}
    />
  );
};

export default Progress;
