import React from "react";
import Tooltip from "@mui/material/Tooltip";

import CropFileLoader from "./CropFileLoader";
import CropTable from "./CropTable";
import { Crop } from "@/hooks/useFFmpeg";
import styles from "@/styles/CropControls.module.css";
import Button from "./Button";
import { saveJson, type JsonCallback } from "@/utils/data";

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
      {props.cropData?.length > 0 && (
        <div>
          <Button
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
