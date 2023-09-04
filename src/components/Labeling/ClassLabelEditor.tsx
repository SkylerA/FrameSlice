import React, {
  ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import ImgGallery from "./ImgGallery";
import LabelEdit, { LABEL_EDIT_IGNORE } from "./LabelEdit";
import FolderLabelLoader from "./FolderLoader";
import Button from "../Button";
import FloatingLabelDropdown from "../FloatingLabelDropdown";

import styles from "@/styles/ClassLabelEditor.module.css";
import {
  classStrSort,
  filterAndIgnoreImgObjs,
  type ImgObj,
} from "@/utils/data";
import classnames from "classnames";
import { downloadLabels } from "@/utils/models";

type Props = ComponentProps<"div"> & {
  data?: ImgObj[];
  showLoadFolder?: boolean;
};

const updateClasses = (
  imgObjs: ImgObj[],
  setClasses: (classes: string[]) => void
) => {
  // collect and store new class options based off data
  const classStrs = imgObjs.map((obj) => obj.classStr);
  const uniqueClasses = new Set(classStrs);
  // remove ignore entry, it will be added manually in the ui
  uniqueClasses.delete(LABEL_EDIT_IGNORE);
  setClasses(Array.from(uniqueClasses).sort());
};

function ClassLabelEditor(props: Props) {
  const { data, showLoadFolder, ...rest } = props;

  const [imgObjs, setImgObjs] = useState<ImgObj[]>([]);
  const [imgUrls, setImgUrls] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("(All)");
  const [selectedImgIdxs, setSelectedImgIdxs] = useState<number[]>([]);
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
    handleData(data ?? []);
  }, [JSON.stringify(data), handleData]);

  const showAll = selectedClass === ALL;

  // Create array with (Ignore) removed and match to selectedClass if not showing All
  const filteredObjs = useMemo(() => {
    const selected = selectedClass === ALL ? [""] : [selectedClass];
    const ignored = [LABEL_EDIT_IGNORE];
    return filterAndIgnoreImgObjs(imgObjs, selected, ignored);
  }, [selectedClass, imgObjs]);

  const urls = filteredObjs.map((img) => img.url); // technically should probably useMemo this, but since react can't properly depend on arrays/objects, the JSON.stringify() to actually check for changes would prolly take longer than just running this line every time.

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
        // update the class of any object with a matching url
        const newObjs: ImgObj[] = updateObjs.map((obj) =>
          updateUrls.includes(obj.url) ? { ...obj, classStr: val } : obj
        );

        setImgObjs(newObjs);
        updateImgFilter(selectedClass, newObjs);
      }
    },
    [selectedClass, JSON.stringify(imgObjs), JSON.stringify(selectedImgIdxs)]
  );

  const getSelectedImgClass = (imgUrlIdx: number) => {
    const url = urls[imgUrlIdx];
    const obj = imgObjs.find((obj) => obj.url === url);
    return obj?.classStr ?? "";
  };

  const withLoader = props.showLoadFolder ? "withLoader" : "";

  // setting up useCallback for proper code, but i think a dep on filteredObjs as an array will currently cause this to update everytime with react's current dep handling
  const download = useCallback(
    () => downloadLabels(filteredObjs),
    [filteredObjs]
  );

  return (
    <div {...rest} className={classnames(styles.LabelEditor, withLoader)}>
      <span className={styles.topControls}>
        {props.showLoadFolder && (
          <span className={styles.loader}>
            <FolderLabelLoader onDataAvail={handleData} />
          </span>
        )}
        {selectedImgIdxs.length > 0 && (
          <LabelEdit
            className={styles.labelEdit}
            classes={classOptions}
            defaultClass={getSelectedImgClass(selectedImgIdxs[0]) ?? ""} // update label to the class of first selected item
            onClassChange={handleEditChange}
          />
        )}
        <span className={styles.labelSelect}>
          {/* Dropdown provides its components without a container for grid layouts so we add a span so things look right in our flex layout */}
          <FloatingLabelDropdown
            className={styles.showing}
            entries={[ALL, ...classOptions, "(Ignore)"]}
            value={selectedClass}
            label="Showing"
            onChange={(e) => setSelectedClass(e.target.value as string)}
          />
        </span>
      </span>
      <ImgGallery
        urls={urls}
        selectedIdxs={selectedImgIdxs}
        onSelectionChanged={(idxs) => setSelectedImgIdxs(idxs)}
        className={styles.imageGallery}
      />
      <div className={styles.bottomControls}>
        {urls.length > 0 && (
          <Button onClick={download}>Download Label Dirs</Button>
        )}
      </div>
    </div>
  );
}

export default ClassLabelEditor;
