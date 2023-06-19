import React from "react";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import { saveAs } from "file-saver";

import CropFileLoader, { JsonCallback } from "./CropFileLoader";
import CropTable from "./CropTable";
import { Crop } from "@/hooks/useFFmpeg";
import styles from "@/styles/CropControls.module.css";

type Props = {
  parseFramesFileJson: JsonCallback | undefined;
  editCropsCb: ((crops: Crop[]) => void) | undefined;
  cropData: Crop[];
  selecting: boolean;
  setSelecting: (selecting: boolean) => void;
  videoW: number;
  videoH: number;
};

function saveJson(obj: object, filename: string): void {
  const jsonStr = JSON.stringify(obj);
  const blob = new Blob([jsonStr], { type: "application/json" });
  saveAs(blob, filename);
}

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
      {props.cropData?.length > 0 && (
        <div>
          <Button
            sx={{ textTransform: "none" }}
            className="gradient-bg"
            variant="contained"
            size="small"
            onClick={() => saveJson(props.cropData, "crops.json")}
          >
            Save Crop File
          </Button>
        </div>
      )}
    </div>
  );
};

export default CropControls;
