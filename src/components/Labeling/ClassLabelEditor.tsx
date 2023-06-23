import React, { useCallback, useEffect, useState } from "react";
import ImgGallery from "./ImgGallery";
import LabelEdit from "./LabelEdit";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import FolderLabelLoader, { imgObj } from "./FolderLoader";
import Button from "../Button";
import FloatingLabelDropdown from "../FloatingLabelDropdown";

// TODO there might be a bug when going between local files and filter results. Might just need to clean imgObjs on switch

// TODO Feature: Add some form of label for class sections
type Props = {
  data?: imgObj[];
  onUpload?: (success: boolean, error?: string) => void;
};

const updateClasses = (
  imgObjs: imgObj[],
  setClasses: (classes: string[]) => void
) => {
  // collect and store new class options based off data
  const classStrs = imgObjs.map((obj) => obj.classStr);
  const uniqueClasses = new Set(classStrs);
  setClasses(Array.from(uniqueClasses).sort());
};

// Helper function to keep typescript from complaining about object.blah references for json results that are typed as objects for now
export const hasGet = <T,>(obj: object, field: string): T | undefined =>
  Object.hasOwn(obj, field) ? (obj[field as keyof typeof obj] as T) : undefined;

function ClassLabelEditor(props: Props) {
  const [imgObjs, setImgObjs] = useState<imgObj[]>([]);
  const [imgUrls, setImgUrls] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("(All)");
  const [selectedImgIdxs, setSelectedImgIdxs] = useState<number[]>([]);
  // const [isUploading, setIsUploading] = useState<boolean>(false);
  const ALL = "(All)";

  useEffect(() => {
    // TODO this has too many cyclical updates currently and fails to render on first show if results are already available
    handleData(props.data ?? []);
  }, [props.data?.length]);

  // Handle user loaded image data
  const handleData = useCallback((data: imgObj[]) => {
    setImgUrls([]); // reset imgUrls, these will get filled in updateImgFilter
    setSelectedClass(ALL); // Reset to All as the previously selected class might not exist as an option anymore

    // store raw data
    setImgObjs(data);

    // collect and store new class options based off data
    updateClasses(data, setClassOptions);
  }, []);

  const classStrSort = (a: imgObj, b: imgObj) => {
    if (a.classStr < b.classStr) return -1;
    if (b.classStr < a.classStr) return 1;
    return 0;
  };

  const updateImgFilter = (selectedClass: string, imgObjs: imgObj[]) => {
    const showAll = selectedClass === ALL;
    const images = showAll
      ? imgObjs.sort(classStrSort)
      : imgObjs.filter((obj) => obj.classStr === selectedClass);
    const urls = images.map((img) => img.url);

    updateClasses(imgObjs, setClassOptions);

    setImgUrls(urls);
    setSelectedImgIdxs([]);
  };

  useEffect(() => {
    updateImgFilter(selectedClass, imgObjs);
  }, [selectedClass, JSON.stringify(imgUrls), JSON.stringify(imgObjs)]);

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
        const updateUrls = selectedImgIdxs.map((idx) => imgUrls[idx]);
        // update the class of any object with a matching url
        const newObjs = updateObjs.map((obj) =>
          updateUrls.includes(obj.url) ? { ...obj, classStr: val } : obj
        );

        setImgObjs(newObjs);
        updateImgFilter(selectedClass, newObjs);
      }
    },
    [selectedClass, JSON.stringify(imgObjs), JSON.stringify(selectedImgIdxs)] // TODO imgObjs and selectedImgIdxs are arrays, might want to do a diff dependency style?
  );

  const getSelectedImgClass = (imgUrlIdx: number) => {
    const url = imgUrls[imgUrlIdx];
    const obj = imgObjs.find((obj) => obj.url === url);
    return obj?.classStr ?? "";
  };

  const fetchAndZipImg = (url: string, zip: JSZip, path: string) => {
    return fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        // Add the image file to the JSZip file
        zip.file(path, blob);
      })
      .catch((error) => {
        console.error(`fetchAndZipImg Error: ${error}`);
      });
  };

  // Create a zip of all crops in their respective label folders
  const downloadAll = () => {
    // TODO download prep can be very slow sometimes and page looks unresponsive. Need to investigate why this goes so slow sometimes or at least put up some progress indicator.
    // TODO need to do research on what happens in a duplicate name is added to zip, probably need to add some checks to update numbers if there is a dupe. In particular if we allow label editing and 1.png of class S get's moved to P that also has 1.png etc etc
    const zip = new JSZip();

    // Add images to zip
    const promises = imgObjs.map((obj, idx) => {
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

  return (
    <div
      className="label-editor-container"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--gap)",
        padding: "var(--gap)",
        // extra space to avoid clipping the Showing label top
        paddingTop: "calc(var(--gap) + .25rem)",
        // Note that margin shouldn't be used at this level as it will add scroll bars to <main> because it is fixed
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--gap)",
        }}
      >
        <FolderLabelLoader onDataAvail={handleData} />
        <span>
          {/* Dropdown provides its components without a container for grid layouts so we add a span so things look right in our flex layout */}
          <FloatingLabelDropdown
            entries={[ALL, ...classOptions]}
            value={selectedClass}
            label="Showing"
            onChange={(e) => setSelectedClass(e.target.value as string)}
          />
        </span>
      </span>
      {selectedImgIdxs.length > 0 && (
        <LabelEdit
          classes={classOptions}
          defaultClass={getSelectedImgClass(selectedImgIdxs[0]) ?? ""} // update label to the class of first selected item
          onClassChange={handleEditChange}
        />
      )}
      <ImgGallery
        urls={imgUrls}
        selectedIdxs={selectedImgIdxs}
        onSelectionChanged={(idxs) => setSelectedImgIdxs(idxs)}
        style={{
          display: "flex",
          flexWrap: "wrap",
          flexGrow: "1",
          overflowY: "auto",
          gap: "var(--gap)",
          justifyContent: "center",
        }}
      />
      <div className="label-editor-controls">
        {imgUrls.length > 0 && (
          <Button onClick={downloadAll}>Download Label Dirs</Button>
        )}
        {/* <button className="small" onClick={uploadLabels}>
          Add Labels to Model {isUploading && <span>🔃</span>}
        </button> */}
      </div>
    </div>
  );
}

export default ClassLabelEditor;
