import React, { useState } from "react";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup/";
import Tooltip from "@mui/material/Tooltip";
import { NextComponentType } from "next/types";
import { OutputMode } from "@/hooks/useFFmpeg";

import styles from "@/styles/FrameControls.module.css";
import {
  labelStyle,
  selectStyle,
  textFieldStyle,
  toggleStyle,
} from "@/styles/MuiStyleObjs";

export type FrameRateMode = "custom" | "video";
export type LimitMode = "none" | "frames" | "time";

export type FrameControlValues = {
  limit: number;
  frameRateMode: FrameRateMode;
  limitMode: LimitMode;
  frameRate?: number;
  outputMode: OutputMode;
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
  const [limitMode, setLimitMode] = useState<LimitMode>("frames");
  const [fps, setFps] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [output, setOutput] = useState<OutputMode>("png");

  function handleCrop(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    props.cropCb({
      limit: limit,
      frameRateMode: fpsMode,
      limitMode: limitMode,
      frameRate: fps,
      outputMode: output,
    });
  }

  return (
    <div className={styles.container}>
      <h2>Options</h2>
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
          title="Stop processing after X frames or seconds. 'None' will use the full Clip Range set above."
        >
          <span className={styles.label}>Limit</span>
        </Tooltip>
        <span className={styles.limitControl}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={limitMode}
            exclusive
            onChange={(e, value) => setLimitMode(value)}
            aria-label="Frame/Time limit"
          >
            <ToggleButton value="frames" className="test" sx={toggleStyle}>
              Frames
            </ToggleButton>
            <ToggleButton value="time" sx={toggleStyle}>
              Time
            </ToggleButton>
            <ToggleButton value="none" sx={toggleStyle}>
              None
            </ToggleButton>
          </ToggleButtonGroup>
          {limitMode !== "none" && (
            <TextField
              label={limitMode === "frames" ? "Frames" : "Seconds"}
              size="small"
              value={limit}
              sx={textFieldStyle}
              onChange={(e) => {
                let val = Number(e.currentTarget.value);
                if (limitMode === "frames") val = Math.floor(val);
                setLimit(val);
              }}
              inputProps={{
                step: 1,
                min: 0,
                max: 10000,
                type: "number",
              }}
            />
          )}
        </span>
        <span className={styles.label}>Output</span>
        <Select
          labelId="fileOutType"
          id="select"
          value={output}
          onChange={(e) => setOutput(e.target.value as OutputMode)}
          sx={selectStyle}
          size="small"
        >
          <MenuItem value="png">png</MenuItem>
          <MenuItem value="jpg">jpg</MenuItem>
          <MenuItem value="bmp">bmp</MenuItem>
          <MenuItem value="gif">gif</MenuItem>
          <MenuItem value="video">video</MenuItem>
        </Select>
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
