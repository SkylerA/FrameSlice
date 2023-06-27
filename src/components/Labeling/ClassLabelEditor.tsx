import React, { useCallback, useEffect, useMemo, useState } from "react";
import ImgGallery from "./ImgGallery";
import LabelEdit from "./LabelEdit";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import FolderLabelLoader from "./FolderLoader";
import Button from "../Button";
import FloatingLabelDropdown from "../FloatingLabelDropdown";

import styles from "@/styles/ClassLabelEditor.module.css";
import { fetchAndZipImg } from "@/utils/zip";
import { classStrSort, type ImgObj } from "@/utils/data";

// TODO there might be a bug when going between local files and filter results. Might just need to clean imgObjs on switch

// TODO Feature: Add some form of label for class sections
type Props = {
  data?: ImgObj[];
  onUpload?: (success: boolean, error?: string) => void;
};

const updateClasses = (
  imgObjs: ImgObj[],
  setClasses: (classes: string[]) => void
) => {
  // collect and store new class options based off data
  const classStrs = imgObjs.map((obj) => obj.classStr);
  const uniqueClasses = new Set(classStrs);
  setClasses(Array.from(uniqueClasses).sort());
};

// Create a zip of all crops in their respective label folders
const downloadLabels = (objs: ImgObj[]) => {
  // TODO download prep can be very slow sometimes and page looks unresponsive. Need to investigate why this goes so slow sometimes or at least put up some progress indicator.
  // TODO need to do research on what happens in a duplicate name is added to zip, probably need to add some checks to update numbers if there is a dupe. In particular if we allow label editing and 1.png of class S get's moved to P that also has 1.png etc etc
  const zip = new JSZip();

  // Add images to zip
  const promises = objs.map((obj, idx) => {
    const dir = obj.classStr;
    const zipPath = `Labels/${dir}/${idx}.png`;
    // TODO parse and use actual file extension from original image path

    // Add the file to the zip
    if (obj.file) {
      // If we are working with local files, just save the file
      zip.file(zipPath, obj.file);
      return Promise.resolve();
    } else {
      // If we don't have a file, dl the img from the url
      return fetchAndZipImg(obj.url, zip, zipPath);
    }
  });

  // Wait for all images to dl and then zip everything
  Promise.all(promises).then(() => {
    zip.generateAsync({ type: "blob" }).then((blob) => {
      // Prompt the user to save the file
      saveAs(blob, "classify_labels.zip");
    });
  });
};

// Helper function to keep typescript from complaining about object.blah references for json results that are typed as objects for now
export const hasGet = <T,>(obj: object, field: string): T | undefined =>
  Object.hasOwn(obj, field) ? (obj[field as keyof typeof obj] as T) : undefined;

// Moved out of of compoenent while commented out, might need to update some variables before use
// const uploadLabels = () => {
//   setIsUploading(true);
//   const payload = {
//     modelName: "gg_classify_mobilenet_v3",
//     imgObjs: imgObjs,
//   };
//   console.log(payload);

//   const server = process.env.REACT_APP_SERVER_URL;
//   const url = server + "AddLabels";

//   fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   })
//     .then(fetchGetJson)
//     .then((data: object) => {
//       const success = hasGet<boolean>(data, "success") ?? false;
//       if (success) {
//         props.onUpload?.(success);
//       } else {
//         const error = hasGet<string>(data, "error") ?? "";
//         props.onUpload?.(success, error);
//       }
//     })
//     .catch((error) => {
//       props.onUpload?.(false, error);
//     })
//     .finally(() => setIsUploading(false));
// };

function ClassLabelEditor(props: Props) {
  const [imgObjs, setImgObjs] = useState<ImgObj[]>([]);
  const [imgUrls, setImgUrls] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("(All)");
  const [selectedImgIdxs, setSelectedImgIdxs] = useState<number[]>([]);
  // const [isUploading, setIsUploading] = useState<boolean>(false);
  const ALL = "(All)";

  // Handle user loaded image data
  const handleData = useCallback((data: ImgObj[]) => {
    setImgUrls([]); // reset imgUrls, these will get filled in updateImgFilter
    setSelectedClass(ALL); // Reset to All as the previously selected class might not exist as an option anymore

    // collect and store new class options based off data
    updateClasses(data, setClassOptions);

    // store raw data
    setImgObjs(data);

    updateImgFilter(selectedClass, data);
  }, []);

  useEffect(() => {
    // TODO this has too many cyclical updates currently and fails to render on first show if results are already available
    handleData(props.data ?? []);
  }, [JSON.stringify(props.data)]);

  const showAll = selectedClass === ALL;
  const images = useMemo(
    () =>
      showAll
        ? imgObjs.sort(classStrSort)
        : imgObjs.filter((obj) => obj.classStr === selectedClass),
    [selectedClass, imgObjs, showAll]
  );
  const urls = images.map((img) => img.url); // technically should probably useMemo this, but since react can't properly depend on arrays/objects, the JSON.stringify() to actually check for changes would prolly take longer than just running this line every time.

  const updateImgFilter = (selectedClass: string, objs: ImgObj[]) => {
    const images = showAll
      ? objs.sort(classStrSort)
      : objs.filter((obj) => obj.classStr === selectedClass);
    const urls = images.map((img) => img.url);

    updateClasses(objs, setClassOptions);

    setImgUrls(urls);
    setSelectedImgIdxs([]);
  };

  useEffect(() => {
    updateImgFilter(selectedClass, imgObjs);
  }, [selectedClass]);

  const handleEditChange = useCallback(
    (val: string) => {
      // "" is returned when a LabelEdit is cancelled
      if (val === "") {
        // clear selection
        setSelectedImgIdxs([]);
      } else {
        const updateObjs = [...imgObjs];
        // selectedImgIdxs is relative to imgUrls which is a subset of imgObjs
        // need to use imgUrls to find original imgObj to update
        const updateUrls = selectedImgIdxs.map((idx) => urls[idx]);
        // const updateUrls = selectedImgIdxs.map((idx) => imgUrls[idx]);
        // update the class of any object with a matching url
        const newObjs: ImgObj[] = updateObjs.map((obj) =>
          updateUrls.includes(obj.url) ? { ...obj, classStr: val } : obj
        );

        setImgObjs(newObjs);
        updateImgFilter(selectedClass, newObjs);
      }
    },
    [selectedClass, JSON.stringify(imgObjs), JSON.stringify(selectedImgIdxs)] // TODO imgObjs and selectedImgIdxs are arrays, might want to do a diff dependency style?
  );

  const getSelectedImgClass = (imgUrlIdx: number) => {
    const url = urls[imgUrlIdx];
    const obj = imgObjs.find((obj) => obj.url === url);
    return obj?.classStr ?? "";
  };

  return (
    <div className={styles.LabelEditor}>
      <span className={styles.topControls}>
        <span className={styles.loader}>
          <FolderLabelLoader onDataAvail={handleData} />
        </span>
        {selectedImgIdxs.length > 0 && (
          <LabelEdit
            className={styles.labelEdit}
            classes={classOptions}
            defaultClass={getSelectedImgClass(selectedImgIdxs[0]) ?? ""} // update label to the class of first selected item
            onClassChange={handleEditChange}
          />
        )}
        {urls.length > 0 && (
          <span className={styles.labelSelect}>
            {/* Dropdown provides its components without a container for grid layouts so we add a span so things look right in our flex layout */}
            <FloatingLabelDropdown
              className={styles.showing}
              entries={[ALL, ...classOptions]}
              value={selectedClass}
              label="Showing"
              onChange={(e) => setSelectedClass(e.target.value as string)}
            />
          </span>
        )}
      </span>
      <ImgGallery
        urls={urls}
        selectedIdxs={selectedImgIdxs}
        onSelectionChanged={(idxs) => setSelectedImgIdxs(idxs)}
        className={styles.imageGallery}
      />
      <div className={styles.bottomControls}>
        {urls.length > 0 && (
          <Button onClick={() => downloadLabels(imgObjs)}>
            Download Label Dirs
          </Button>
        )}
        {/* <button className="small" onClick={uploadLabels}>
          Add Labels to Model {isUploading && <span>🔃</span>}
        </button> */}
      </div>
    </div>
  );
}

export default ClassLabelEditor;
