import Tooltip from "@mui/material/Tooltip";
import React from "react";
import CropFileLoader, { JsonCallback } from "./CropFileLoader";
import CropTable from "./CropTable";

import styles from "@/styles/CropControls.module.css";
import { Crop } from "@/hooks/useFFmpeg";

type Props = {
  parseFramesFileJson: JsonCallback | undefined;
  editCropsCb: ((crops: Crop[]) => void) | undefined;
  cropData: Crop[];
  selecting: boolean;
  setSelecting: (selecting: boolean) => void;
  videoW: number;
  videoH: number;
};

const CropControls = (props: Props) => {
  return (
    <div className={styles.CropControls}>
      <h2>Crop Regions</h2>
      <span className={styles.cropLoad}>
        <Tooltip
          arrow
          title="Click and drag on video frame to create crop areas"
          sx={{ display: "flex" }}
        >
          <label>
            <input
              type="checkbox"
              checked={props.selecting}
              onChange={(e) => props.setSelecting(e.currentTarget.checked)}
            />
            Select Crop Areas
          </label>
        </Tooltip>
        <span>or</span>
        <CropFileLoader parseJsonCb={props.parseFramesFileJson} />
      </span>
      <CropTable
        crops={props.cropData}
        editCb={props.editCropsCb}
        videoW={props.videoW}
        videoH={props.videoH}
      />
    </div>
  );
};

export default CropControls;
