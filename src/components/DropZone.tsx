import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";

const baseStyle = {
  display: "flex",
  flexDirection: "column" as const, // Tyescript complains otherwise...
  justifyContent: "center",
  backgroundColor: "var(--card-bg)",
  color: "var(--card-fg)",
  outline: "none",
  cursor: "pointer",
  height: "10rem",
  width: "20rem",
};

type Props = {
  fileSelectedCb: (file: File) => void;
};

const DropZone = (props: Props) => {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: { "video/*": [] },
    multiple: false,
  });

  useEffect(() => {
    const file = acceptedFiles[0];
    props.fileSelectedCb(file);
  }, [JSON.stringify(acceptedFiles)]);

  return (
    <div
      {...getRootProps({
        className: "dropzone gradient-border",
        style: { ...baseStyle },
      })}
    >
      <input {...getInputProps()} />
      <p>Drag a Video here</p>
      <p>or</p>
      <p>Click to select a file</p>
    </div>
  );
};

export default DropZone;
