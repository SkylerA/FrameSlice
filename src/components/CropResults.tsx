import Tooltip from "@mui/material/Tooltip";
import DownloadIcon from "@mui/icons-material/Download";
import type { NextComponentType } from "next";
import ScrollOnShow from "./ScrollOnShow";
import { saveAs } from "file-saver";
import { fetchAndZipImg } from "@/utils/zip";
import styles from "@/styles/CropResults.module.css";
import { createAutoArrayMap } from "@/utils/data";
import { useMemo } from "react";
import { ImgTypes } from "@/hooks/useFFmpeg";
import Progress from "./Progress";
import { emojiBtnStyle } from "@/styles/MuiStyleObjs";
import ButtonBase from "@mui/material/ButtonBase";
import SvgIcon from "@mui/icons-material/Download";

type Props = {
  cropResults: CropResult[];
  loading: boolean;
  progress?: number;
  extraBtns?: { icon: typeof SvgIcon; toolTip?: string; cb: () => void }[];
};

export type CropResult = {
  url: string;
  name: string | undefined;
  idx: number;
  ext: string;
  classIdx?: number;
};

async function downloadCrops(results: CropResult[]) {
  // Create a zip of all crops in their respective label folders
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // async add images to zip
  const promises = results.map((result) => {
    const zipPath = `${result.name}/${result.idx}.${result.ext}`;
    // dl the img from the url
    return fetchAndZipImg(result.url, zip, zipPath);
  });

  // Wait for all images to dl and then zip everything
  Promise.all(promises).then(() => {
    zip.generateAsync({ type: "blob" }).then((blob) => {
      // Prompt the user to save the file
      saveAs(blob, "Crops.zip");
    });
  });
}

function groupResults(cropResults: CropResult[]) {
  const resultMap = createAutoArrayMap<{
    url: string;
    classIdx: number | undefined;
  }>();

  const isVid = (ext: string) => !ImgTypes.includes(ext) && ext !== "gif";

  let tagType = "";

  // group our urls by crop name
  cropResults.map((result) => {
    resultMap[result.name ?? ""].push({
      url: result.url,
      classIdx: result.classIdx,
    });
    // assuming all results are the same output type
    if (tagType === "") tagType = isVid(result.ext) ? "video" : "img";
  });

  const vid = tagType === "video";

  // get group names
  const keys = Array.from(Reflect.ownKeys(resultMap) as string[]);

  const dispStyle = keys.length > 1 ? styles.column : styles.singleClass;

  // loop through each group and add images to a div
  return keys.map((key) => (
    <div className={dispStyle} key={key}>
      {keys.length > 1 && <h3>{key}</h3>}
      {resultMap[key].map((obj, idx) => {
        const { url, classIdx } = obj;
        if (vid) {
          return (
            <video
              muted
              playsInline
              controls
              autoPlay
              loop
              src={url}
              key={url}
            />
          );
        } else {
          return (
            <span className={styles.result} key={url}>
              <img src={url} key={url} alt={`${url} result ${idx}`} />
              {classIdx}
            </span>
          );
        }
      })}
    </div>
  ));
}

const CropResults: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const crop_results_grouped = useMemo(
    () => groupResults(props.cropResults),
    [JSON.stringify(props.cropResults)]
  );

  return (
    <>
      <div className={styles.headingContainer}>
        <h2>Crop Results</h2>
        {!props.loading && (
          <span className={styles.buttons}>
            <Tooltip arrow title="Download Crops" key="dlCrops">
              <ButtonBase
                focusRipple
                onClick={(e) => downloadCrops(props.cropResults)}
              >
                <DownloadIcon sx={emojiBtnStyle} />
              </ButtonBase>
            </Tooltip>
            {props.extraBtns?.map((btn) => {
              return (
                <Tooltip arrow title={btn.toolTip} key={btn.toolTip?.trim()}>
                  <ButtonBase focusRipple onClick={btn.cb}>
                    <btn.icon sx={emojiBtnStyle} />
                  </ButtonBase>
                </Tooltip>
              );
            })}
          </span>
        )}
      </div>
      {props.loading && (
        <>
          <ScrollOnShow />
          <Progress value={props.progress} />
        </>
      )}
      <div className={styles.cropResults}>{crop_results_grouped}</div>
    </>
  );
};

export default CropResults;
