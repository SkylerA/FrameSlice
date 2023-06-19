import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup/";
import Tooltip from "@mui/material/Tooltip";
import { NextComponentType } from "next/types";
import { FrameRateMode, LimitMode, OutputMode } from "@/hooks/useFFmpeg";

import styles from "@/styles/FrameControls.module.css";
import {
  selectStyle,
  textFieldStyle,
  toggleStyle,
} from "@/styles/MuiStyleObjs";
import Dropdown from "./Dropdown";

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
            onChange={(e, value) => {
              if (value) setFpsMode(value);
            }}
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
            onChange={(e, value) => {
              if (value) setLimitMode(value);
            }}
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
        <Dropdown
          label="Output"
          value={output}
          // TODO find a way to infer this array from the OutputMode type
          entries={["png", "jpg", "bmp", "gif", "video"]}
          onChangeCb={(val) => setOutput(val as OutputMode)}
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
