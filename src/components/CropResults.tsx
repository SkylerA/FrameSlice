import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";
import { NextComponentType } from "next";
import ScrollOnShow from "./ScrollOnShow";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { fetchAndZipImg } from "@/utils/files";
import styles from "@/styles/CropResults.module.css";
import { createAutoArrayMap } from "@/utils/data";
import { useMemo } from "react";
import { ImgType, ImgTypes } from "@/hooks/useFFmpeg";

type Props = {
  cropResults: CropResult[];
  loading: boolean;
};

type CropResult = {
  url: string;
  name: string | undefined;
  idx: number;
  ext: string;
};

function downloadCrops(results: CropResult[]): void {
  // Create a zip of all crops in their respective label folders
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
  const resultMap = createAutoArrayMap<string>();

  const isVid = (ext: string) => !ImgTypes.includes(ext) && ext !== "gif";

  let tagType = "";

  // group our urls by crop name
  cropResults.map((result) => {
    resultMap[result.name ?? ""].push(result.url);
    // assuming all results are the same output type
    if (tagType === "") tagType = isVid(result.ext) ? "video" : "img";
  });

  const vid = tagType === "video";

  // get group names
  const keys = Array.from(Reflect.ownKeys(resultMap) as string[]);

  // loop through each group and add images to a div
  return keys.map((key) => (
    <div className={styles.cropGroup} key={key}>
      <h3>{key}</h3>
      {resultMap[key].map((url, idx) => {
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
      <h2>
        Crop Results
        {!props.loading && (
          <Tooltip arrow placement="right" title="Download Crops">
            <IconButton
              focusRipple
              onClick={(e) => downloadCrops(props.cropResults)}
              size="large"
            >
              <DownloadIcon
                sx={{
                  color: "white",
                  background: "var(--gradient-small-btn-bg)",
                  borderRadius: ".25rem",
                }}
              />
            </IconButton>
          </Tooltip>
        )}
      </h2>
      {props.loading && (
        <>
          <ScrollOnShow />
          <CircularProgress sx={{ color: "var(--track-color-right)" }} />
        </>
      )}

      <div className={styles.cropResults}>{crop_results_grouped}</div>
    </>
  );
};

export default CropResults;
