import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup/";
import Tooltip from "@mui/material/Tooltip";
import { NextComponentType } from "next/types";

import styles from "@/styles/FrameControls.module.css";
import { textFieldStyle, toggleStyle } from "@/styles/MuiStyleObjs";
import Button from "@mui/material/Button";

export type FrameRateMode = "custom" | "video";

export type FrameControlValues = {
  frameCount: number;
  frameRateMode: FrameRateMode;
  frameRate?: number;
};

type Props = {
  cropCb: (frameVals: FrameControlValues) => void;
  cropDisabled: boolean;
};

const FrameControls: NextComponentType<
  Record<string, never>,
  unknown,
  Props
> = (props: Props) => {
  const [fpsMode, setFpsMode] = useState<FrameRateMode>("video");
  const [fps, setFps] = useState<number>(1);
  const [frameCount, setFrameCount] = useState<number>(10);

  function handleCrop(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    props.cropCb({ frameCount, frameRateMode: fpsMode, frameRate: fps });
  }

  return (
    <div className={styles.container}>
      <h2>Frame Controls</h2>
      <div className={styles.frameControls}>
        <span className={styles.label}>FPS</span>
        <span className={styles.fpsControl}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={fpsMode}
            exclusive
            onChange={(e, value) => setFpsMode(value)}
            aria-label="FPS"
          >
            <ToggleButton value="video" className="test" sx={toggleStyle}>
              Video
            </ToggleButton>
            <ToggleButton value="custom" sx={toggleStyle}>
              Custom
            </ToggleButton>
          </ToggleButtonGroup>
          {fpsMode === "custom" && (
            <TextField
              size="small"
              value={fps}
              sx={textFieldStyle}
              onChange={(e) => setFps(Number(e.currentTarget.value))}
              inputProps={{
                step: 1,
                min: 0,
                max: 1000,
                type: "number",
              }}
            />
          )}
        </span>
        <Tooltip
          arrow
          title="Stop at Xth frame instead of cropping through full Clip Range. 0 to use Clip Range"
        >
          <span className={styles.label}>Frame Limit</span>
        </Tooltip>
        <TextField
          size="small"
          value={frameCount}
          sx={textFieldStyle}
          onChange={(e) => setFrameCount(Number(e.currentTarget.value))}
          inputProps={{
            step: 1,
            min: 0,
            max: 1000,
            type: "number",
          }}
        />
      </div>
      <Tooltip
        arrow
        title={
          props.cropDisabled
            ? "Select a video and at least 1 crop region to enable"
            : ""
        }
      >
        <span>
          {/* span enables tooltip on button even when disabled */}
          <Button
            sx={{ textTransform: "none" }}
            disabled={props.cropDisabled}
            className="gradient-bg"
            variant="contained"
            onClick={handleCrop}
          >
            Crop Video
          </Button>
        </span>
      </Tooltip>
    </div>
  );
};

export default FrameControls;
