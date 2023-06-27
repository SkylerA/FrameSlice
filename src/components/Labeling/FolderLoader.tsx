import Tooltip from "@mui/material/Tooltip";
import React, { useEffect, useRef, useState } from "react";
import Button from "../Button";
import type { ImgObj } from "@/utils/data";

// This will grab the directory above the final file path based off the last slashes
// Ex: Labels/Blah/1.png and Blah/1.png will both return "Blah" as the parent
const getParentDir = (path: string) => {
  const dirStrEndIdx = path.lastIndexOf("/");
  const parent = path.substring(0, dirStrEndIdx);
  const dirStrStartIdx = parent.lastIndexOf("/");

  return dirStrStartIdx < 0 ? parent : parent.substring(dirStrStartIdx + 1);
};

type FolderLoaderProps = {
  onDataAvail?: (data: ImgObj[]) => void;
};

function FolderLabelLoader(props: FolderLoaderProps) {
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [imgObjs, setImgObjs] = useState<ImgObj[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // For whatever reason, typescript or react squawks when these attributes are in the actual jsx so we create it here and then destructure in the render
  const tsFix = { webkitdirectory: "", directory: "" };

  // This will find png and jpg files and store their paths as well as their parent dir as a classname
  const handleSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const subFolderFiles = Array.from(event.target.files ?? []);

    // TODO Add support for other image types
    const foundFiles = subFolderFiles.filter((file) =>
      file.type.startsWith("image")
    );

    setImgFiles(foundFiles);
  };

  // Convert selected images Files to objects with a generated url as well as the img File ref
  useEffect(() => {
    // clean up old objectURLs
    imgObjs.map((obj) => {
      window.URL.revokeObjectURL(obj.url);
    });

    // Create obj array w/ file ref, url, and class (parent dir name)
    const objs = imgFiles.map((file) => {
      return {
        file,
        url: window.URL.createObjectURL(file),
        classStr: getParentDir(file.webkitRelativePath),
      };
    });
    setImgObjs(objs);
  }, [imgFiles.length, JSON.stringify(imgFiles)]); // intentionally ignoring imgObjs as we only use it for cleanup of previous results

  // Alert parent component to new data
  useEffect(() => {
    if (props.onDataAvail) {
      props.onDataAvail(imgObjs);
    }
  }, [imgObjs.length, JSON.stringify(imgObjs)]); // adding props here causes infinite re-renders, i'm using a callback on the cb passed in but it still perma-renders for some reason

  function triggerFileInput(fileRef: React.RefObject<HTMLInputElement>): void {
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  }

  const note =
    "Select a folder of label folders or images.\n\nNOTE: When browsers load local folders, they warn that you are uploading files. This doesn't actually upload to a server, it just loads the images into the browser for display";

  return (
    <>
      <input
        ref={fileRef}
        className="visually-hidden"
        type="file"
        onChange={handleSelection}
        {...tsFix}
      />
      <Tooltip
        arrow
        title={<div style={{ whiteSpace: "pre-line" }}>{note}</div>}
      >
        <Button
          onClick={() => triggerFileInput(fileRef)}
          style={{ whiteSpace: "nowrap", minWidth: "auto" }}
        >
          Load Img Folder
        </Button>
      </Tooltip>
    </>
  );
}

export default FolderLabelLoader;
