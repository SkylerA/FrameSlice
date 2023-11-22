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
  data?: object;
};

const exportPath = (result: CropResult) => `${result.name}/${result.idx}.${result.ext}`;

async function downloadCrops(results: CropResult[], includeImages: boolean = true, includeData: boolean = true) {
  // Create a zip of all crops in their respective label folders
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  let promises: Promise<void>[] = [];

  // Export results data as json
  if (includeData) {
    // Update json paths for exported file path
    const updatedResults = results.map((result) => {
      // Shallow copy the result so we can modify some top level values
      const obj: Record<string, any> = { ...result };
      // Replace url with the export path
      obj["path"] = exportPath(result);
      delete obj["url"];
      delete obj["ext"];

      return obj;
    })
    const json = JSON.stringify(updatedResults);
    zip.file("data.json", json);
  }

  // async add images to zip
  if (includeImages) {
    promises = results.map((result) => {
      const zipPath = exportPath(result);
      // dl the img from the url
      return fetchAndZipImg(result.url, zip, zipPath);
    });
  }

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
    data?: object;
  }>();

  const isVid = (ext: string) => !ImgTypes.includes(ext) && ext !== "gif";

  let tagType = "";

  // group our urls by crop name
  cropResults.map((result) => {
    resultMap[result.name ?? ""].push({
      url: result.url,
      classIdx: result.classIdx,
      data: result.data,
    });
    // assuming all results are the same output type
    if (tagType === "") tagType = isVid(result.ext) ? "video" : "img";
  });

  const vid = tagType === "video";

  // get group names
  const keys = Array.from(Reflect.ownKeys(resultMap) as string[]);

  const dispStyle = keys.length > 1 ? styles.column : styles.singleClass;

  // loop through each group and add images/videos to a div
  return keys.map((key) => (
    <div className={styles.column} key={key}>
      <h3>{key}</h3>
      <span className={styles.row}>
        {resultMap[key].map((obj, idx) => {
          const { url, classIdx, data } = obj;
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
            return <img src={url} key={url} alt={`${url} result ${idx}`} />;
          }
        })}
      </span>
    </div>
  ));
}

const CropResults: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const cropResultsDep = JSON.stringify(props.cropResults);
  const crop_results_grouped = useMemo(
    () => groupResults(props.cropResults),
    [cropResultsDep]
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
