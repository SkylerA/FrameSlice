import type { NextComponentType } from "next";
import { useRef } from "react";
import Button from "./Button";
import { JsonCallback, loadJson } from "@/utils/data";

// TODO This is probably not screenreader friendly

export type Props = {
  parseJsonCb?: JsonCallback;
};

function handleCropFileChange(
  e: React.ChangeEvent<HTMLInputElement>,
  cb: JsonCallback | undefined
) {
  const file = e.currentTarget.files?.[0];
  if (file) {
    loadJson(file, cb);
  }
}

const VidCropper: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const cropFileRef = useRef<HTMLInputElement>(null);
  const triggerFileInput = () => {
    if (cropFileRef.current) {
      cropFileRef.current.value = "";
      cropFileRef.current.click();
    }
  };

  return (
    <div>
      <Button onClick={triggerFileInput}>Load Crop File</Button>
      <input
        type="file"
        accept="application/json"
        ref={cropFileRef}
        onChange={(e) => handleCropFileChange(e, props.parseJsonCb)}
        multiple
        hidden
      />
    </div>
  );
};

export default VidCropper;
